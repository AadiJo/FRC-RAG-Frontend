import { openrouter } from "../openrouter";

export const OPENAI_MODELS = [
  {
    id: "openai/gpt-oss-20b:free",
    name: "GPT OSS 20B",
    subName: "Free",
    provider: "openrouter",
    displayProvider: "openai",
    premium: false,
    usesPremiumCredits: false,
    description: "OpenAI GPT OSS 20B (free tier on OpenRouter).",
    apiKeyUsage: { allowUserKey: false, userKeyOnly: false },
    api_sdk: openrouter("openai/gpt-oss-20b:free"),
    features: [],
  },
];
