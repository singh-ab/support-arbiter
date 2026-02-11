import { z } from "zod";

import type { Tool } from "@/server/agents/types";
import { billingRepo } from "@/server/repos/billingRepo";

const getInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
});

export const getInvoiceDetails: Tool<
  z.infer<typeof getInvoiceSchema>,
  unknown | null
> = {
  name: "getInvoiceDetails",
  description:
    "Retrieves invoice details including amounts, status, and payment information.",
  schema: getInvoiceSchema,
  execute: async (input, context) => {
    const invoice = await billingRepo.findInvoiceByNumberForUser({
      userId: context.userId,
      invoiceNumber: input.invoiceNumber,
    });
    if (!invoice) return null;
    return {
      number: invoice.number,
      status: invoice.status,
      subtotalCents: invoice.subtotalCents,
      taxCents: invoice.taxCents,
      totalCents: invoice.totalCents,
      currency: invoice.currency,
      createdAt: invoice.createdAt,
      payment: invoice.payment
        ? {
            provider: invoice.payment.provider,
            status: invoice.payment.status,
            amountCents: invoice.payment.amountCents,
          }
        : null,
    };
  },
};

const checkRefundSchema = z.object({
  invoiceNumber: z.string().min(1),
});

export const checkRefundStatus: Tool<
  z.infer<typeof checkRefundSchema>,
  Array<{ status: string; amountCents: number; createdAt: Date }>
> = {
  name: "checkRefundStatus",
  description: "Checks refund status and history for a given invoice payment.",
  schema: checkRefundSchema,
  execute: async (input, context) => {
    const invoice = await billingRepo.findInvoiceByNumberForUser({
      userId: context.userId,
      invoiceNumber: input.invoiceNumber,
    });
    if (!invoice?.payment) return [];
    const refunds = await billingRepo.findRefundsByPaymentId(
      invoice.payment.id,
    );
    return refunds.map(
      (r: { status: string; amountCents: number; createdAt: Date }) => ({
        status: r.status,
        amountCents: r.amountCents,
        createdAt: r.createdAt,
      }),
    );
  },
};

export const billingTools = [getInvoiceDetails, checkRefundStatus];
