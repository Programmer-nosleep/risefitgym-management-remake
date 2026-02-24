import type { Context } from "elysia";
import { PaymentError, createMidtransCheckoutForOrder, handleMidtransNotification } from "./payments.service";

type ElysiaSet = Context["set"];

export async function createPaymentTokenController({
  body,
  set,
}: {
  body: { orderId: string };
  set: ElysiaSet;
}) {
  try {
    return await createMidtransCheckoutForOrder(body.orderId);
  } catch (error) {
    if (error instanceof PaymentError) {
      set.status = error.code === "ORDER_NOT_FOUND" ? 404 : 400;
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function midtransNotificationController({
  body,
  set,
}: {
  body: any;
  set: ElysiaSet;
}) {
  const result = await handleMidtransNotification(body);
  if (result.ok) return { status: "ok" };

  if (result.error === "INVALID_SIGNATURE") {
    set.status = 401;
    return { status: "error", message: "Invalid signature" };
  }

  if (result.error === "PAYMENT_NOT_FOUND") {
    set.status = 404;
    return { status: "error", message: "Payment not found" };
  }

  set.status = 400;
  return { status: "error", message: "Bad request" };
}
