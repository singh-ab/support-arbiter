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
  conversationId?: string;
  userId?: string;
  message: string;
};

export const chatService = {
  handleIncomingMessage: async (input: IncomingMessageInput) => {
    const startTime = Date.now();

    // 1. Ensure user exists (demo mode: use provided userId or create default)
    const userId = input.userId || "demo-user";
    await userRepo.upsertMinimal({ id: userId, name: "Demo User" });

    // 2. Get or create conversation
    let conversationId = input.conversationId;
    if (!conversationId) {
      const conv = await conversationRepo.create({ userId });
      conversationId = conv.id;
    }

    // 3. Persist user message
    const userMessage = await messageRepo.create({
      conversationId,
      role: "user",
      content: input.message,
    });

    // 4. Load recent conversation history for context
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

    // 5. Run router agent
    const routerStart = Date.now();
    const routerDecision = await runRouter(context);
    const routerTime = Date.now() - routerStart;

    // 6. Persist router decision
    await agentRunRepo.create({
      conversationId,
      messageId: userMessage.id,
      agentType: "router",
      intent: routerDecision.intent,
      confidence: routerDecision.confidence,
      toolCalls: routerDecision.toolPlan,
      timingsMs: { router: routerTime },
    });

    // 7. Run selected sub-agent (tools-first)
    const agentStart = Date.now();
    let agentResponse;
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

    // 8. Persist assistant message
    const assistantMessage = await messageRepo.create({
      conversationId,
      role: "assistant",
      content: agentResponse.content,
    });

    // 9. Persist sub-agent run with tool calls
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

    // 10. Touch conversation to update timestamp
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
