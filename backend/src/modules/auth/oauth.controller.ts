import type { Context } from "elysia";
import { env } from "../../config/env";
import { oauthConfigured } from "./oauth2.plugin";
import {
  OAuthError,
  sanitizeNext,
  signInWithAppleIdToken,
  signInWithGoogleAccessToken,
} from "./oauth.service";

type ElysiaSet = Context["set"];

function statusForOAuthError(code: string) {
  switch (code) {
    case "OAUTH_NOT_CONFIGURED":
      return 500;
    case "OAUTH_STATE_INVALID":
      return 400;
    default:
      return 400;
  }
}

function getOauthCookieOptions() {
  return {
    secure: env.cookieSecure,
    sameSite: "lax" as const,
    path: "/auth/oauth",
    httpOnly: true,
    maxAge: 60 * 30, // 30 min
  };
}

function setOauthNextCookie(cookie: any, next?: string) {
  const safeNext = sanitizeNext(next);
  if (!safeNext) {
    cookie.oauthNext?.remove?.();
    return;
  }

  cookie.oauthNext.set({ value: safeNext, ...getOauthCookieOptions() });
}

function readAndClearOauthNextCookie(cookie: any) {
  const value = sanitizeNext(cookie.oauthNext?.value);
  cookie.oauthNext?.remove?.();
  return value;
}

function redirectToFrontend({
  set,
  accessToken,
  next,
  error,
}: {
  set: ElysiaSet;
  accessToken?: string;
  next?: string;
  error?: string;
}) {
  const callbackUrl = new URL("/oauth/callback", env.webUrl);

  if (error) {
    callbackUrl.hash = `error=${encodeURIComponent(error)}`;
    set.status = 302;
    return Response.redirect(callbackUrl.toString(), 302);
  }

  if (!accessToken) {
    callbackUrl.hash = `error=${encodeURIComponent("missing_access_token")}`;
    set.status = 302;
    return Response.redirect(callbackUrl.toString(), 302);
  }

  const parts = new URLSearchParams();
  parts.set("accessToken", accessToken);
  if (next) parts.set("next", next);
  callbackUrl.hash = parts.toString();

  set.status = 302;
  return Response.redirect(callbackUrl.toString(), 302);
}

export async function googleOauthStartController({
  query,
  set,
  oauth2,
  cookie,
  redirect,
}: {
  query: { next?: string };
  set: ElysiaSet;
  oauth2: any;
  cookie: any;
  redirect: (url: string) => Response;
}) {
  try {
    if (!oauthConfigured.google) {
      throw new OAuthError("OAUTH_NOT_CONFIGURED", "Google OAuth is not configured");
    }

    setOauthNextCookie(cookie, query.next);

    const url = oauth2.createURL("Google", ["openid", "email", "profile"]);
    url.searchParams.set("prompt", "select_account");

    return redirect(url.toString());
  } catch (error) {
    if (error instanceof OAuthError) {
      set.status = statusForOAuthError(error.code);
      return { error: error.message, code: error.code };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function googleOauthCallbackController({
  query,
  set,
  oauth2,
  cookie,
}: {
  query: { code?: string; state?: string; error?: string };
  set: ElysiaSet;
  oauth2: any;
  cookie: any;
}) {
  if (query.error) {
    readAndClearOauthNextCookie(cookie);
    return redirectToFrontend({ set, error: query.error });
  }

  if (!query.code) {
    readAndClearOauthNextCookie(cookie);
    return redirectToFrontend({ set, error: "missing_code" });
  }

  try {
    const tokens = await oauth2.authorize("Google");
    const googleAccessToken = tokens.accessToken();

    const result = await signInWithGoogleAccessToken({ accessToken: googleAccessToken });
    const next = readAndClearOauthNextCookie(cookie);

    return redirectToFrontend({ set, accessToken: result.accessToken, next });
  } catch (error) {
    readAndClearOauthNextCookie(cookie);

    if (error instanceof OAuthError) {
      return redirectToFrontend({ set, error: error.code });
    }

    if (error instanceof Error && error.message === "state mismatch") {
      return redirectToFrontend({ set, error: "OAUTH_STATE_INVALID" });
    }

    return redirectToFrontend({ set, error: "unknown" });
  }
}

export async function appleOauthStartController({
  query,
  set,
  oauth2,
  cookie,
  redirect,
}: {
  query: { next?: string };
  set: ElysiaSet;
  oauth2: any;
  cookie: any;
  redirect: (url: string) => Response;
}) {
  try {
    if (!oauthConfigured.apple) {
      throw new OAuthError("OAUTH_NOT_CONFIGURED", "Apple OAuth is not configured");
    }

    setOauthNextCookie(cookie, query.next);

    const url = oauth2.createURL("Apple", ["email", "name"]);
    url.searchParams.set("response_mode", "query");
    return redirect(url.toString());
  } catch (error) {
    if (error instanceof OAuthError) {
      set.status = statusForOAuthError(error.code);
      return { error: error.message, code: error.code };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  }
}

export async function appleOauthCallbackController({
  query,
  set,
  oauth2,
  cookie,
}: {
  query: { code?: string; state?: string; error?: string };
  set: ElysiaSet;
  oauth2: any;
  cookie: any;
}) {
  if (query.error) {
    readAndClearOauthNextCookie(cookie);
    return redirectToFrontend({ set, error: query.error });
  }

  if (!query.code) {
    readAndClearOauthNextCookie(cookie);
    return redirectToFrontend({ set, error: "missing_code" });
  }

  try {
    const tokens = await oauth2.authorize("Apple");

    let idToken: string;
    try {
      idToken = tokens.idToken();
    } catch {
      throw new OAuthError("OAUTH_ID_TOKEN_MISSING", "Apple token response missing id_token");
    }

    const result = await signInWithAppleIdToken({ idToken });
    const next = readAndClearOauthNextCookie(cookie);

    return redirectToFrontend({ set, accessToken: result.accessToken, next });
  } catch (error) {
    readAndClearOauthNextCookie(cookie);

    if (error instanceof OAuthError) {
      return redirectToFrontend({ set, error: error.code });
    }

    if (error instanceof Error && error.message === "state mismatch") {
      return redirectToFrontend({ set, error: "OAUTH_STATE_INVALID" });
    }

    return redirectToFrontend({ set, error: "unknown" });
  }
}

