import { Elysia } from "elysia";
import type { Context } from "elysia";

type RateLimitContext = Context & { authUser?: { id: string } | null };

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  bucket: string;
  standardHeaders: boolean;
  message: string;
  keyGenerator?: (context: RateLimitContext) => string | Promise<string>;
  skip?: (context: RateLimitContext) => boolean | Promise<boolean>;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

function firstIpFromXForwardedFor(value: string) {
  const first = value.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

function getClientIp(headers: Context["headers"]) {
  const xForwardedFor = headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string") {
    const ip = firstIpFromXForwardedFor(xForwardedFor);
    if (ip) return ip;
  }

  const xRealIp = headers["x-real-ip"];
  if (typeof xRealIp === "string" && xRealIp.trim()) return xRealIp.trim();

  const cfConnectingIp = headers["cf-connecting-ip"];
  if (typeof cfConnectingIp === "string" && cfConnectingIp.trim()) return cfConnectingIp.trim();

  return "unknown";
}

function defaultKey(context: RateLimitContext) {
  const userId = context.authUser?.id;
  if (typeof userId === "string" && userId.length > 0) return `user:${userId}`;
  return `ip:${getClientIp(context.headers)}`;
}

function setRateLimitHeaders(input: {
  set: Context["set"];
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}) {
  const headers = (input.set.headers ??= {});

  headers["X-RateLimit-Limit"] = String(input.limit);
  headers["X-RateLimit-Remaining"] = String(input.remaining);
  headers["X-RateLimit-Reset"] = String(Math.ceil(input.resetAt / 1000));

  if (typeof input.retryAfterSeconds === "number") {
    headers["Retry-After"] = String(input.retryAfterSeconds);
  }
}

export function rateLimit(partialOptions?: Partial<RateLimitOptions>) {
  const options: RateLimitOptions = {
    windowMs: 60_000,
    max: 120,
    bucket: "global",
    standardHeaders: true,
    message: "Too Many Requests",
    ...partialOptions,
  };

  if (!Number.isFinite(options.windowMs) || options.windowMs <= 0) {
    throw new Error("rateLimit: windowMs must be a positive number");
  }
  if (!Number.isFinite(options.max) || options.max <= 0) {
    throw new Error("rateLimit: max must be a positive number");
  }

  const store = new Map<string, RateLimitEntry>();
  let lastCleanupAt = 0;

  function cleanup(now: number) {
    if (now - lastCleanupAt < options.windowMs) return;
    lastCleanupAt = now;
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }

  return new Elysia().onBeforeHandle(async (context) => {
    cleanup(Date.now());

    if (options.skip && (await options.skip(context as RateLimitContext))) return;

    const keySuffix = options.keyGenerator
      ? await options.keyGenerator(context as RateLimitContext)
      : defaultKey(context as RateLimitContext);
    const key = `${options.bucket}:${keySuffix}`;

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });

      if (options.standardHeaders) {
        setRateLimitHeaders({
          set: context.set,
          limit: options.max,
          remaining: Math.max(0, options.max - 1),
          resetAt: now + options.windowMs,
        });
      }

      return;
    }

    entry.count += 1;

    const remaining = Math.max(0, options.max - entry.count);
    const overLimit = entry.count > options.max;

    if (options.standardHeaders) {
      setRateLimitHeaders({
        set: context.set,
        limit: options.max,
        remaining,
        resetAt: entry.resetAt,
        retryAfterSeconds: overLimit ? Math.max(0, Math.ceil((entry.resetAt - now) / 1000)) : undefined,
      });
    }

    if (overLimit) {
      context.set.status = 429;
      return {
        error: options.message,
        retryAfterSeconds: Math.max(0, Math.ceil((entry.resetAt - now) / 1000)),
      };
    }
  });
}

export const ratelimitMiddleware = rateLimit();
