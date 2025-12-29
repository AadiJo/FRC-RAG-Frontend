import { Agent } from "@ai-sdk-tools/agents";
import { UpstashProvider } from "@ai-sdk-tools/memory/upstash";
import { Redis } from "@upstash/redis";
import type { LanguageModel, Tool } from "ai";

// Initialize Redis client for Upstash Memory
// We use the same client instance to reuse connections
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export const createScheduledAgent = ({
  chatId,
  model,
  systemPrompt,
  tools,
}: {
  chatId: string;
  model: LanguageModel;
  systemPrompt: string;
  tools: Record<string, Tool>;
}) => {
  // Initialize Upstash Memory Provider
  const memoryProvider = new UpstashProvider(redis);

  // Create the Agent
  return new Agent({
    name: `scheduled-agent-${chatId}`,
    model,
    instructions: systemPrompt,
    tools,
    memory: {
      provider: memoryProvider,
      workingMemory: {
        enabled: true,
        scope: "user",
      },
      history: {
        enabled: true,
        limit: 20, // Keep last 20 turns
      },
      chats: {
        enabled: false, // We manage chats in Convex
      },
    },
  });
};
