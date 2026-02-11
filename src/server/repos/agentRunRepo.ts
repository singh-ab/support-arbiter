import { prisma } from "@/server/db/prisma";

export const agentRunRepo = {
  create: async (input: {
    conversationId: string;
    messageId?: string | null;
    agentType: string;
    intent?: string | null;
    confidence?: number | null;
    toolCalls?: unknown;
    toolResults?: unknown;
    timingsMs?: unknown;
  }) => {
    return prisma.agentRun.create({
      data: {
        conversationId: input.conversationId,
        messageId: input.messageId ?? null,
        agentType: input.agentType,
        intent: input.intent ?? null,
        confidence: input.confidence ?? null,
        toolCalls: input.toolCalls ?? undefined,
        toolResults: input.toolResults ?? undefined,
        timingsMs: input.timingsMs ?? undefined,
      },
    });
  },
};
