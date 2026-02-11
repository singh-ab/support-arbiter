import type { z } from "zod";

export type AgentType = "router" | "support" | "order" | "billing";

export type ToolCall = {
  toolName: string;
  input: Record<string, unknown>;
  result?: unknown;
  error?: string;
};

export type AgentContext = {
  userId: string;
  conversationId: string;
  message: string;
  recentHistory: Array<{ role: string; content: string }>;
};

export type RouterDecision = {
  intent: string;
  confidence: number;
  selectedAgent: "support" | "order" | "billing";
  toolPlan: Array<{ toolName: string; reasoning: string }>;
};

export type AgentResponse = {
  content: string;
  toolCalls: ToolCall[];
};

export type Tool<TInput = unknown, TOutput = unknown> = {
  name: string;
  description: string;
  schema: z.ZodSchema<TInput>;
  execute: (input: TInput, context: AgentContext) => Promise<TOutput>;
};
