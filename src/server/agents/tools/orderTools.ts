import { z } from "zod";

import type { Tool } from "@/server/agents/types";
import { orderRepo } from "@/server/repos/orderRepo";

const fetchOrderSchema = z.object({
  orderNumber: z.string().min(1),
});

export const fetchOrderDetails: Tool<
  z.infer<typeof fetchOrderSchema>,
  { order: unknown; delivery: unknown } | null
> = {
  name: "fetchOrderDetails",
  description:
    "Fetches order details including status, total, and associated delivery.",
  schema: fetchOrderSchema,
  execute: async (input, context) => {
    const order = await orderRepo.findByOrderNumberForUser({
      userId: context.userId,
      orderNumber: input.orderNumber,
    });
    if (!order) return null;
    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalCents: order.totalCents,
        currency: order.currency,
        createdAt: order.createdAt,
      },
      delivery: order.delivery
        ? {
            carrier: order.delivery.carrier,
            trackingCode: order.delivery.trackingCode,
            status: order.delivery.status,
            estimatedDate: order.delivery.estimatedDate,
          }
        : null,
    };
  },
};

const checkDeliverySchema = z.object({
  orderNumber: z.string().min(1),
});

export const checkDeliveryStatus: Tool<
  z.infer<typeof checkDeliverySchema>,
  { trackingCode: string; status: string; estimatedDate: Date | null } | null
> = {
  name: "checkDeliveryStatus",
  description:
    "Checks the current delivery status and tracking information for an order.",
  schema: checkDeliverySchema,
  execute: async (input, context) => {
    const order = await orderRepo.findByOrderNumberForUser({
      userId: context.userId,
      orderNumber: input.orderNumber,
    });
    if (!order?.delivery) return null;
    return {
      trackingCode: order.delivery.trackingCode,
      status: order.delivery.status,
      estimatedDate: order.delivery.estimatedDate,
    };
  },
};

export const orderTools = [fetchOrderDetails, checkDeliveryStatus];
