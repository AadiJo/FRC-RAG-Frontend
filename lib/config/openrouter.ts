import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Create OpenRouter instance with app attribution headers
export const openrouter = createOpenRouter({
  headers: {
    "HTTP-Referer":
      process.env.NEXT_PUBLIC_BASE_URL || "https://frcrag.johari-dev.com",
    "X-Title": process.env.NEXT_PUBLIC_BASE_TITLE || "frcrag.johari-dev.com",
  },
});
