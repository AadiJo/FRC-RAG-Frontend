import {
  Google,
  Groq,
  Minimax,
  Mistral,
  Moonshot,
  OpenAI,
  ZAI,
} from "@lobehub/icons";
import {
  DeepSeek,
  GrokDark,
  GrokLight,
  Meta,
  OpenRouterDark,
  OpenRouterLight,
  QwenDark,
  QwenLight,
} from "@ridemountainpig/svgl-react";

export type Provider = {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  icon_light?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

// Groq uses direct SDK, all others use OpenRouter
export const PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    icon: Groq,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: OpenRouterDark,
    icon_light: OpenRouterLight,
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: OpenAI,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: DeepSeek,
  },
  {
    id: "xai",
    name: "xAI",
    icon: GrokDark,
    icon_light: GrokLight,
  },
  {
    id: "meta",
    name: "Meta",
    icon: Meta,
  },
  {
    id: "mistral",
    name: "Mistral",
    icon: Mistral,
  },
  {
    id: "google",
    name: "Google",
    icon: Google,
  },
  {
    id: "qwen",
    name: "Qwen",
    icon: QwenDark,
    icon_light: QwenLight,
  },
  {
    id: "moonshotai",
    name: "Moonshot AI",
    icon: Moonshot,
  },
  {
    id: "z-ai",
    name: "Z.AI",
    icon: ZAI,
  },
  {
    id: "minimax",
    name: "MiniMax",
    icon: Minimax,
  },
] as Provider[];

export const PROVIDERS_OPTIONS = PROVIDERS;
