import type { PaymentStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../../../prisma/schema";
import { createMidtransSnap, verifyMidtransNotificationSignature } from "./gateway/midtrans";

export type PaymentErrorCode = "ORDER_NOT_FOUND" | "INVALID_ORDER_STATUS" | "MIDTRANS_CONFIG";

export class PaymentError extends Error {
  code: PaymentErrorCode;

  constructor(code: PaymentErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export async function createMidtransCheckoutForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      total: true,
      status: true,
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          product: { select: { name: true, sku: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  });

  if (!order) throw new PaymentError("ORDER_NOT_FOUND", "Order not found");
  if (order.status !== "PENDING") {
    throw new PaymentError("INVALID_ORDER_STATUS", "Order is not in a payable state");
  }

  const snap = createMidtransSnap();

  const paymentId = randomUUID();

  const parameter = {
    transaction_details: {
      order_id: paymentId,
      gross_amount: order.total,
    },
    credit_card: {
      secure: true,
    },
    item_details: order.items.map((item) => ({
      id: item.product.sku,
      price: item.unitPrice,
      quantity: item.quantity,
      name: item.product.name,
    })),
    customer_details: {
      first_name: order.user.name,
      email: order.user.email,
    },
  };

  const transaction = await snap.createTransaction(parameter);

  const payment = await prisma.payment.create({
    data: {
      id: paymentId,
      orderId: order.id,
      userId: order.userId,
      provider: "MIDTRANS",
      amount: order.total,
      status: "PENDING",
      transactionId: paymentId,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    },
    select: { id: true, token: true, redirectUrl: true, status: true },
  });

  return {
    paymentId: payment.id,
    token: payment.token!,
    redirectUrl: payment.redirectUrl!,
    qrData: payment.redirectUrl!,
  };
}

export async function handleMidtransNotification(body: any) {
  const orderId = String(body.order_id ?? "");
  const transactionStatus = String(body.transaction_status ?? "");
  const fraudStatus = String(body.fraud_status ?? "");
  const statusCode = String(body.status_code ?? "");
  const grossAmount = String(body.gross_amount ?? "");
  const signatureKey = String(body.signature_key ?? "");

  const signatureValid = verifyMidtransNotificationSignature({
    orderId,
    statusCode,
    grossAmount,
    signatureKey,
  });

  if (!signatureValid) {
    return { ok: false as const, error: "INVALID_SIGNATURE" as const };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: orderId },
    select: { id: true, orderId: true, status: true },
  });

  if (!payment) {
    return { ok: false as const, error: "PAYMENT_NOT_FOUND" as const };
  }

  let nextStatus: PaymentStatus = "PENDING";
  if (transactionStatus === "capture") {
    nextStatus = fraudStatus === "challenge" ? "PENDING" : "SUCCESS";
  } else if (transactionStatus === "settlement") {
    nextStatus = "SUCCESS";
  } else if (transactionStatus === "pending") {
    nextStatus = "PENDING";
  } else if (transactionStatus === "expire") {
    nextStatus = "FAILED";
  } else if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "failure") {
    nextStatus = "FAILED";
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: nextStatus },
    });

    if (nextStatus === "SUCCESS") {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID" },
      });
    } else if (nextStatus === "FAILED" && transactionStatus === "expire") {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "EXPIRED" },
      });
    } else if (nextStatus === "FAILED" && transactionStatus === "cancel") {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "CANCELLED" },
      });
    }
  });

  return { ok: true as const };
}
