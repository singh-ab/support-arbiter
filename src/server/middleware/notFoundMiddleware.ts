import type { Context, Next } from "hono";

export function notFoundMiddleware() {
  return async (c: Context, next: Next) => {
    await next();
    if (c.res.status === 404) {
      return c.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Route not found",
          },
        },
        404,
      );
    }
  };
}
