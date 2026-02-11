import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

import { AppError, isAppError, toPublicError } from "@/server/errors/appError";

export type ErrorResponseBody = {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
};

function getRequestId(c: Context): string | undefined {
  const header = c.req.header("x-request-id");
  return header || undefined;
}

export function errorMiddleware() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (err) {
      const requestId = getRequestId(c);

      if (err instanceof HTTPException) {
        const body: ErrorResponseBody = {
          error: {
            code: "HTTP_EXCEPTION",
            message: err.message,
            requestId,
          },
        };
        return c.json(body, err.status);
      }

      if (isAppError(err)) {
        const publicErr = toPublicError(err);
        const body: ErrorResponseBody = {
          error: {
            code: publicErr.code,
            message: publicErr.message,
            requestId,
          },
        };
        return c.json(body, publicErr.status);
      }

      const fallback = new AppError("INTERNAL_ERROR", "Unexpected error", 500);
      const body: ErrorResponseBody = {
        error: {
          code: fallback.code,
          message: fallback.message,
          requestId,
        },
      };
      return c.json(body, 500);
    }
  };
}
