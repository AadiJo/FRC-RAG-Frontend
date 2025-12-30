export const PREMIUM_CREDITS = 100;
export const REMAINING_QUERY_ALERT_THRESHOLD = 2;
export const DAILY_FILE_UPLOAD_LIMIT = 5;

export const APP_NAME = "FRC RAG";
export const META_TITLE = `${APP_NAME} | Technical Copilot`;
export const APP_DOMAIN = "https://frcrag.johari-dev.com";
export const APP_DESCRIPTION =
  "FRC RAG is an AI assistant tuned for FRC workflows: pull rules, scout faster, explain mechanisms, and keep match prep moving. Bring your docs, images, and context—RAG handles the rest.";
export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const MODEL_DEFAULT = "openai/gpt-oss-20b";

// Models available without any API keys (free tier)
// These are the only models users can access if they haven't added any provider API keys
export const FREE_TIER_MODELS = [
  "openai/gpt-oss-20b", // Groq - fast inference
  "llama-3.3-70b-versatile", // Groq - Llama 3.3 70B (now guest-accessible)
  "openai/gpt-oss-20b:free", // OpenRouter free tier
] as const;

export const RECOMMENDED_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "imagen-4",
  "gpt-5.2",
  "gpt-5-mini",
  "gpt-5-nano",
  "x-ai/grok-4.1-fast",
  "gpt-image-1",
  "claude-4-5-sonnet",
  "claude-4-5-sonnet-reasoning",
  "deepseek-r1-0528",
];

export const MESSAGE_MAX_LENGTH = 4000;

export const GITHUB_REPO_URL = "https://github.com/AadiJo/frc-rag-backend";
