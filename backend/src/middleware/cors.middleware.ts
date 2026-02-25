import { Elysia } from "elysia";

function readEnv(name: string) {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  const value = raw.trim();
  return value === "" ? undefined : value;
}

function parseBooleanEnv(name: string, defaultValue: boolean) {
  const raw = readEnv(name);
  if (!raw) return defaultValue;

  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;

  return defaultValue;
}

type OriginResolver = (origin: string | null) => { allowOrigin: string | null; varyOrigin: boolean };

function createOriginResolver(): OriginResolver {
  const originEnv = readEnv("CORS_ORIGIN");

  if (!originEnv) {
    const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
    return (origin) => {
      if (!origin) return { allowOrigin: null, varyOrigin: false };
      if (!localOriginRegex.test(origin)) return { allowOrigin: null, varyOrigin: true };
      return { allowOrigin: origin, varyOrigin: true };
    };
  }

  if (originEnv === "*") {
    return () => ({ allowOrigin: "*", varyOrigin: false });
  }

  const allowed = new Set(
    originEnv
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  );

  return (origin) => {
    if (!origin) return { allowOrigin: null, varyOrigin: true };
    if (!allowed.has(origin)) return { allowOrigin: null, varyOrigin: true };
    return { allowOrigin: origin, varyOrigin: true };
  };
}

const allowMethods = "GET,POST,PATCH,PUT,DELETE,OPTIONS";
const allowHeaders = "Authorization,Content-Type";
const exposeHeaders = "X-RateLimit-Limit,X-RateLimit-Remaining,X-RateLimit-Reset,Retry-After";

const resolveOrigin = createOriginResolver();
const allowCredentials = parseBooleanEnv("CORS_CREDENTIALS", false);

export const corsMiddleware = new Elysia({ name: "corsMiddleware" }).onRequest(
  ({ request, set }) => {
    const originHeader = request.headers.get("origin");
    const { allowOrigin, varyOrigin } = resolveOrigin(originHeader);

    const resHeaders = (set.headers ??= {});

    if (allowOrigin) {
      resHeaders["Access-Control-Allow-Origin"] = allowOrigin;
      resHeaders["Access-Control-Allow-Methods"] = allowMethods;
      resHeaders["Access-Control-Allow-Headers"] = allowHeaders;
      resHeaders["Access-Control-Expose-Headers"] = exposeHeaders;
      resHeaders["Access-Control-Max-Age"] = "600";

      if (allowCredentials && allowOrigin !== "*") {
        resHeaders["Access-Control-Allow-Credentials"] = "true";
      }
    }

    if (varyOrigin) {
      const existing = resHeaders["Vary"];
      resHeaders["Vary"] = existing ? `${existing}, Origin` : "Origin";
    }

    if (request.method === "OPTIONS") {
      set.status = 204;
      return "";
    }
  }
);
