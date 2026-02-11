import { generateText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";

import type {
  AgentContext,
  AgentResponse,
  Tool,
  ToolCall,
} from "@/server/agents/types";
import { billingTools } from "@/server/agents/tools/billingTools";
import { orderTools } from "@/server/agents/tools/orderTools";
import { supportTools } from "@/server/agents/tools/supportTools";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeToolCall(
  tool: Tool<any, any>,
  input: unknown,
  context: AgentContext,
): Promise<ToolCall> {
  try {
    const parsed = tool.schema.parse(input);
    const result = await tool.execute(parsed, context);
    return {
      toolName: tool.name,
      input: input as Record<string, unknown>,
      result,
    };
  } catch (err) {
    return {
      toolName: tool.name,
      input: input as Record<string, unknown>,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function runSupportAgent(
  context: AgentContext,
  toolPlan: Array<{ toolName: string; reasoning: string }>,
): Promise<AgentResponse> {
  const toolCalls: ToolCall[] = [];

  // Execute tools first
  for (const plan of toolPlan) {
    const tool = supportTools.find((t) => t.name === plan.toolName);
    if (!tool) continue;

    const call = await executeToolCall(tool, {}, context);
    toolCalls.push(call);
  }

  // Generate response using tool results
  const toolResultsSummary = toolCalls
    .map((tc) => `${tc.toolName}: ${tc.error ?? JSON.stringify(tc.result)}`)
    .join("\n");

  const systemPrompt = `You are a customer support agent. Use the tool results to answer the user's question.
Be helpful, concise, and professional. If the tools didn't return useful data, provide general guidance.`;

  const userPrompt = `User message: ${context.message}

Tool results:
${toolResultsSummary}

Provide a helpful response.`;

  try {
    const result = await generateText({
      model: deepseek(
        process.env.OPENAI_MODEL ||
          process.env.DEEPSEEK_MODEL ||
          "deepseek-chat",
        {
          apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
        },
      ),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    return {
      content: result.text,
      toolCalls,
    };
  } catch {
    return {
      content:
        "I encountered an error processing your request. Please try again.",
      toolCalls,
    };
  }
}

export async function runOrderAgent(
  context: AgentContext,
  toolPlan: Array<{ toolName: string; reasoning: string }>,
): Promise<AgentResponse> {
  const toolCalls: ToolCall[] = [];

  // Extract order number from message (simple regex)
  const orderMatch = context.message.match(/\b([A-Z]\d{5})\b/);
  const orderNumber = orderMatch?.[1];

  // Execute tools first
  for (const plan of toolPlan) {
    const tool = orderTools.find((t) => t.name === plan.toolName);
    if (!tool || !orderNumber) continue;

    const call = await executeToolCall(tool, { orderNumber }, context);
    toolCalls.push(call);
  }

  const toolResultsSummary = toolCalls
    .map((tc) => `${tc.toolName}: ${tc.error ?? JSON.stringify(tc.result)}`)
    .join("\n");

  const systemPrompt = `You are an order management agent. Use the tool results to provide order status and tracking information.
Be specific about order details. If no order was found, ask the user to confirm the order number.`;

  const userPrompt = `User message: ${context.message}

Tool results:
${toolResultsSummary}

Provide a helpful response about the order.`;

  try {
    const result = await generateText({
      model: deepseek(
        process.env.OPENAI_MODEL ||
          process.env.DEEPSEEK_MODEL ||
          "deepseek-chat",
        {
          apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
        },
      ),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.5,
    });

    return {
      content: result.text,
      toolCalls,
    };
  } catch {
    return {
      content:
        "I encountered an error fetching order information. Please try again.",
      toolCalls,
    };
  }
}

export async function runBillingAgent(
  context: AgentContext,
  toolPlan: Array<{ toolName: string; reasoning: string }>,
): Promise<AgentResponse> {
  const toolCalls: ToolCall[] = [];

  // Extract invoice number from message
  const invoiceMatch = context.message.match(/\b(INV-\d{5})\b/);
  const invoiceNumber = invoiceMatch?.[1];

  // Execute tools first
  for (const plan of toolPlan) {
    const tool = billingTools.find((t) => t.name === plan.toolName);
    if (!tool || !invoiceNumber) continue;

    const call = await executeToolCall(tool, { invoiceNumber }, context);
    toolCalls.push(call);
  }

  const toolResultsSummary = toolCalls
    .map((tc) => `${tc.toolName}: ${tc.error ?? JSON.stringify(tc.result)}`)
    .join("\n");

  const systemPrompt = `You are a billing support agent. Use the tool results to provide invoice and payment information.
Be clear about amounts, statuses, and payment details. If no invoice was found, ask the user to confirm the invoice number.`;

  const userPrompt = `User message: ${context.message}

Tool results:
${toolResultsSummary}

Provide a helpful response about billing.`;

  try {
    const result = await generateText({
      model: deepseek(
        process.env.OPENAI_MODEL ||
          process.env.DEEPSEEK_MODEL ||
          "deepseek-chat",
        {
          apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
        },
      ),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.5,
    });

    return {
      content: result.text,
      toolCalls,
    };
  } catch {
    return {
      content:
        "I encountered an error fetching billing information. Please try again.",
      toolCalls,
    };
  }
}
