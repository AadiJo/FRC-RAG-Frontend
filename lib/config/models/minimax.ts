import { REASONING_FEATURE, TOOL_CALLING_FEATURE } from "../features";
import { openrouter } from "../openrouter";

export const MINIMAX_MODELS = [
  {
    id: "minimax/minimax-m2",
    name: "MiniMax M2",
    provider: "openrouter",
    displayProvider: "minimax",
    premium: true,
    usesPremiumCredits: false,
    description:
      "MiniMax's high-efficiency model optimized for coding and agentic workflows.\nExcels in multi-step reasoning and tool use.",
    apiKeyUsage: { allowUserKey: false, userKeyOnly: false },
    features: [TOOL_CALLING_FEATURE, REASONING_FEATURE],
    api_sdk: openrouter("minimax/minimax-m2"),
  },
];
