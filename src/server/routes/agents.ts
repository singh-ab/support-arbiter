import type { Hono } from "hono";

import { agentsController } from "@/server/controllers/agentsController";

export function registerAgentRoutes(app: Hono) {
  app.get("/agents", agentsController.list);
  app.get("/agents/:type/capabilities", agentsController.capabilities);
}
