import { prisma } from "@/server/db/prisma";

export const billingRepo = {
  findInvoiceByNumberForUser: async (input: {
    userId: string;
    invoiceNumber: string;
  }) => {
    return prisma.invoice.findFirst({
      where: {
        number: input.invoiceNumber,
        order: { userId: input.userId },
      },
      include: {
        order: true,
        payment: { include: { refunds: true } },
      },
    });
  },

  findRefundsByPaymentId: async (paymentId: string) => {
    return prisma.refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: "desc" },
    });
  },
};
