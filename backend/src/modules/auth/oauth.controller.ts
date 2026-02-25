import type { Context } from "elysia";
import { env } from "../../config/env";
import { getGoogleAuthorizationUrl, OAuthError, signInWithGoogleCallback } from "./oauth.service";

type ElysiaSet = Context["set"];

function statusForOAuthError(code: string) {
  switch (code) {
    case "OAUTH_NOT_CONFIGURED":
      return 500;
    case "OAUTH_STATE_INVALID":
      return 400;
    case "OAUTH_EXCHANGE_FAILED":
    case "OAUTH_USERINFO_FAILED":
    case "OAUTH_EMAIL_MISSING":
    case "OAUTH_SUB_MISSING":
    default:
      return 400;
  }
}

export async function googleOauthStartController({
  query,
  set,
}: {
  query: { next?: string };
  set: ElysiaSet;
}) {
  try {
    const url = await getGoogleAuthorizationUrl({ next: query.next });
    set.status = 302;
    return Response.redirect(url, 302);
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
}: {
  query: { code?: string; state?: string; error?: string };
  set: ElysiaSet;
}) {
  const callbackUrl = new URL("/oauth/callback", env.webUrl);

  if (query.error) {
    callbackUrl.hash = `error=${encodeURIComponent(query.error)}`;
    set.status = 302;
    return Response.redirect(callbackUrl.toString(), 302);
  }

  if (!query.code) {
    callbackUrl.hash = `error=${encodeURIComponent("missing_code")}`;
    set.status = 302;
    return Response.redirect(callbackUrl.toString(), 302);
  }

  try {
    const result = await signInWithGoogleCallback({ code: query.code, state: query.state });
    const parts = new URLSearchParams();
    parts.set("accessToken", result.accessToken);
    if (result.next) parts.set("next", result.next);
    callbackUrl.hash = parts.toString();

    set.status = 302;
    return Response.redirect(callbackUrl.toString(), 302);
  } catch (error) {
    if (error instanceof OAuthError) {
      callbackUrl.hash = `error=${encodeURIComponent(error.code)}`;
      set.status = 302;
      return Response.redirect(callbackUrl.toString(), 302);
    }

    callbackUrl.hash = `error=${encodeURIComponent("unknown")}`;
    set.status = 302;
    return Response.redirect(callbackUrl.toString(), 302);
  }
}

