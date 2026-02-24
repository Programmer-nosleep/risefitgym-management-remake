import Midtrans from "midtrans-client";
import { createHash } from "node:crypto";

export function createMidtransSnap() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;

  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY is required");
  if (!clientKey) throw new Error("MIDTRANS_CLIENT_KEY is required");

  return new Midtrans.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey,
    clientKey,
  });
}

export function verifyMidtransNotificationSignature(input: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;

  const raw = `${input.orderId}${input.statusCode}${input.grossAmount}${serverKey}`;
  const expected = createHash("sha512").update(raw).digest("hex");
  return expected === input.signatureKey;
}
