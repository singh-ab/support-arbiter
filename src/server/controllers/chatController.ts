import type { Context } from "hono";
import { z } from "zod";

import { AppError } from "@/server/errors/appError";
import { chatService } from "@/server/services/chatService";

const postMessageBodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  message: z.string().min(1),
});

export const chatController = {
  postMessage: async (c: Context) => {
    const body = await c.req.json().catch(() => null);
    const parsed = postMessageBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("BAD_REQUEST", "Invalid request body", 400);
    }

    const result = await chatService.handleIncomingMessage(parsed.data);
    return c.json(result);
  },

  listConversations: async (c: Context) => {
    const userId = c.req.query("userId");
    if (!userId) {
      throw new AppError("BAD_REQUEST", "userId query param is required", 400);
    }
    const conversations = await chatService.listConversations(userId);
    return c.json({ conversations });
  },

  getConversation: async (c: Context) => {
    const id = c.req.param("id");
    const conversation = await chatService.getConversation(id);
    if (!conversation) {
      throw new AppError("NOT_FOUND", "Conversation not found", 404);
    }
    return c.json({ conversation });
  },

  deleteConversation: async (c: Context) => {
    const id = c.req.param("id");
    await chatService.deleteConversation(id);
    return c.json({ ok: true });
  },
};
