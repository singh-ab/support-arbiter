export type AgentType = "router" | "support" | "order" | "billing";

export function listAgents() {
  return [
    { type: "router" as const, name: "Router Agent" },
    { type: "support" as const, name: "Support Agent" },
    { type: "order" as const, name: "Order Agent" },
    { type: "billing" as const, name: "Billing Agent" },
  ];
}

export function getAgentCapabilities(type: AgentType) {
  switch (type) {
    case "router":
      return {
        description: "Classifies intent and delegates to specialized agents.",
        outputs: ["intent", "confidence", "selectedAgent", "toolPlan"],
      };
    case "support":
      return {
        description:
          "General support, FAQs, troubleshooting using conversation history.",
        tools: ["queryConversationHistory"],
      };
    case "order":
      return {
        description: "Order status, tracking, modifications, cancellations.",
        tools: ["fetchOrderDetails", "checkDeliveryStatus"],
      };
    case "billing":
      return {
        description: "Payments, refunds, invoices, subscriptions.",
        tools: ["getInvoiceDetails", "checkRefundStatus"],
      };
    default:
      return null;
  }
}
