import type { Context } from "elysia";
import { OtpError, requestOtp, verifyOtp } from "./otp.service";

type ElysiaSet = Context["set"];

function statusForOtpError(code: string) {
  switch (code) {
    case "EMAIL_EXISTS":
      return 409;
    case "USER_NOT_FOUND":
      return 404;
    case "RESEND_TOO_SOON":
      return 429;
    case "OTP_MAX_ATTEMPTS":
      return 429;
    case "OTP_NOT_FOUND":
      return 404;
    case "OTP_EXPIRED":
    case "OTP_INVALID":
    case "NAME_REQUIRED":
    default:
      return 400;
  }
}

export async function otpRequestController({
  body,
  set,
}: {
  body: { email: string; purpose: "LOGIN" | "REGISTER" | "VERIFY_EMAIL"; name?: string };
  set: ElysiaSet;
}) {
  try {
    return await requestOtp(body);
  } catch (error) {
    if (error instanceof OtpError) {
      set.status = statusForOtpError(error.code);
      if (error.retryAfterSeconds && set.status === 429) {
        const headers = (set.headers ??= {});
        headers["Retry-After"] = String(error.retryAfterSeconds);
      }
      return { error: error.message, code: error.code, retryAfterSeconds: error.retryAfterSeconds };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function otpVerifyController({
  body,
  set,
}: {
  body: { email: string; purpose: "LOGIN" | "REGISTER" | "VERIFY_EMAIL"; code: string };
  set: ElysiaSet;
}) {
  try {
    return await verifyOtp(body);
  } catch (error) {
    if (error instanceof OtpError) {
      set.status = statusForOtpError(error.code);
      if (error.retryAfterSeconds && set.status === 429) {
        const headers = (set.headers ??= {});
        headers["Retry-After"] = String(error.retryAfterSeconds);
      }
      return { error: error.message, code: error.code, retryAfterSeconds: error.retryAfterSeconds };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

