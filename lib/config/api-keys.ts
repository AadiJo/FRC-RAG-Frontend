import { MODELS_RAW } from "./models";
import type { Model } from "./schemas";

// Define the provider type to match the API keys page requirements
// Groq uses direct SDK, OpenRouter accesses other providers
export type ApiKeyProvider = "groq" | "openrouter" | "tavily";

// API key validation patterns
export const API_KEY_PATTERNS = {
  groq: /^gsk_[a-zA-Z0-9]{50,}$/,
  openrouter: /^sk-or-v1-[a-zA-Z0-9]{64,}$/,
  tavily: /^tvly-[A-Za-z0-9-]{10,}$/,
} as const;

// Provider configuration with metadata for API keys page
const PROVIDER_CONFIGS = [
  {
    id: "groq" as const,
    title: "Groq API Key",
    placeholder: "gsk_...",
    docs: "https://console.groq.com/keys",
  },
  {
    id: "openrouter" as const,
    title: "OpenRouter API Key",
    placeholder: "sk-or-v1-...",
    docs: "https://openrouter.ai/keys",
  },
  {
    id: "tavily" as const,
    title: "Tavily API Key",
    placeholder: "tvly-...",
    docs: "https://app.tavily.com/home",
  },
] as const;

/**
 * Generate display name for a model, combining name and subName if present
 */
function getModelDisplayName(model: Model): string {
  return model.subName ? `${model.name} (${model.subName})` : model.name;
}

/**
 * Get providers that support API keys along with their models
 * This replaces the hardcoded PROVIDERS array in the API keys page
 */
export function getApiKeyProviders() {
  // Group models by provider using all known models so OpenRouter models
  // are shown in the settings UI even when they don't accept user keys.
  const providerGroups = new Map<string, string[]>();
  for (const model of MODELS_RAW) {
    const providerId = model.provider;
    if (!providerGroups.has(providerId)) {
      providerGroups.set(providerId, []);
    }
    const displayName = getModelDisplayName(model);
    providerGroups.get(providerId)?.push(displayName);
  }

  // Return all provider configs; include models if present (may be empty)
  return PROVIDER_CONFIGS.map((config) => ({
    id: config.id as ApiKeyProvider,
    title: config.title,
    placeholder: config.placeholder,
    docs: config.docs,
    models: providerGroups.get(config.id) || [],
  }));
}

/**
 * Validation function for API keys
 */
export function validateApiKey(
  provider: ApiKeyProvider,
  key: string
): { isValid: boolean; error?: string } {
  if (!key.trim()) {
    return { isValid: false, error: "API key is required" };
  }

  const pattern = API_KEY_PATTERNS[provider as keyof typeof API_KEY_PATTERNS];
  if (!pattern) {
    return { isValid: true }; // No specific pattern for this provider
  }

  if (!pattern.test(key)) {
    switch (provider) {
      case "groq":
        return {
          isValid: false,
          error:
            "Groq API keys should start with 'gsk_' followed by at least 50 characters",
        };
      case "openrouter":
        return {
          isValid: false,
          error:
            "OpenRouter API keys should start with 'sk-or-v1-' followed by at least 64 characters",
        };
      case "tavily":
        return {
          isValid: false,
          error:
            "Tavily API keys should start with 'tvly-' followed by the key identifier",
        };
      default:
        return { isValid: false, error: "Invalid API key format" };
    }
  }

  return { isValid: true };
}
