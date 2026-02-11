import type { Hono } from "hono";

import { chatController } from "@/server/controllers/chatController";

export function registerChatRoutes(app: Hono) {
  app.post("/chat/messages", chatController.postMessage);
  app.get("/chat/conversations", chatController.listConversations);
  app.get("/chat/conversations/:id", chatController.getConversation);
  app.delete("/chat/conversations/:id", chatController.deleteConversation);
}
