import { Elysia } from "elysia";

const isProduction = process.env.NODE_ENV === "production";

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" && Number.isInteger(status) ? status : null;
}

export const errorMiddleware = new Elysia({ name: "errorMiddleware" }).onError(
  { as: "global" },
  ({ code, error, set, request, path }) => {
    if (error instanceof Response) return error;

    if (code !== "NOT_FOUND") {
      const log = code === "VALIDATION" ? console.warn : console.error;
      log(`[${request.method}] ${path} -> ${code}`, error);
    }

    if (typeof code === "number") {
      set.status = error.code;
      return error.response;
    }

    switch (code) {
      case "NOT_FOUND":
        set.status = 404;
        return { error: "Not Found" };

      case "VALIDATION": {
        set.status = error.status;

        if (isProduction) return { error: "Validation Error" };

        const issues = error.all.map((issue) => ({
          path: issue.path,
          message: issue.message,
          summary: issue.summary,
        }));

        return { error: "Validation Error", issues };
      }

      case "PARSE":
        set.status = error.status;
        return isProduction ? { error: "Bad Request" } : { error: "Bad Request", message: error.message };

      case "INVALID_COOKIE_SIGNATURE":
        set.status = error.status;
        return isProduction
          ? { error: "Invalid Cookie Signature" }
          : { error: "Invalid Cookie Signature", key: error.key };

      case "INVALID_FILE_TYPE":
        set.status = error.status;
        return isProduction
          ? { error: "Invalid File Type" }
          : { error: "Invalid File Type", property: error.property, expected: error.expected };

      case "INTERNAL_SERVER_ERROR":
      case "UNKNOWN":
      default: {
        set.status = getErrorStatus(error) ?? 500;

        if (isProduction) return { error: "Internal Server Error" };

        return {
          error: error instanceof Error && error.message ? error.message : "Internal Server Error",
          code,
          stack: error instanceof Error ? error.stack : undefined,
        };
      }
    }
  }
);
