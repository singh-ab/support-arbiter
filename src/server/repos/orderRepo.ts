import { prisma } from "@/server/db/prisma";

export const orderRepo = {
  findByOrderNumberForUser: async (input: {
    userId: string;
    orderNumber: string;
  }) => {
    return prisma.order.findFirst({
      where: { userId: input.userId, orderNumber: input.orderNumber },
      include: { delivery: true, invoice: true },
    });
  },
};
