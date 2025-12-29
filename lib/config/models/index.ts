import { extractReasoningMiddleware, wrapLanguageModel } from "ai";
import { z } from "zod";
import { ModelSchema } from "../schemas";
import { DEEPSEEK_MODELS } from "./deepseek";
import { GROQ_MODELS } from "./groq";
import { META_MODELS } from "./meta";
import { MINIMAX_MODELS } from "./minimax";
import { MOONSHOT_MODELS } from "./moonshot";
import { QWEN_MODELS } from "./qwen";
import { XAI_MODELS } from "./xai";
import { ZAI_MODELS } from "./zai";

const reasoningMiddleware = extractReasoningMiddleware({
  tagName: "think",
});

// Combine all models from different providers
// Groq models use direct SDK, others use OpenRouter
export const MODELS_DATA = [
  ...GROQ_MODELS,
  ...XAI_MODELS,
  ...META_MODELS,
  ...DEEPSEEK_MODELS,
  ...MOONSHOT_MODELS,
  ...ZAI_MODELS,
  ...MINIMAX_MODELS,
  ...QWEN_MODELS,
];

export const MODELS_RAW = z.array(ModelSchema).parse(MODELS_DATA);

export const MODELS = MODELS_RAW.map((m) => ({
  ...m,
  api_sdk: m.features?.some((f) => f.id === "reasoning" && f.enabled)
    ? wrapLanguageModel({ model: m.api_sdk, middleware: reasoningMiddleware })
    : m.api_sdk,
}));

// Add a map for O(1) lookup by id
export const MODELS_MAP: Record<string, (typeof MODELS)[0]> =
  Object.fromEntries(MODELS.map((model) => [model.id, model]));

export const MODELS_OPTIONS = MODELS;
