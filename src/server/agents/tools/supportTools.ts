import { z } from "zod";

import type { Tool } from "@/server/agents/types";
import { messageRepo } from "@/server/repos/messageRepo";

const queryHistorySchema = z.object({
  limit: z.number().min(1).max(50).optional(),
});

export const queryConversationHistory: Tool<
  z.infer<typeof queryHistorySchema>,
  Array<{ role: string; content: string; createdAt: Date }>
> = {
  name: "queryConversationHistory",
  description:
    "Retrieves recent conversation history for context and troubleshooting.",
  schema: queryHistorySchema,
  execute: async (input, context) => {
    const limit = input.limit ?? 10;
    const messages = await messageRepo.getRecentByConversation(
      context.conversationId,
      limit,
    );
    return messages.map(
      (m: { role: string; content: string; createdAt: Date }) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }),
    );
  },
};

export const supportTools = [queryConversationHistory];
