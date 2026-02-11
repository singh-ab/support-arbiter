import type { AgentContext } from "@/server/agents/types";
import { runRouter } from "@/server/agents/router";
import {
  runSupportAgent,
  runOrderAgent,
  runBillingAgent,
} from "@/server/agents/subAgents";
import { agentRunRepo } from "@/server/repos/agentRunRepo";
import { conversationRepo } from "@/server/repos/conversationRepo";
import { messageRepo } from "@/server/repos/messageRepo";
import { userRepo } from "@/server/repos/userRepo";

export type IncomingMessageInput = {
  conversationId?: string | null;
  userId?: string;
  message: string;
};

export const chatService = {
  handleIncomingMessage: async (input: IncomingMessageInput) => {
    const startTime = Date.now();

    // to ensure user exists ( seeded demo user if present)
    const demoEmail = "demo@acme.com";
    const seededDemoUser = await userRepo.getByEmail(demoEmail);

    let userId = input.userId?.trim();
    if (!userId || userId === "demo-user") {
      userId = seededDemoUser?.id ?? userId ?? "demo-user";
    }

    await userRepo.upsertMinimal({
      id: userId,
      name: "Demo User",
      ...(userId === "demo-user" ? { email: demoEmail } : null),
    });

    // Get or create conversation
    let conversationId = input.conversationId;
    if (!conversationId) {
      const conv = await conversationRepo.create({ userId });
      conversationId = conv.id;
    }

    // Persist user message
    const userMessage = await messageRepo.create({
      conversationId,
      role: "user",
      content: input.message,
    });

    // Load recent conversation history for context
    const recentMessages = await messageRepo.getRecentByConversation(
      conversationId,
      10,
    );
    const history = recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const context: AgentContext = {
      userId,
      conversationId,
      message: input.message,
      recentHistory: history,
    };

    // Run router agent
    const routerStart = Date.now();
    const routerDecision = await runRouter(context);
    const routerTime = Date.now() - routerStart;

    console.info("[agent:router]", {
      conversationId,
      userId,
      intent: routerDecision.intent,
      confidence: routerDecision.confidence,
      selectedAgent: routerDecision.selectedAgent,
      toolPlan: routerDecision.toolPlan.map((tool) => tool.toolName),
    });

    // Persist router decision
    await agentRunRepo.create({
      conversationId,
      messageId: userMessage.id,
      agentType: "router",
      intent: routerDecision.intent,
      confidence: routerDecision.confidence,
      toolCalls: routerDecision.toolPlan,
      timingsMs: { router: routerTime },
    });

    // Run selected sub-agent (tools-first)
    const agentStart = Date.now();
    let agentResponse;
    console.info("[agent:run]", {
      conversationId,
      userId,
      agent: routerDecision.selectedAgent,
    });
    switch (routerDecision.selectedAgent) {
      case "support":
        agentResponse = await runSupportAgent(context, routerDecision.toolPlan);
        break;
      case "order":
        agentResponse = await runOrderAgent(context, routerDecision.toolPlan);
        break;
      case "billing":
        agentResponse = await runBillingAgent(context, routerDecision.toolPlan);
        break;
    }
    const agentTime = Date.now() - agentStart;

    console.info("[agent:complete]", {
      conversationId,
      userId,
      agent: routerDecision.selectedAgent,
      toolCalls: agentResponse.toolCalls.length,
      durationMs: agentTime,
    });

    // Persist assistant message
    const assistantMessage = await messageRepo.create({
      conversationId,
      role: "assistant",
      content: agentResponse.content,
    });

    // Persist sub-agent run with tool calls
    await agentRunRepo.create({
      conversationId,
      messageId: assistantMessage.id,
      agentType: routerDecision.selectedAgent,
      intent: routerDecision.intent,
      confidence: routerDecision.confidence,
      toolCalls: agentResponse.toolCalls.map((tc) => ({
        toolName: tc.toolName,
        input: tc.input,
      })),
      toolResults: agentResponse.toolCalls.map((tc) => ({
        toolName: tc.toolName,
        result: tc.result,
        error: tc.error,
      })),
      timingsMs: { agent: agentTime },
    });

    // Touch conversation to update timestamp
    await conversationRepo.touch(conversationId);

    const totalTime = Date.now() - startTime;

    return {
      conversationId,
      userId,
      assistantMessage: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
      },
      meta: {
        routerDecision: {
          intent: routerDecision.intent,
          confidence: routerDecision.confidence,
          selectedAgent: routerDecision.selectedAgent,
        },
        toolCalls: agentResponse.toolCalls.length,
        timings: {
          router: routerTime,
          agent: agentTime,
          total: totalTime,
        },
      },
    };
  },

  listConversations: async (userId: string) => {
    return conversationRepo.listByUser(userId);
  },

  getConversation: async (id: string) => {
    return conversationRepo.getByIdWithMessages(id);
  },

  deleteConversation: async (id: string) => {
    await conversationRepo.delete(id);
  },
};
