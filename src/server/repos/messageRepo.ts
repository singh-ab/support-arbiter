import type { MessageRole } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

export const messageRepo = {
  create: async (input: {
    conversationId: string;
    role: MessageRole;
    content: string;
  }) => {
    return prisma.message.create({
      data: {
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
      },
    });
  },

  getRecentByConversation: async (conversationId: string, take: number) => {
    const msgs = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take,
    });
    return msgs.reverse();
  },
};
