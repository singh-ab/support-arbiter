import type { Context } from "hono";

export const healthController = {
  get: (c: Context) => {
    return c.json({
      ok: true,
      service: "multi-agent-support",
      ts: new Date().toISOString(),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    });
  },
};
