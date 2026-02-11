import type { Context } from "hono";

import { AppError } from "@/server/errors/appError";
import {
  AgentType,
  getAgentCapabilities,
  listAgents,
} from "@/server/services/agentsService";

export const agentsController = {
  list: async (c: Context) => {
    const agents = listAgents();
    return c.json({ agents });
  },

  capabilities: async (c: Context) => {
    const type = c.req.param("type") as AgentType;
    const caps = getAgentCapabilities(type);
    if (!caps) {
      throw new AppError("AGENT_NOT_FOUND", "Unknown agent type", 404);
    }
    return c.json({ type, capabilities: caps });
  },
};
