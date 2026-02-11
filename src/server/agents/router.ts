import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import type { AgentContext, RouterDecision } from "@/server/agents/types";

const routerDecisionSchema = z.object({
  intent: z.string().describe("The user intent classification"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score between 0 and 1 for the classification"),
  selectedAgent: z
    .enum(["support", "order", "billing"])
    .describe("The specialized agent to handle this request"),
  toolPlan: z
    .array(
      z.object({
        toolName: z.string(),
        reasoning: z.string(),
      }),
    )
    .describe("List of tools the selected agent should use"),
});

export async function runRouter(
  context: AgentContext,
): Promise<RouterDecision> {
  const systemPrompt = `You are a router agent. Analyze the user's message and recent conversation history to determine:
1. The user's intent (e.g., "track_order", "billing_inquiry", "general_support")
2. Your confidence in this classification (0-1)
3. Which specialized agent should handle this: support, order, or billing
4. Which tools that agent should use

Agent capabilities:
- support: queryConversationHistory (for FAQs, troubleshooting, general questions)
- order: fetchOrderDetails, checkDeliveryStatus (for order tracking, modifications)
- billing: getInvoiceDetails, checkRefundStatus (for payments, refunds, invoices)

Extract any entities like order numbers, invoice numbers from the message.`;

  const userPrompt = `Recent conversation:
${context.recentHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}

Current message: ${context.message}

Classify this request and suggest a tool plan.`;

  try {
    const result = await generateObject({
      model: google(
        process.env.GOOGLE_GENERATIVE_AI_MODEL || "gemini-2.0-flash-exp",
        {
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        },
      ),
      schema: routerDecisionSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });

    // Clamp confidence
    const decision = result.object;
    decision.confidence = Math.max(0, Math.min(1, decision.confidence));

    return decision;
  } catch (error) {
    console.error("Router LLM call failed:", error);
    // Fallback to support agent
    return {
      intent: "unknown",
      confidence: 0.1,
      selectedAgent: "support",
      toolPlan: [
        {
          toolName: "queryConversationHistory",
          reasoning: "Fallback due to error",
        },
      ],
    };
  }
}
