import { jwtVerify, SignJWT } from "jose";
import { prisma } from "../../../prisma/schema";
import { signAccessToken } from "../../../utils/jwt";
import { env } from "../../config/env";
import type { AuthSuccess } from "./auth.service";

type GoogleTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export type OAuthErrorCode =
  | "OAUTH_NOT_CONFIGURED"
  | "OAUTH_STATE_INVALID"
  | "OAUTH_EXCHANGE_FAILED"
  | "OAUTH_USERINFO_FAILED"
  | "OAUTH_EMAIL_MISSING"
  | "OAUTH_SUB_MISSING";

export class OAuthError extends Error {
  code: OAuthErrorCode;

  constructor(code: OAuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const textEncoder = new TextEncoder();

function getStateSecret() {
  return textEncoder.encode(env.jwtSecret);
}

function sanitizeNext(next?: string | null) {
  const value = typeof next === "string" ? next.trim() : "";
  if (!value) return undefined;
  if (!value.startsWith("/")) return undefined;
  if (value.startsWith("//")) return undefined;
  if (value.includes("://")) return undefined;
  return value;
}

async function signOauthState(payload: { next?: string }) {
  const state = sanitizeNext(payload.next);

  return await new SignJWT({ next: state })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getStateSecret());
}

async function verifyOauthState(state: string) {
  try {
    const { payload } = await jwtVerify(state, getStateSecret(), { algorithms: ["HS256"] });
    const next = sanitizeNext(typeof payload.next === "string" ? payload.next : undefined);
    return { next };
  } catch {
    throw new OAuthError("OAUTH_STATE_INVALID", "Invalid OAuth state");
  }
}

export async function getGoogleAuthorizationUrl(input?: { next?: string }) {
  const clientId = env.oauth.google.clientId;
  const redirectUri = env.oauth.google.redirectUri;

  if (!clientId || !redirectUri) {
    throw new OAuthError("OAUTH_NOT_CONFIGURED", "Google OAuth is not configured");
  }

  const state = await signOauthState({ next: input?.next });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  return url.toString();
}

async function exchangeGoogleCode(code: string) {
  const clientId = env.oauth.google.clientId;
  const clientSecret = env.oauth.google.clientSecret;
  const redirectUri = env.oauth.google.redirectUri;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new OAuthError("OAUTH_NOT_CONFIGURED", "Google OAuth is not configured");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new OAuthError("OAUTH_EXCHANGE_FAILED", `Google token exchange failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as GoogleTokenResponse;
  if (!json.access_token) {
    throw new OAuthError("OAUTH_EXCHANGE_FAILED", "Google token exchange failed (missing access_token)");
  }

  return { accessToken: json.access_token };
}

async function fetchGoogleUserInfo(accessToken: string) {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new OAuthError("OAUTH_USERINFO_FAILED", `Google userinfo failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as GoogleUserInfo;
  return json;
}

export async function signInWithGoogleCallback(input: {
  code: string;
  state?: string;
}): Promise<AuthSuccess & { next?: string }> {
  const { next } = input.state ? await verifyOauthState(input.state) : { next: undefined };

  const { accessToken: googleAccessToken } = await exchangeGoogleCode(input.code);
  const profile = await fetchGoogleUserInfo(googleAccessToken);

  const providerAccountId = profile.sub;
  if (!providerAccountId) throw new OAuthError("OAUTH_SUB_MISSING", "Google userinfo missing sub");

  const email = profile.email?.trim().toLowerCase();
  if (!email) throw new OAuthError("OAUTH_EMAIL_MISSING", "Google userinfo missing email");

  const name = profile.name?.trim() || email.split("@")[0] || "User";
  const emailVerifiedAt = profile.email_verified ? new Date() : null;

  const user = await prisma.$transaction(async (tx) => {
    const existingAccount = await tx.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "GOOGLE",
          providerAccountId,
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
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      await tx.oAuthAccount.create({
        data: {
          userId: existingUser.id,
          provider: "GOOGLE",
          providerAccountId,
        },
        select: { id: true },
      });

      if (emailVerifiedAt) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: { emailVerifiedAt },
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
        name,
        email,
        passwordHash: null,
        role: "USER",
        emailVerifiedAt,
        cart: { create: {} },
        oauthAccounts: {
          create: {
            provider: "GOOGLE",
            providerAccountId,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true },
    });
  });

  const accessToken = await signAccessToken({ userId: user.id, role: user.role });
  return { user, accessToken, next };
}

