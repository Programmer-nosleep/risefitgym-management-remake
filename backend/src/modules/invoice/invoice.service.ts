import type { Role } from "@prisma/client";
import { prisma } from "../../../prisma/schema";

export type InvoiceErrorCode =
  | "ORDER_NOT_FOUND"
  | "PAYMENT_NOT_FOUND"
  | "ORDER_NOT_PAID"
  | "INVOICE_NOT_FOUND"
  | "FORBIDDEN";

export class InvoiceError extends Error {
  code: InvoiceErrorCode;

  constructor(code: InvoiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type Requester = { id: string; role: Role };

function isPrivileged(role: Role) {
  return role === "ADMIN" || role === "BACKOFFICE";
}

const invoiceSelect = {
  id: true,
  orderId: true,
  userId: true,
  amount: true,
  paymentMethod: true,
  status: true,
  transactionId: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          product: { select: { id: true, sku: true, name: true } },
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export async function getInvoice(invoiceId: string, requester: Requester) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: invoiceSelect,
  });

  if (!invoice) throw new InvoiceError("INVOICE_NOT_FOUND", "Invoice not found");

  if (!isPrivileged(requester.role) && invoice.userId !== requester.id) {
    throw new InvoiceError("FORBIDDEN", "Forbidden");
  }

  return { invoice };
}

export async function createInvoiceForOrder(orderId: string, requester: Requester) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true, total: true },
    });

    if (!order) throw new InvoiceError("ORDER_NOT_FOUND", "Order not found");

    if (!isPrivileged(requester.role) && order.userId !== requester.id) {
      throw new InvoiceError("FORBIDDEN", "Forbidden");
    }

    const existing = await tx.invoice.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
      select: invoiceSelect,
    });

    if (existing) return { invoice: existing, created: false as const };

    const orderPaid = order.status === "PAID" || order.status === "COMPLETED";
    if (!orderPaid) throw new InvoiceError("ORDER_NOT_PAID", "Order is not paid");

    const payment = await tx.payment.findFirst({
      where: { orderId: order.id, status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
      select: { id: true, provider: true, amount: true, transactionId: true },
    });

    if (!payment) throw new InvoiceError("PAYMENT_NOT_FOUND", "Payment not found");

    const invoice = await tx.invoice.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        amount: payment.amount,
        paymentMethod: payment.provider,
        status: "PAID",
        transactionId: payment.transactionId ?? payment.id,
      },
      select: invoiceSelect,
    });

    return { invoice, created: true as const };
  });
}
