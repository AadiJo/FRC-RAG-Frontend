import { groq } from "@ai-sdk/groq";
import { FILE_UPLOAD_FEATURE, TOOL_CALLING_FEATURE } from "../features";

export const META_MODELS = [
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "groq",
    displayProvider: "meta",
    premium: false,
    usesPremiumCredits: false,
    description: `Meta's first natively multimodal model with 400B parameters.\nOffers industry-leading 10M token context window.`,
    apiKeyUsage: { allowUserKey: true, userKeyOnly: false },
    features: [FILE_UPLOAD_FEATURE, TOOL_CALLING_FEATURE],
    api_sdk: groq("meta-llama/llama-4-maverick-17b-128e-instruct"),
  },
  {
    id: "meta-llama/llama-4-scout",
    name: "Llama 4 Scout",
    provider: "groq",
    displayProvider: "meta",
    premium: false,
    usesPremiumCredits: false,
    description:
      "Efficient multimodal model fitting on single H100 GPU.\nBest-in-class performance with 17B active parameters.",
    apiKeyUsage: { allowUserKey: true, userKeyOnly: false },
    features: [FILE_UPLOAD_FEATURE, TOOL_CALLING_FEATURE],
    api_sdk: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
  },
];
