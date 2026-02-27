import type { OAuthProvider } from "@prisma/client";
import { decodeIdToken } from "arctic";
import { prisma } from "../../../prisma/schema";
import { signAccessToken } from "../../../utils/jwt";
import type { AuthSuccess } from "./auth.service";

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

type AppleIdTokenClaims = {
  sub?: string;
  email?: string;
  email_verified?: boolean | "true" | "false";
};

export type OAuthErrorCode =
  | "OAUTH_NOT_CONFIGURED"
  | "OAUTH_STATE_INVALID"
  | "OAUTH_AUTHORIZE_FAILED"
  | "OAUTH_USERINFO_FAILED"
  | "OAUTH_ID_TOKEN_MISSING"
  | "OAUTH_ID_TOKEN_INVALID"
  | "OAUTH_EMAIL_MISSING"
  | "OAUTH_SUB_MISSING";

export class OAuthError extends Error {
  code: OAuthErrorCode;

  constructor(code: OAuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function sanitizeNext(next?: string | null) {
  const value = typeof next === "string" ? next.trim() : "";
  if (!value) return undefined;
  if (!value.startsWith("/")) return undefined;
  if (value.startsWith("//")) return undefined;
  if (value.includes("://")) return undefined;
  return value;
}

async function fetchGoogleUserInfo(accessToken: string) {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new OAuthError("OAUTH_USERINFO_FAILED", `Google userinfo failed (${res.status}): ${body}`);
  }

  return (await res.json()) as GoogleUserInfo;
}

async function upsertOAuthUser(input: {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name: string;
  emailVerifiedAt: Date | null;
}) {
  return await prisma.$transaction(async (tx) => {
    const existingAccount = await tx.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: input.provider,
          providerAccountId: input.providerAccountId,
        },
      },
      select: { userId: true },
    });

    if (existingAccount) {
      return await tx.user.findUniqueOrThrow({
        where: { id: existingAccount.userId },
        select: { id: true, name: true, email: true, role: true },
      });
    }

    const existingUser = await tx.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      await tx.oAuthAccount.create({
        data: {
          userId: existingUser.id,
          provider: input.provider,
          providerAccountId: input.providerAccountId,
        },
        select: { id: true },
      });

      if (input.emailVerifiedAt) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: { emailVerifiedAt: input.emailVerifiedAt },
          select: { id: true },
        });
      }

      return await tx.user.findUniqueOrThrow({
        where: { id: existingUser.id },
        select: { id: true, name: true, email: true, role: true },
      });
    }

    return await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: null,
        role: "USER",
        emailVerifiedAt: input.emailVerifiedAt,
        cart: { create: {} },
        oauthAccounts: {
          create: {
            provider: input.provider,
            providerAccountId: input.providerAccountId,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true },
    });
  });
}

export async function signInWithGoogleAccessToken(input: { accessToken: string }): Promise<AuthSuccess> {
  const profile = await fetchGoogleUserInfo(input.accessToken);

  const providerAccountId = profile.sub;
  if (!providerAccountId) throw new OAuthError("OAUTH_SUB_MISSING", "Google userinfo missing sub");

  const email = profile.email?.trim().toLowerCase();
  if (!email) throw new OAuthError("OAUTH_EMAIL_MISSING", "Google userinfo missing email");

  const name = profile.name?.trim() || email.split("@")[0] || "User";
  const emailVerifiedAt = profile.email_verified ? new Date() : null;

  const user = await upsertOAuthUser({
    provider: "GOOGLE",
    providerAccountId,
    email,
    name,
    emailVerifiedAt,
  });

  const accessToken = await signAccessToken({ userId: user.id, role: user.role });
  return { user, accessToken };
}

export async function signInWithAppleIdToken(input: { idToken: string }): Promise<AuthSuccess> {
  let claims: AppleIdTokenClaims;
  try {
    claims = decodeIdToken(input.idToken) as AppleIdTokenClaims;
  } catch {
    throw new OAuthError("OAUTH_ID_TOKEN_INVALID", "Invalid Apple id_token");
  }

  const providerAccountId = claims.sub;
  if (!providerAccountId) throw new OAuthError("OAUTH_SUB_MISSING", "Apple id_token missing sub");

  const email = claims.email?.trim().toLowerCase();
  if (!email) throw new OAuthError("OAUTH_EMAIL_MISSING", "Apple id_token missing email");

  const emailVerified =
    claims.email_verified === true || claims.email_verified === "true" ? true : false;

  const name = email.split("@")[0] || "User";
  const emailVerifiedAt = emailVerified ? new Date() : null;

  const user = await upsertOAuthUser({
    provider: "APPLE",
    providerAccountId,
    email,
    name,
    emailVerifiedAt,
  });

  const accessToken = await signAccessToken({ userId: user.id, role: user.role });
  return { user, accessToken };
}

