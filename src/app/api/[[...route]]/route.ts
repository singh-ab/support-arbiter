import { Hono } from "hono";
import { handle } from "hono/vercel";

import { registerAgentRoutes } from "@/server/routes/agents";
import { registerChatRoutes } from "@/server/routes/chat";
import { registerHealthRoutes } from "@/server/routes/health";
import { errorMiddleware } from "@/server/middleware/errorMiddleware";
import { notFoundMiddleware } from "@/server/middleware/notFoundMiddleware";

export const runtime = "nodejs";

const app = new Hono().basePath("/api");

app.use("*", errorMiddleware());

registerHealthRoutes(app);
registerAgentRoutes(app);
registerChatRoutes(app);

app.use("*", notFoundMiddleware());

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
