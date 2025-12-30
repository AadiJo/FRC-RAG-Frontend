import { groq } from "@ai-sdk/groq";
import { REASONING_FEATURE_BASIC, TOOL_CALLING_FEATURE } from "../features";

export const GROQ_MODELS = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "groq",
    displayProvider: "meta",
    premium: false,
    usesPremiumCredits: false,
    description:
      "Meta's latest Llama model with 70B parameters.\nExcellent for general tasks with ultra-fast inference on Groq.",
    apiKeyUsage: { allowUserKey: true, userKeyOnly: false },
    features: [TOOL_CALLING_FEATURE],
    api_sdk: groq("llama-3.3-70b-versatile"),
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    subName: "Instant",
    provider: "groq",
    displayProvider: "meta",
    premium: false,
    usesPremiumCredits: false,
    description:
      "Fast and efficient 8B parameter model.\nGreat for quick responses and lightweight tasks.",
    apiKeyUsage: { allowUserKey: true, userKeyOnly: false },
    features: [TOOL_CALLING_FEATURE],
    api_sdk: groq("llama-3.1-8b-instant"),
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT OSS 120B",
    provider: "groq",
    displayProvider: "openai",
    premium: false,
    usesPremiumCredits: false,
    description:
      "OpenAI's flagship open-weight model with 120B parameters.\nBuilt-in browser search, code execution, and reasoning capabilities.",
    apiKeyUsage: { allowUserKey: true, userKeyOnly: false },
    features: [TOOL_CALLING_FEATURE, REASONING_FEATURE_BASIC],
    api_sdk: groq("openai/gpt-oss-120b"),
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT OSS 20B",
    provider: "groq",
    displayProvider: "openai",
    premium: false,
    usesPremiumCredits: false,
    description:
      "OpenAI's efficient open-weight model with 20B parameters.\nFast inference at 1000 tokens/sec with 65K max completion tokens.",
    apiKeyUsage: { allowUserKey: true, userKeyOnly: false },
    features: [TOOL_CALLING_FEATURE],
    api_sdk: groq("openai/gpt-oss-20b"),
  },
];
