import { oauth2 } from "elysia-oauth2";
import { env } from "../../config/env";
import { Buffer } from "node:buffer";

function decodePemOrBase64ToUint8Array(input: string): Uint8Array {
  // dotenv often stores multi-line keys as "...\n...\n...".
  const raw = input.trim().replaceAll("\\n", "\n").replaceAll("\\r", "\r");
  if (!raw) throw new Error("Apple private key is empty");

  // Accept either PEM ("-----BEGIN PRIVATE KEY-----") or base64-encoded DER.
  const base64 = raw.includes("-----BEGIN")
    ? raw
        .replaceAll("-----BEGIN PRIVATE KEY-----", "")
        .replaceAll("-----END PRIVATE KEY-----", "")
        .replaceAll(/\s+/g, "")
    : raw.replaceAll(/\s+/g, "");

  const buf = Buffer.from(base64, "base64");
  if (!buf.length) throw new Error("Apple private key decoding failed (empty result)");
  return new Uint8Array(buf);
}

const googleConfigured = Boolean(env.oauth.google.clientId && env.oauth.google.clientSecret && env.oauth.google.redirectUri);
const appleConfigured = Boolean(
  env.oauth.apple.clientId &&
    env.oauth.apple.teamId &&
    env.oauth.apple.keyId &&
    env.oauth.apple.privateKey &&
    env.oauth.apple.redirectUri
);

const providers: Record<string, unknown> = {};

if (googleConfigured) {
  providers.Google = [env.oauth.google.clientId, env.oauth.google.clientSecret, env.oauth.google.redirectUri];
}

if (appleConfigured) {
  providers.Apple = [
    env.oauth.apple.clientId,
    env.oauth.apple.teamId,
    env.oauth.apple.keyId,
    decodePemOrBase64ToUint8Array(env.oauth.apple.privateKey as string),
    env.oauth.apple.redirectUri,
  ];
}

export const oauthConfigured = {
  google: googleConfigured,
  apple: appleConfigured,
} as const;

export const oauth2Plugin = oauth2(providers, {
  cookie: {
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/auth/oauth",
    httpOnly: true,
    maxAge: 60 * 30, // 30 min
  },
});
