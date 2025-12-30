type OpenRouterChatCompletionResponse = {
  id?: string;
  choices?: Array<{
    message?: { role?: string; content?: string };
  }>;
  error?: unknown;
};

const getEnv = (key: string): string | undefined => {
  const value = process.env[key];
  if (typeof value !== "string") {
    return;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const main = async () => {
  const apiKey = getEnv("OPENROUTER_API_KEY") ?? getEnv("OPENROUTER_KEY");
  if (!apiKey) {
    throw new Error(
      "Missing OPENROUTER_API_KEY (or OPENROUTER_KEY). Set it or run with --env-file=.env.local"
    );
  }

  const referer =
    getEnv("NEXT_PUBLIC_BASE_URL") ??
    getEnv("APP_DOMAIN") ??
    "https://frcrag.johari-dev.com";

  const title = getEnv("NEXT_PUBLIC_BASE_TITLE") ?? "frcrag.johari-dev.com";

  const model = "google/gemma-3-4b-it:free";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": title,
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: "user",
          content: "Reply with exactly: OK (and nothing else).",
        },
      ],
      temperature: 0,
      max_tokens: 32,
    }),
  });

  const text = await res.text();
  let json: OpenRouterChatCompletionResponse | undefined;

  try {
    json = JSON.parse(text) as OpenRouterChatCompletionResponse;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const statusLine = `${res.status} ${res.statusText}`.trim();
    const bodyPreview = text.length > 2000 ? `${text.slice(0, 2000)}…` : text;
    throw new Error(
      `OpenRouter request failed for ${model}: ${statusLine}\n\n${bodyPreview}`
    );
  }

  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    const bodyPreview = text.length > 2000 ? `${text.slice(0, 2000)}…` : text;
    throw new Error(
      `OpenRouter returned no message content for ${model}. Body:\n\n${bodyPreview}`
    );
  }

  // Print the raw assistant content as the “assertion”
  // so it's easy to see if it deviates from expected.
  process.stdout.write(`${content}\n`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
