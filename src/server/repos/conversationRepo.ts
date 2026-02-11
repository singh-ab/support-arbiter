import { prisma } from "@/server/db/prisma";

export const conversationRepo = {
  create: async (input: { userId: string; title?: string }) => {
    return prisma.conversation.create({
      data: {
        userId: input.userId,
        title: input.title,
      },
    });
  },

  listByUser: async (userId: string) => {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastMessagePreview: c.messages[0]?.content ?? null,
    }));
  },

  getByIdWithMessages: async (id: string) => {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  },

  touch: async (id: string) => {
    return prisma.conversation.update({ where: { id }, data: {} });
  },

  delete: async (id: string) => {
    return prisma.conversation.delete({ where: { id } });
  },
};
