import crypto from "node:crypto";
import { prisma } from "../../../prisma/schema";
import { sendEmail } from "../../../utils/email";
import { signAccessToken } from "../../../utils/jwt";
import { env } from "../../config/env";
import type { AuthSuccess, PublicUser } from "./auth.service";

export type OtpPurpose = "LOGIN" | "REGISTER" | "VERIFY_EMAIL";

export type OtpRequestResult = {
  ok: true;
  purpose: OtpPurpose;
  email: string;
  expiresAt: Date;
};

export type OtpErrorCode =
  | "EMAIL_EXISTS"
  | "USER_NOT_FOUND"
  | "NAME_REQUIRED"
  | "RESEND_TOO_SOON"
  | "OTP_NOT_FOUND"
  | "OTP_EXPIRED"
  | "OTP_INVALID"
  | "OTP_MAX_ATTEMPTS";

export class OtpError extends Error {
  code: OtpErrorCode;
  retryAfterSeconds?: number;

  constructor(code: OtpErrorCode, message: string, options?: { retryAfterSeconds?: number }) {
    super(message);
    this.code = code;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function generateOtpCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashOtpCode(code: string) {
  return crypto.createHmac("sha256", env.otp.secret).update(code).digest("hex");
}

function timingSafeHexEqual(aHex: string, bHex: string) {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function formatOtpEmail(purpose: OtpPurpose, code: string) {
  const expiresText = `${env.otp.ttlMinutes} minutes`;

  const subject =
    purpose === "LOGIN"
      ? `Your Risefit sign-in code: ${code}`
      : purpose === "REGISTER"
        ? `Your Risefit sign-up code: ${code}`
        : `Your Risefit verification code: ${code}`;

  const text = [
    `Your one-time code is: ${code}`,
    ``,
    `This code expires in ${expiresText}.`,
    ``,
    `If you didn't request this code, you can ignore this email.`,
  ].join("\n");

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
      <h2 style="margin:0 0 12px 0;">Sign in to Risefit</h2>
      <p style="margin:0 0 16px 0;">Your one-time code is:</p>
      <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 0 0 16px 0;">${code}</div>
      <p style="margin:0 0 16px 0; color:#6b7280;">This code expires in ${expiresText}.</p>
      <p style="margin:0; color:#6b7280;">If you didn't request this, you can ignore this email.</p>
    </div>
  `.trim();

  return { subject, text, html };
}

export async function requestOtp(input: {
  email: string;
  purpose: OtpPurpose;
  name?: string;
}): Promise<OtpRequestResult> {
  const email = normalizeEmail(input.email);

  if (input.purpose === "REGISTER") {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name) throw new OtpError("NAME_REQUIRED", "Name is required");

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) throw new OtpError("EMAIL_EXISTS", "Email already in use");
  }

  if (input.purpose === "LOGIN") {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!existing) throw new OtpError("USER_NOT_FOUND", "User not found");
  }

  if (input.purpose === "VERIFY_EMAIL") {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!existing) throw new OtpError("USER_NOT_FOUND", "User not found");
  }

  const latest = await prisma.otpToken.findFirst({
    where: { email, purpose: input.purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, expiresAt: true },
  });

  const now = new Date();
  if (latest) {
    const ageSeconds = Math.floor((now.getTime() - latest.createdAt.getTime()) / 1000);
    const retryAfterSeconds = env.otp.resendCooldownSeconds - ageSeconds;
    if (retryAfterSeconds > 0) {
      throw new OtpError("RESEND_TOO_SOON", "Please wait before requesting a new code", {
        retryAfterSeconds,
      });
    }
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(now.getTime() + env.otp.ttlMinutes * 60_000);

  await prisma.$transaction(async (tx) => {
    await tx.otpToken.updateMany({
      where: { email, purpose: input.purpose, consumedAt: null },
      data: { consumedAt: now },
    });

    await tx.otpToken.create({
      data: {
        email,
        purpose: input.purpose,
        codeHash,
        name: input.purpose === "REGISTER" ? input.name?.trim() : undefined,
        expiresAt,
      },
      select: { id: true },
    });
  });

  const mail = formatOtpEmail(input.purpose, code);
  await sendEmail({
    to: email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  return { ok: true, purpose: input.purpose, email, expiresAt };
}

async function issueAuthForUser(user: PublicUser): Promise<AuthSuccess> {
  const accessToken = await signAccessToken({ userId: user.id, role: user.role });
  return { user, accessToken };
}

export async function verifyOtp(input: {
  email: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<AuthSuccess> {
  const email = normalizeEmail(input.email);
  const code = input.code.trim();

  if (!/^\d{6}$/.test(code)) {
    throw new OtpError("OTP_INVALID", "Invalid code");
  }

  const now = new Date();
  const token = await prisma.otpToken.findFirst({
    where: { email, purpose: input.purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, codeHash: true, expiresAt: true, attempts: true, name: true },
  });

  if (!token) throw new OtpError("OTP_NOT_FOUND", "Code not found");
  if (token.expiresAt.getTime() <= now.getTime()) {
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { consumedAt: now },
      select: { id: true },
    });
    throw new OtpError("OTP_EXPIRED", "Code has expired");
  }

  if (token.attempts >= env.otp.maxAttempts) {
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { consumedAt: now },
      select: { id: true },
    });
    throw new OtpError("OTP_MAX_ATTEMPTS", "Too many attempts");
  }

  const expectedHash = token.codeHash;
  const actualHash = hashOtpCode(code);

  if (!timingSafeHexEqual(expectedHash, actualHash)) {
    const nextAttempts = token.attempts + 1;
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { attempts: nextAttempts, ...(nextAttempts >= env.otp.maxAttempts ? { consumedAt: now } : {}) },
      select: { id: true },
    });
    throw new OtpError("OTP_INVALID", "Invalid code");
  }

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { consumedAt: now },
    select: { id: true },
  });

  if (input.purpose === "REGISTER") {
    const name = (token.name ?? "").trim();
    if (!name) throw new OtpError("NAME_REQUIRED", "Name is required");

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: null,
        role: "USER",
        emailVerifiedAt: now,
        cart: { create: {} },
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return await issueAuthForUser(user);
  }

  if (input.purpose === "VERIFY_EMAIL") {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!existing) throw new OtpError("USER_NOT_FOUND", "User not found");

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: { emailVerifiedAt: now },
      select: { id: true, name: true, email: true, role: true },
    });

    return await issueAuthForUser(user);
  }

  // LOGIN
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!existing) throw new OtpError("USER_NOT_FOUND", "User not found");

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: { emailVerifiedAt: now },
    select: { id: true, name: true, email: true, role: true },
  });

  return await issueAuthForUser(user);
}
