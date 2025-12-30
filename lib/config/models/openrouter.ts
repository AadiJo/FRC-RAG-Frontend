import { REASONING_FEATURE } from "../features";
import { openrouter } from "../openrouter";

export const OPENROUTER_MODELS = [
  {
    id: "xiaomi/mimo-v2-flash:free",
    name: "MiMo V2 Flash",
    subName: "Free",
    provider: "openrouter",
    premium: false,
    usesPremiumCredits: false,
    description:
      "Xiaomi MiMo-V2-Flash (free tier on OpenRouter). Supports reasoning and a 256K context window.",
    apiKeyUsage: { allowUserKey: false, userKeyOnly: false },
    api_sdk: openrouter("xiaomi/mimo-v2-flash:free"),
    features: [REASONING_FEATURE],
  },
];
