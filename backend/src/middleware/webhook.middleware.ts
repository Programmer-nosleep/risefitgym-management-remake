import { Elysia } from "elysia";
import { verifyMidtransNotificationSignature } from "../modules/paymets/gateway/midtrans";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function getStringField(obj: Record<string, unknown>, key: string) {
  const v = obj[key];
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function normalizePath(pathname: string) {
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function isMidtransNotificationPath(pathname: string) {
  const normalized = normalizePath(pathname);
  return normalized.endsWith("/payment/notification");
}

export const midtransWebhookMiddleware = new Elysia().onBeforeHandle(({ request, body, set }) => {
  const pathname = new URL(request.url).pathname;
  if (!isMidtransNotificationPath(pathname)) return;

  if (!process.env.MIDTRANS_SERVER_KEY) {
    set.status = 500;
    return { error: "MIDTRANS_SERVER_KEY is required" };
  }

  const payload = asRecord(body);
  if (!payload) {
    set.status = 400;
    return { error: "Invalid payload" };
  }

  const orderId = getStringField(payload, "order_id");
  const statusCode = getStringField(payload, "status_code");
  const grossAmount = getStringField(payload, "gross_amount");
  const signatureKey = getStringField(payload, "signature_key");

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    set.status = 400;
    return { error: "Invalid payload" };
  }

  const signatureValid = verifyMidtransNotificationSignature({
    orderId,
    statusCode,
    grossAmount,
    signatureKey,
  });

  if (!signatureValid) {
    set.status = 401;
    return { error: "Invalid signature" };
  }
});
