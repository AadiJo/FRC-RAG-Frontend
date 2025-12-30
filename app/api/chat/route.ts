/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: <main route> */
import type { GroqProviderOptions } from "@ai-sdk/groq";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import {
  consumeStream,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type JSONValue,
  smoothStream,
  stepCountIs,
  streamText,
  type Tool,
  type UIMessage,
} from "ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { ConvexError, type Infer } from "convex/values";
import { searchTool } from "@/app/api/tools/search";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Message } from "@/convex/schema/message";
import { FREE_TIER_MODELS, MODELS_MAP } from "@/lib/config";
import { isDebugRagHttpEnabled } from "@/lib/debug";
import { limitDepth } from "@/lib/depth-limiter";
import { ERROR_CODES } from "@/lib/error-codes";
import {
  classifyError,
  createErrorPart,
  createErrorResponse,
  createStreamingError,
  shouldShowInConversation,
} from "@/lib/error-utils";
import { buildSystemPrompt, PERSONAS_MAP } from "@/lib/prompt_config";
import {
  detectProviderErrorFromObject,
  detectProviderErrorInText,
} from "@/lib/provider-error-detector";
import {
  encodeRAGImagesForHeader,
  encodeRelatedImagesForHeader,
  fetchRAGContext,
  getFRCDefaultPrompt,
  getFRCSystemPrompt,
  type RAGContextResponse,
} from "@/lib/rag";
import { sanitizeUserInput } from "@/lib/sanitize";
// TODO: R2 uploads disabled - uncomment when VPS storage is implemented
// import { uploadBlobToR2 } from "@/lib/server-upload-helpers";

// Maximum allowed duration for streaming (in seconds)
export const maxDuration = 300;

const serializeUnknownErrorForLog = (
  error: unknown
): Record<string, unknown> => {
  if (error instanceof Error) {
    const base: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    if (error.cause) {
      base.cause = serializeUnknownErrorForLog(error.cause);
    }

    for (const [key, value] of Object.entries(error)) {
      if (!(key in base)) {
        base[key] = value;
      }
    }

    return base;
  }

  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    const out: Record<string, unknown> = {
      kind: (error as { constructor?: { name?: string } })?.constructor?.name,
    };

    for (const [key, value] of Object.entries(obj)) {
      out[key] = value;
    }

    return out;
  }

  return { value: String(error) };
};

/**
 * Helper function to save an error message as an assistant message
 */
async function saveErrorMessage(
  chatId: Id<"chats">,
  userMsgId: Id<"messages"> | null,
  error: unknown,
  token: string,
  modelId?: string,
  modelName?: string,
  enableSearch?: boolean,
  reasoningEffort?: ReasoningEffort
) {
  try {
    if (!userMsgId) {
      return null;
    }

    const classified = classifyError(error);
    const errorPart = createErrorPart(
      classified.code,
      classified.userFriendlyMessage,
      classified.message
    );

    const { messageId } = await fetchMutation(
      api.messages.saveAssistantMessage,
      {
        chatId,
        role: "assistant",
        content: "", // Empty content to avoid duplication and search pollution
        parentMessageId: userMsgId,
        parts: [errorPart],
        metadata: {
          modelId: modelId || "error",
          modelName: modelName || "Error",
          includeSearch: enableSearch,
          reasoningEffort: reasoningEffort || "none",
        },
      },
      { token }
    );

    return messageId;
  } catch (_err) {
    return null;
  }
}

type ReasoningEffort = "low" | "medium" | "high";
// Groq uses direct SDK, OpenRouter for everything else
type SupportedProvider = "groq" | "openrouter";

/**
 * Helper function to save user message to chat if not in reload mode
 */
async function saveUserMessage(
  messages: UIMessage[],
  chatId: Id<"chats">,
  token: string | undefined,
  reloadAssistantMessageId?: Id<"messages">
): Promise<Id<"messages"> | null> {
  if (!reloadAssistantMessageId && token) {
    const userMessage = messages.at(-1);
    if (userMessage && userMessage.role === "user") {
      // Use parts directly since schema now matches AI SDK v5
      const userParts = (userMessage.parts || []).map((p) =>
        p.type === "text" ? { ...p, text: sanitizeUserInput(p.text) } : p
      );

      // Extract text content for backwards compatibility
      const textContent = userParts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

      const { messageId } = await fetchMutation(
        api.messages.sendUserMessageToChat,
        {
          chatId,
          role: "user",
          content: sanitizeUserInput(textContent),
          parts: userParts,
          metadata: {}, // Empty metadata for user messages
        },
        { token }
      );
      return messageId;
    }
  }
  return null;
}

