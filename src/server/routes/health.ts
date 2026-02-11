import type { Hono } from "hono";

import { healthController } from "@/server/controllers/healthController";

export function registerHealthRoutes(app: Hono) {
  app.get("/health", healthController.get);
}