/**
 * Centralized reasoning effort configuration
 * - low: For quick responses with minimal reasoning depth
 * - medium: Balanced reasoning depth for most use cases
 * - high: Maximum reasoning depth for complex problems
 *
 * tokens: Used by Google and Anthropic providers
 * effort: Used by OpenAI and OpenRouter providers
 */
const REASONING_EFFORT_CONFIG = {
  low: {
    tokens: 1024,
    effort: "low",
  },
  medium: {
    tokens: 6000,
    effort: "medium",
  },
  high: {
    tokens: 12_000,
    effort: "high",
  },
} as const;

type ChatRequest = {
  messages: UIMessage[];
  chatId: Id<"chats">;
  model: string;
  personaId?: string;
  reloadAssistantMessageId?: Id<"messages">;
  editMessageId?: Id<"messages">;
  enableSearch?: boolean;
  enableRAG?: boolean;
  reasoningEffort?: ReasoningEffort;
  userInfo?: { timezone?: string };
};

const stripReasoningFromModelMessages = (
  modelMessages: ReturnType<typeof convertToModelMessages>
): ReturnType<typeof convertToModelMessages> => {
  const out: ReturnType<typeof convertToModelMessages> = [];

  for (const message of modelMessages) {
    const record = message as unknown as Record<string, unknown>;
    if (!("reasoning" in record)) {
      out.push(message);
      continue;
    }

    const clone: Record<string, unknown> = { ...record };
    delete clone.reasoning;
    out.push(clone as unknown as (typeof modelMessages)[number]);
  }

  return out;
};

// Helper function to check if a model supports tool calling - currently unused after connector removal
// Keeping for potential future use
const _supportsToolCalling = (
  selectedModel: (typeof MODELS_MAP)[string]
): boolean =>
  selectedModel.features?.some(
    (feature) => feature.id === "tool-calling" && feature.enabled === true
  ) ?? false;

// Build Groq-specific provider options
const buildGroqProviderOptions = (
  modelId: string,
  reasoningEffort?: ReasoningEffort
): GroqProviderOptions => {
  const model = MODELS_MAP[modelId];
  if (!model) {
    return {};
  }

  // Check if model has reasoning feature enabled
  const hasReasoningFeature = model.features?.some(
    (f) => f.id === "reasoning" && f.enabled === true
  );

  // Only add reasoning options for models with reasoning enabled
  if (hasReasoningFeature && reasoningEffort) {
    // GPT-OSS models support low/medium/high
    // Qwen 3 32B supports none/default
    const isGptOss = modelId.includes("gpt-oss");
    if (isGptOss) {
      return {
        reasoningFormat: "parsed",
        reasoningEffort, // low, medium, high
      } as GroqProviderOptions;
    }
    // For other reasoning models like Qwen, use default
    return {
      reasoningFormat: "parsed",
      reasoningEffort: "default",
    } as GroqProviderOptions;
  }

  return {};
};

const buildOpenRouterProviderOptions = (
  modelId: string,
  reasoningEffort?: ReasoningEffort
): Record<string, unknown> => {
  const options: Record<string, unknown> = {};
  const model = MODELS_MAP[modelId];

  if (!model) {
    return options;
  }

  // Check if model has reasoning feature with supportsEffort flag
  const reasoningFeature = model.features?.find((f) => f.id === "reasoning");
  const hasReasoningEnabled = reasoningFeature?.enabled === true;
  const supportsEffort =
    (reasoningFeature as { supportsEffort?: boolean })?.supportsEffort === true;

  // Only pass reasoning config if model supports configurable effort
  if (hasReasoningEnabled && supportsEffort && reasoningEffort) {
    options.reasoning = {
      effort: reasoningEffort,
    };
  }

  return options;
};

// Image generation has been removed from this simplified version

export async function POST(req: Request) {
  req.signal.addEventListener("abort", () => {
    // Request aborted by client
  });

  try {
    const {
      messages,
      chatId,
      model,
      personaId,
      reloadAssistantMessageId,
      editMessageId,
      enableSearch,
      enableRAG,
      reasoningEffort,
      userInfo,
    } = (await req.json()) as ChatRequest;

    if (!(messages && chatId)) {
      return createErrorResponse(new Error("Missing required information"));
    }

    // --- Enhanced Input Validation ---
    if (!Array.isArray(messages) || messages.length === 0) {
      return createErrorResponse(
        new Error("'messages' must be a non-empty array.")
      );
    }

    if (typeof chatId !== "string" || chatId.trim() === "") {
      return createErrorResponse(
        new Error("'chatId' must be a non-empty string.")
      );
    }

    const selectedModel = MODELS_MAP[model];
    if (!selectedModel) {
      return createErrorResponse(new Error("Invalid 'model' provided."));
    }

    const selectedModelSupportsReasoning =
      selectedModel.features?.some(
        (feature) => feature.id === "reasoning" && feature.enabled === true
      ) ?? false;

    const token = await convexAuthNextjsToken();

    // Get current user first (needed for multiple operations below)
    const user = await fetchQuery(api.users.getCurrentUser, {}, { token });

    // --- Optimized Parallel Database Queries ---
    // Run independent queries in parallel to reduce latency
    const [userKeys, isUserPremiumForPremiumModels] = await Promise.all([
      // Get user API keys if model allows user keys
      selectedModel.apiKeyUsage?.allowUserKey
        ? fetchQuery(api.api_keys.getApiKeys, {}, { token }).catch(() => [])
        : Promise.resolve([]),
      // Check premium status for premium models (only if needed)
      selectedModel.premium
        ? fetchQuery(api.users.userHasPremium, {}, { token }).catch(() => false)
        : Promise.resolve(false),
    ]);

    // --- API Key and Model Configuration ---
    const { apiKeyUsage } = selectedModel;
    let userApiKey: string | null = null;
    let keyEntry: { provider: string; mode?: string } | undefined;

    // Map model provider to API key provider
    // Groq models use groq API key, all others use openrouter API key
    const getApiKeyProvider = (modelProvider: string): SupportedProvider => {
      if (modelProvider === "groq") {
        return "groq";
      }
      return "openrouter";
    };

    const apiKeyProvider = getApiKeyProvider(selectedModel.provider);

    if (apiKeyUsage?.allowUserKey && Array.isArray(userKeys)) {
      try {
        // Look for API key matching the appropriate provider
        keyEntry = userKeys.find((k) => k.provider === apiKeyProvider);
        if (keyEntry) {
          userApiKey = await fetchQuery(
            api.api_keys.getDecryptedKey,
            { provider: apiKeyProvider },
            { token }
          );
        }
      } catch (e) {
        // If this is a critical error (auth failure), we should return early
        if (
          e instanceof ConvexError &&
          e.data === ERROR_CODES.NOT_AUTHENTICATED
        ) {
          return createErrorResponse(e);
        }
      }
    }

    // Determine if we should use a user-provided API key
    // Use user key if:
    // 1. Model requires user key only (userKeyOnly) and user has one
    // 2. User has set their key to priority mode
    // 3. User has an API key for this provider and model allows user keys
    const useUserKey = Boolean(
      userApiKey &&
        (apiKeyUsage?.userKeyOnly ||
          keyEntry?.mode === "priority" ||
          apiKeyUsage?.allowUserKey)
    );

    // Reject early if model requires user key only but no user API key provided
    if (apiKeyUsage?.userKeyOnly && !userApiKey) {
      return createErrorResponse(new Error("user_key_required"));
    }

    // --- Model Access Check ---
    // Determine if user can access this model based on:
    // 1. Free tier models (3 guest models) - always available, use server credentials
    // 2. All other models - require user to have the correct provider's API key (groq or openrouter)
    const hasAnyApiKey = Array.isArray(userKeys) && userKeys.length > 0;
    const FREE_TIER_MODELS_SET = new Set<string>(FREE_TIER_MODELS);
    const isFreeTierModel = FREE_TIER_MODELS_SET.has(selectedModel.id);

    // Model access logic:
    // - Free tier: always allowed (use server credentials)
    // - All other models: require user to have appropriate API key
    const modelRequiresUserApiKey = !isFreeTierModel;

    if (modelRequiresUserApiKey && !hasAnyApiKey) {
      return createErrorResponse(
        new Error(
          "This model requires an API key. Please add your API key in settings to use this model."
        )
      );
    }

    // --- Premium Model Access Check ---
    // Only applies if user is NOT using their own API key
    if (
      selectedModel.premium &&
      !useUserKey &&
      !isUserPremiumForPremiumModels
    ) {
      // Save user message first
      const userMsgId = await saveUserMessage(
        messages,
        chatId,
        token,
        reloadAssistantMessageId
      );

      // Create premium access error
      const premiumError = new Error("PREMIUM_MODEL_ACCESS_DENIED");

      // Save error message to conversation
      if (token) {
        await saveErrorMessage(
          chatId,
          userMsgId,
          premiumError,
          token,
          selectedModel.id,
          selectedModel.name,
          enableSearch,
          reasoningEffort
        );
      }

      // Return proper HTTP error response
      return createErrorResponse(premiumError);
    }

    // --- Rate Limiting (only if not using user key and model doesn't skip rate limits) ---
    let rateLimitError: Error | null = null;

    if (!(useUserKey || selectedModel.skipRateLimit)) {
      try {
        // Check if the selected model uses premium credits
        const usesPremiumCredits = selectedModel.usesPremiumCredits === true;

        await fetchMutation(
          api.users.assertNotOverLimit,
          { usesPremiumCredits },
          { token }
        );
      } catch (error) {
        if (error instanceof ConvexError) {
          const errorCode = error.data;
          if (
            errorCode === ERROR_CODES.DAILY_LIMIT_REACHED ||
            errorCode === ERROR_CODES.MONTHLY_LIMIT_REACHED ||
            errorCode === ERROR_CODES.PREMIUM_LIMIT_REACHED
          ) {
            rateLimitError = error;
            // Don't throw yet - let user message save first
          } else {
            throw error; // Re-throw non-rate-limit errors
          }
        } else {
          throw error; // Re-throw non-ConvexError errors
        }
      }
    }

    // --- Handle Rate Limit Error Early (but save messages first) ---
    if (rateLimitError) {
      // Save user message first (even though rate limited)
      const userMsgId = await saveUserMessage(
        messages,
        chatId,
        token,
        reloadAssistantMessageId
      );

      // Save error message to conversation
      if (token) {
        await saveErrorMessage(
          chatId,
          userMsgId,
          rateLimitError,
          token,
          selectedModel.id,
          selectedModel.name,
          enableSearch,
          reasoningEffort
        );
      }

      // Return proper HTTP error response (not 200)
      return createErrorResponse(rateLimitError);
    }

    // --- RAG Context Fetching ---
    let ragContext: RAGContextResponse | null = null;
    let finalSystemPrompt: string;

    if (isDebugRagHttpEnabled()) console.log("[RAG] enableRAG:", enableRAG);

    if (enableRAG) {
      // Extract the last user message for RAG query
      const lastUserMessage = messages.filter((m) => m.role === "user").pop();
      const userQuery =
        lastUserMessage?.parts
          ?.filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("") || "";

      if (isDebugRagHttpEnabled())
        console.log("[RAG] userQuery:", userQuery.slice(0, 100));

      if (userQuery) {
        if (isDebugRagHttpEnabled())
          console.log("[RAG] Fetching RAG context...");
        // Pass user ID for fused retrieval (global corpus + user documents)
        ragContext = await fetchRAGContext(userQuery, {
          k: 15,
          timeout: 10_000,
          signal: req.signal,
          userId: user?._id, // Include user ID for personalized retrieval
        });
        if (isDebugRagHttpEnabled()) {
          console.log("[RAG] RAG context received:", ragContext ? "yes" : "no");
          if (ragContext) {
            console.log("[RAG] Context length:", ragContext.context?.length);
            console.log("[RAG] Images count:", ragContext.images?.length);
            console.log(
              "[RAG] Image map keys:",
              Object.keys(ragContext.image_map || {}).length
            );
          }
        }
      }

      if (ragContext?.context) {
        // Use FRC prompt with RAG context
        finalSystemPrompt = getFRCSystemPrompt(
          ragContext.context,
          undefined, // gamePieceContext - TODO: implement game piece mapper
          user
            ? {
                name: user.name,
                preferredName: user.preferredName,
                occupation: user.occupation,
                traits: user.traits,
                about: user.about,
              }
            : undefined,
          userInfo?.timezone
        );
      } else {
        // Use default FRC prompt without context
        finalSystemPrompt = getFRCDefaultPrompt(
          user
            ? {
                name: user.name,
                preferredName: user.preferredName,
                occupation: user.occupation,
                traits: user.traits,
                about: user.about,
              }
            : undefined,
          userInfo?.timezone
        );
      }
    } else {
      // Use standard prompt
      const basePrompt = personaId
        ? PERSONAS_MAP[personaId]?.prompt
        : undefined;
      // Connectors removed - enableTools is always false now
      const enableTools = false;
      finalSystemPrompt = buildSystemPrompt(
        user,
        basePrompt,
        enableSearch,
        enableTools,
        userInfo?.timezone
      );
    }
    // console.log('DEBUG: finalSystemPrompt', finalSystemPrompt);

    // Image generation has been removed from this simplified version

    // --- Dedicated Flow Structure ---
    let userMsgId: Id<"messages"> | null = null;

    if (reloadAssistantMessageId) {
      // --- Reload Flow ---
      const details = await fetchQuery(
        api.messages.getMessageDetails,
        { messageId: reloadAssistantMessageId },
        { token }
      );
      userMsgId = details?.parentMessageId ?? null;
      await fetchMutation(
        api.messages.deleteMessageAndDescendants,
        { messageId: reloadAssistantMessageId },
        { token }
      );
    } else if (editMessageId) {
      // --- Edit Flow ---
      const lastMessage = messages.at(-1);

      if (lastMessage) {
        // Patch the message content with new text and parts
        await fetchMutation(
          api.messages.patchMessageContent,
          {
            messageId: editMessageId,
            newContent: sanitizeUserInput(
              lastMessage.parts
                ?.filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("") || ""
            ),
            newParts: lastMessage.parts?.map((part) =>
              part.type === "text"
                ? { ...part, text: sanitizeUserInput(part.text) }
                : part
            ),
          },
          { token }
        );

        // Delete only subsequent messages (descendants) using enhanced mutation
        await fetchMutation(
          api.messages.deleteMessageAndDescendants,
          {
            messageId: editMessageId,
            deleteOnlyDescendants: true,
          },
          { token }
        );

        userMsgId = editMessageId;
      }
    } else {
      // --- Normal Flow ---
      userMsgId = await saveUserMessage(
        messages,
        chatId,
        token,
        reloadAssistantMessageId
      );
    }

    const makeOptions = (useUser: boolean) => {
      const key = useUser ? userApiKey : undefined;

      // Groq models use direct SDK
      if (selectedModel.provider === "groq") {
        return {
          groq: {
            ...buildGroqProviderOptions(selectedModel.id, reasoningEffort),
            apiKey: key,
          },
        };
      }
      // All other models go through OpenRouter
      return {
        openrouter: {
          ...buildOpenRouterProviderOptions(selectedModel.id, reasoningEffort),
          apiKey: key,
          user: user?._id ? `user_${user._id}` : undefined,
        },
      };
    };

    const startTime = Date.now();
    // Pre-build the base metadata object before the stream starts
    const baseMetadata = {
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      includeSearch: enableSearch,
      reasoningEffort: reasoningEffort || "none",
    };
    let finalUsage = {
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
      cachedInputTokens: 0,
    };

    let result: ReturnType<typeof streamText> | null = null;
    let wasUserKeyUsed = false;
    let errorMessageSaved = false;

    const modelMessages = convertToModelMessages(messages);
    const modelMessagesForProvider = selectedModelSupportsReasoning
      ? modelMessages
      : stripReasoningFromModelMessages(modelMessages);

    const stream = createUIMessageStream({
      originalMessages: messages,
      async execute({ writer }) {
        const runStream = (useUserKeyOverride: boolean) => {
          const providerOptions = makeOptions(useUserKeyOverride) as unknown as
            | Record<string, Record<string, JSONValue>>
            | undefined;

          const toolset: Record<string, Tool> = {};

          if (enableSearch) {
            toolset.search = searchTool;
          }

          // Composio/createAgent tool removed

          const streamResult = streamText({
            model: selectedModel.api_sdk,
            system: finalSystemPrompt,
            messages: modelMessagesForProvider,
            tools: toolset,
            stopWhen: stepCountIs(20),
            experimental_transform: smoothStream({
              delayInMs: 3,
              chunking: "word",
            }),
            providerOptions,
            onError: async ({ error }) => {
              // Handle errors gracefully - save to conversation but don't throw
              // The throwing behavior will be handled in the fullStream processing

              // First, try to detect provider-specific error patterns
              const detectedError = detectProviderErrorFromObject(
                error,
                selectedModel.provider
              );

              if (detectedError) {
                // If we detected a provider-specific error, save it with enhanced message
                if (token) {
                  try {
                    await saveErrorMessage(
                      chatId,
                      userMsgId,
                      detectedError, // Pass DetectedError directly, don't wrap in Error
                      token,
                      selectedModel.id,
                      selectedModel.name,
                      enableSearch,
                      reasoningEffort
                    );
                    errorMessageSaved = true; // Mark that error message was saved
                  } catch (_saveError) {
                    // swallow
                  }
                }
                return; // Exit early - error saved, no throwing
              }

              // Fallback to original error handling
              if (shouldShowInConversation(error) && token) {
                try {
                  await saveErrorMessage(
                    chatId,
                    userMsgId,
                    error,
                    token,
                    selectedModel.id,
                    selectedModel.name,
                    enableSearch,
                    reasoningEffort
                  );
                  errorMessageSaved = true; // Mark that error message was saved
                } catch (_saveError) {
                  // swallow
                }
              }
              // No throwing - let the stream handle the error state gracefully
            },
            onFinish({ totalUsage }) {
              const toNumber = (value: unknown): number =>
                typeof value === "number" ? value : Number(value) || 0;

              finalUsage = {
                inputTokens: toNumber(totalUsage.inputTokens),
                outputTokens: toNumber(totalUsage.outputTokens),
                reasoningTokens: toNumber(totalUsage.reasoningTokens),
                totalTokens: toNumber(totalUsage.totalTokens),
                cachedInputTokens: toNumber(totalUsage.cachedInputTokens),
              };
            },
          });

          // Note: avoid iterating `streamResult.fullStream` here.
          // Consuming it separately can interfere with the main UI stream.

          // Merge the regular UI stream for normal processing
          writer.merge(
            streamResult.toUIMessageStream({
              sendReasoning: true,
              sendSources: true,
            })
          );

          return streamResult;
        };

        const tryRun = async () => {
          if (apiKeyUsage?.allowUserKey) {
            const primaryIsUserKey = useUserKey;
            try {
              wasUserKeyUsed = primaryIsUserKey;
              result = runStream(primaryIsUserKey);
              return;
            } catch (primaryError) {
              if (shouldShowInConversation(primaryError) && token) {
                await saveErrorMessage(
                  chatId,
                  userMsgId,
                  primaryError,
                  token,
                  selectedModel.id,
                  selectedModel.name,
                  enableSearch,
                  reasoningEffort
                );
              }

              const fallbackIsPossible =
                primaryIsUserKey || (!primaryIsUserKey && Boolean(userApiKey));

              if (!fallbackIsPossible) {
                throw primaryError;
              }

              const fallbackIsUserKey = !primaryIsUserKey;
              try {
                wasUserKeyUsed = fallbackIsUserKey;
                result = runStream(fallbackIsUserKey);
                return;
              } catch (fallbackError) {
                if (shouldShowInConversation(fallbackError) && token) {
                  await saveErrorMessage(
                    chatId,
                    userMsgId,
                    fallbackError,
                    token,
                    selectedModel.id,
                    selectedModel.name,
                    enableSearch,
                    reasoningEffort
                  );
                }
                throw fallbackError;
              }
            }
          }

          wasUserKeyUsed = false;
          try {
            result = runStream(false);
          } catch (streamError) {
            if (shouldShowInConversation(streamError) && token) {
              await saveErrorMessage(
                chatId,
                userMsgId,
                streamError,
                token,
                selectedModel.id,
                selectedModel.name,
                enableSearch,
                reasoningEffort
              );
            }
            throw streamError;
          }
        };

        await tryRun();
      },
      async onFinish({ responseMessage }) {
        if (!result || errorMessageSaved) {
          return; // Don't save if no result or error message was already saved
        }

        if (!token) {
          return;
        }

        const sanitizedParts = (responseMessage.parts ?? []).filter((part) => {
          if (!part || typeof part !== "object") {
            return true;
          }

          return (part as { transient?: unknown }).transient !== true;
        });

        // Extract agent token usage from boundary markers and add to main usage
        const additionalAgentTokens = {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        };

        const agentBoundaryParts = sanitizedParts.filter(
          (part) => part.type === "data-agent-boundary"
        );

        for (const boundaryPart of agentBoundaryParts) {
          // Type assertion for boundary parts with data property
          const boundaryData = (
            boundaryPart as {
              data?: {
                type?: string;
                tokenUsage?: {
                  inputTokens?: number;
                  outputTokens?: number;
                  totalTokens?: number;
                };
              };
            }
          ).data;
          if (boundaryData?.type === "end" && boundaryData?.tokenUsage) {
            const usage = boundaryData.tokenUsage;
            // Coerce token usage values to numbers to avoid accidental
            // object concatenation when providers return structured objects.
            const inTokens =
              typeof usage.inputTokens === "number"
                ? usage.inputTokens
                : Number(usage.inputTokens) || 0;
            const outTokens =
              typeof usage.outputTokens === "number"
                ? usage.outputTokens
                : Number(usage.outputTokens) || 0;
            const totTokens =
              typeof usage.totalTokens === "number"
                ? usage.totalTokens
                : Number(usage.totalTokens) || 0;

            additionalAgentTokens.inputTokens += inTokens;
            additionalAgentTokens.outputTokens += outTokens;
            additionalAgentTokens.totalTokens += totTokens;
          }
        }

        const finalMetadata: Infer<typeof Message>["metadata"] = {
          ...baseMetadata,
          serverDurationMs: Date.now() - startTime,
          // Add agent tokens to main token counts for unified tracking
          inputTokens:
            finalUsage.inputTokens + additionalAgentTokens.inputTokens,
          outputTokens:
            finalUsage.outputTokens + additionalAgentTokens.outputTokens,
          totalTokens:
            finalUsage.totalTokens + additionalAgentTokens.totalTokens,
          reasoningTokens: finalUsage.reasoningTokens,
          cachedInputTokens: finalUsage.cachedInputTokens,
        };

        const capturedText = sanitizedParts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("");

        const _resp = responseMessage as unknown as { content?: unknown };
        const responseContent =
          typeof _resp.content === "string" ? (_resp.content ?? "") : "";

        const finalCapturedText = capturedText || responseContent;

        const detectedTextError = detectProviderErrorInText(
          finalCapturedText,
          selectedModel.provider
        );
        if (detectedTextError) {
          await saveErrorMessage(
            chatId,
            userMsgId,
            detectedTextError,
            token,
            selectedModel.id,
            selectedModel.name,
            enableSearch,
            reasoningEffort
          );
          return;
        }

        const depthLimitedParts = limitDepth(sanitizedParts, 14);

        const hasTextPart = sanitizedParts.some(
          (part) =>
            part.type === "text" &&
            typeof part.text === "string" &&
            part.text.length > 0
        );

        let partsToSave = depthLimitedParts;
        if (!hasTextPart && finalCapturedText) {
          partsToSave = [{ type: "text", text: finalCapturedText }];
        }

        // Persist durable RAG image metadata as a data part so it survives
        // ID swaps, refreshes, and DB rehydration.
        if (ragContext) {
          const imageMap = Object.values(ragContext.image_map ?? {});
          const relatedImages = ragContext.images ?? [];
          const imagesSkipped = ragContext.images_skipped ? 1 : 0;

          const ragDataPart = {
            type: "data-rag" as const,
            data: {
              imageMap,
              relatedImages,
              imagesSkipped,
            },
          };

          partsToSave = [...partsToSave, ragDataPart];
        }

        // Persist assistant message, but never let a persistence error tear down the stream.
        // If parts serialization fails, fall back to saving text-only.
        try {
          await fetchMutation(
            api.messages.saveAssistantMessage,
            {
              chatId,
              role: "assistant",
              content: finalCapturedText,
              parentMessageId: userMsgId || undefined,
              parts: partsToSave,
              metadata: finalMetadata,
            },
            { token }
          );
        } catch {
          try {
            await fetchMutation(
              api.messages.saveAssistantMessage,
              {
                chatId,
                role: "assistant",
                content: finalCapturedText,
                parentMessageId: userMsgId || undefined,
                parts: [{ type: "text", text: finalCapturedText }],
                metadata: finalMetadata,
              },
              { token }
            );
          } catch {
            // swallow
          }
        }

        try {
          if (wasUserKeyUsed) {
            // Use the correct API key provider (groq for Groq models, openrouter for all others)
            const apiKeyProviderForUsage =
              selectedModel.provider === "groq" ? "groq" : "openrouter";
            await fetchMutation(
              api.api_keys.incrementUserApiKeyUsage,
              { provider: apiKeyProviderForUsage },
              { token }
            );
          } else if (!selectedModel.skipRateLimit) {
            const usesPremiumCredits =
              selectedModel.usesPremiumCredits === true;

            await fetchMutation(
              api.users.incrementMessageCount,
              { usesPremiumCredits },
              { token }
            );
          }
        } catch {
          // swallow
        }
      },
      onError: (error) => {
        // Log full error for debugging (include nested response if available)
        try {
          console.error("[CHAT][STREAM][ERROR]", {
            provider: selectedModel.provider,
            modelId: selectedModel.id,
            error: serializeUnknownErrorForLog(error),
          });
        } catch (logErr) {
          console.error("[CHAT][STREAM][ERROR] failed to log error:", logErr);
        }

        // If error contains a `.response` with readable body, try to log it too
        try {
          // @ts-expect-error - defensive access
          const resp = error?.response;
          if (resp) {
            try {
              // resp may be a Response-like object
              const status = resp.status ?? resp.statusCode ?? null;
              let bodyStr = "<unavailable>";
              if (typeof resp.text === "function") {
                // resp.text may be async but error handlers are sync; attempt best-effort
                resp
                  .text()
                  .then((b: string) =>
                    console.error(
                      "[CHAT][STREAM][ERROR] response body:",
                      b.length > 2000 ? `${b.slice(0, 2000)}... [truncated]` : b
                    )
                  )
                  .catch(() =>
                    console.error(
                      "[CHAT][STREAM][ERROR] failed to read response.text()"
                    )
                  );
              } else if (resp.body) {
                try {
                  bodyStr = JSON.stringify(resp.body);
                } catch {
                  bodyStr = String(resp.body);
                }
                console.error(
                  "[CHAT][STREAM][ERROR] response body:",
                  bodyStr.slice(0, 2000)
                );
              }
              console.error("[CHAT][STREAM][ERROR] response status:", status);
            } catch (e) {
              console.error(
                "[CHAT][STREAM][ERROR] failed to log nested response:",
                e
              );
            }
          }
        } catch {
          // ignore logging failures
        }

        // First, try to detect provider-specific error patterns
        const detectedError = detectProviderErrorFromObject(
          error,
          selectedModel.provider
        );

        if (detectedError) {
          // Return the provider-specific user-friendly message
          console.error(
            "[CHAT][STREAM][ERROR] detected provider error:",
            detectedError
          );
          return detectedError.userFriendlyMessage;
        }

        // Fallback to original error handling and log classified result
        const { errorPayload, shouldSaveToConversation } = createStreamingError(
          error as unknown
        ) as any;
        console.error(
          "[CHAT][STREAM][ERROR] classified:",
          errorPayload,
          "saveToConversation:",
          shouldSaveToConversation
        );
        return errorPayload.error.message;
      },
    });

    // Create response with optional RAG image headers
    const response = createUIMessageStreamResponse({
      stream,
      consumeSseStream: consumeStream,
    });

    // Add RAG images to response headers if available
    if (ragContext) {
      // NOTE: RAG image data can easily exceed common header limits (and can
      // throw during header serialization). Never allow these headers to break
      // the chat stream.
      const MAX_RAG_HEADER_CHARS = 6000;

      let headerImagesSkipped = Boolean(ragContext.images_skipped);

      try {
        const encodedImageMap = encodeRAGImagesForHeader(ragContext, {
          maxChars: MAX_RAG_HEADER_CHARS,
        });
        if (encodedImageMap) {
          response.headers.set("X-RAG-Images", encodedImageMap);
        } else if (ragContext.image_map && Object.keys(ragContext.image_map).length > 0) {
          headerImagesSkipped = true;
        }

        const encodedRelatedImages = encodeRelatedImagesForHeader(ragContext, {
          maxChars: MAX_RAG_HEADER_CHARS,
        });
        if (encodedRelatedImages) {
          response.headers.set("X-RAG-Related-Images", encodedRelatedImages);
        } else if (ragContext.images && ragContext.images.length > 0) {
          headerImagesSkipped = true;
        }

        if (headerImagesSkipped) {
          // Frontend expects a numeric value.
          response.headers.set("X-RAG-Images-Skipped", "1");
        }
      } catch (headerError) {
        // Do not fail the stream if headers are too large/invalid.
        try {
          response.headers.delete("X-RAG-Images");
          response.headers.delete("X-RAG-Related-Images");
          response.headers.set("X-RAG-Images-Skipped", "1");
        } catch {
          // swallow
        }

        try {
          console.error("[RAG] Failed to set RAG image headers", {
            error: serializeUnknownErrorForLog(headerError),
          });
        } catch {
          // swallow
        }
      }
    }

    return response;
  } catch (err) {
    // console.log('Unhandled error in chat API:', err);
    return createErrorResponse(err);
  }
}
