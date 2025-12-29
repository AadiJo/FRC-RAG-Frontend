"use client";

import type { UIMessage } from "@ai-sdk/react";
import {
  createChatStore,
  Provider,
  useChat,
  useChatActions,
  useChatMessages,
  useChatStatus,
} from "@ai-sdk-tools/store";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery as useTanStackQuery } from "@tanstack/react-query";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { useConvex } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  Conversation,
  type MessageWithExtras,
} from "@/app/components/chat/conversation";
import { ChatInput } from "@/app/components/chat-input/chat-input";

import { useChatOperations } from "@/app/hooks/use-chat-operations";
import { useChatValidation } from "@/app/hooks/use-chat-validation";
import { useDocumentTitle } from "@/app/hooks/use-document-title";
import { useFileHandling } from "@/app/hooks/use-file-handling";
import { useChatSession } from "@/app/providers/chat-session-provider";
import { useSidebar } from "@/app/providers/sidebar-provider";
import { useUser } from "@/app/providers/user-provider";
import { ScrollButton } from "@/components/motion-primitives/scroll-button";
import { toast } from "@/components/ui/toast";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { createChatErrorHandler } from "@/lib/chat-error-utils";
import { MODEL_DEFAULT } from "@/lib/config";
import {
  createOptimisticAttachments,
  revokeOptimisticAttachments,
  uploadFilesInParallel,
} from "@/lib/file-upload-utils";
import {
  createPlaceholderId,
  mapMessage,
  validateInput,
} from "@/lib/message-utils";
import {
  createModelValidator,
  supportsReasoningEffort,
} from "@/lib/model-utils";
import { TRANSITION_LAYOUT } from "@/lib/motion";
import {
  decodeRAGImagesFromHeader,
  decodeRelatedImagesFromHeader,
  type RAGImage,
} from "@/lib/rag";
import { API_ROUTE_CHAT } from "@/lib/routes";
import {
  getDisplayName,
  getUserTimezone,
  isUserAuthenticated,
} from "@/lib/user-utils";
import { cn } from "@/lib/utils";
import frcPrompts from "./frc-prompts.json";

const DRAFT_STORE_KEY = "draft-chat";
const storeRegistry = new Map<
  string,
  ReturnType<typeof createChatStore<MessageWithExtras>>
>();

function getChatStoreForKey(key: string) {
  const existingStore = storeRegistry.get(key);
  if (existingStore) {
    return existingStore;
  }
  const newStore = createChatStore<MessageWithExtras>();
  storeRegistry.set(key, newStore);
  return newStore;
}

function promoteDraftStoreToChat(chatId: string) {
  if (!chatId || storeRegistry.has(chatId)) {
    return;
  }
  const draftStore = storeRegistry.get(DRAFT_STORE_KEY);
  if (!draftStore) {
    return;
  }
  draftStore.getState().setId(chatId);
  storeRegistry.set(chatId, draftStore);
  storeRegistry.set(DRAFT_STORE_KEY, createChatStore<MessageWithExtras>());
}

// Schema for chat body
const ChatBodySchema = z.object({
  chatId: z.string(),
  model: z.string(),
  personaId: z.string().optional(),
  enableSearch: z.boolean().optional(),
  enableRAG: z.boolean().optional(),
  reasoningEffort: z.enum(["low", "medium", "high"]).optional(),
  userInfo: z
    .object({
      timezone: z.string().optional(),
    })
    .optional(),
});

type ChatBody = z.infer<typeof ChatBodySchema>;

// Dynamic imports
const DialogAuth = dynamic(
  () => import("./dialog-auth").then((mod) => mod.DialogAuth),
  { ssr: false }
);

function ChatContent() {
  const { chatId, isDeleting, setIsDeleting } = useChatSession();
  const { isSidebarOpen } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    isLoading: isUserLoading,
    hasApiKey,
    isApiKeysLoading,
    apiKeys,
  } = useUser();

  // Check if user has any API keys at all
  const hasAnyApiKey = apiKeys.length > 0;

  const displayName = getDisplayName(user);
  // Choose a base prompt once per page visit and keep it stable.
  const basePromptRef = useRef<string | null>(null);
  if (basePromptRef.current === null) {
    const list = Array.isArray(frcPrompts) ? (frcPrompts as string[]) : [];
    if (list.length === 0) {
      basePromptRef.current = "What's on your mind?";
    } else {
      basePromptRef.current = list[Math.floor(Math.random() * list.length)];
    }
  }

  const onboardingPrompt = useMemo(() => {
    const raw = basePromptRef.current ?? "What's on your mind?";
    if (!raw.includes("{name}")) {
      return raw;
    }
    if (displayName) {
      return raw.replace("{name}", displayName);
    }
    return raw.replace("{name}", "").replace(/\s+/g, " ").trim();
  }, [displayName]);

  // Initialize utilities
  const getValidModel = useMemo(() => createModelValidator(), []);
  const _convex = useConvex();

  // Connector status is calculated server-side for security

  // Custom hooks
  const {
    handleCreateChat,
    handleModelChange: handleModelUpdate,
    handleBranch,
    handleDeleteMessage,
  } = useChatOperations();

  const { checkRateLimits, validateModelAccess, validateSearchQuery } =
    useChatValidation();

  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    processFiles,
    createOptimisticFiles,
    hasFiles,
    uploadFile,
    saveFileAttachment,
  } = useFileHandling();

  // Local state
  const [hasDialogAuth, setHasDialogAuth] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<
    "low" | "medium" | "high"
  >("low");
  const [tempPersonaId, setTempPersonaId] = useState<string | undefined>();
  const [tempSelectedModel, setTempSelectedModel] = useState<
    string | undefined
  >();
  const processedUrl = useRef(false);

  // RAG images state - stores images per message ID
  const [ragImagesByMessage, setRagImagesByMessage] = useState<
    Record<
      string,
      { imageMap: RAGImage[]; relatedImages: RAGImage[]; skipped: number }
    >
  >({});

  const activeRequestAbortControllerRef = useRef<AbortController | null>(null);

  // Custom fetch that extracts RAG headers
  const ragFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const activeSignal = activeRequestAbortControllerRef.current?.signal;
      const initSignal = init?.signal;
      const signals = [initSignal, activeSignal].filter(
        (signal): signal is AbortSignal => Boolean(signal)
      );

      if (signals.length <= 1) {
        const response = await fetch(
          input,
          activeSignal && !initSignal ? { ...init, signal: activeSignal } : init
        );

        // Check for RAG headers
        const ragImagesHeader = response.headers.get("X-RAG-Images");
        const ragRelatedHeader = response.headers.get("X-RAG-Related-Images");
        const ragSkippedHeader = response.headers.get("X-RAG-Images-Skipped");

        // Debug: Log headers
        if (process.env.NODE_ENV === "development") {
          console.log("[ragFetch] RAG Headers:", {
            hasImageMap: !!ragImagesHeader,
            hasRelated: !!ragRelatedHeader,
            skipped: ragSkippedHeader,
          });
        }

        if (ragImagesHeader || ragRelatedHeader) {
          const rawImageMap = ragImagesHeader
            ? decodeRAGImagesFromHeader(ragImagesHeader)
            : null;
          const rawRelatedImages = ragRelatedHeader
            ? decodeRelatedImagesFromHeader(ragRelatedHeader)
            : null;
          const skipped = (() => {
            if (!ragSkippedHeader) {
              return 0;
            }
            const value = ragSkippedHeader.trim().toLowerCase();
            if (value === "true") {
              return 1;
            }
            if (value === "false") {
              return 0;
            }
            const parsed = Number(value);
            return Number.isFinite(parsed)
              ? Math.max(0, Math.floor(parsed))
              : 0;
          })();

          // Debug: Log decoded data
          if (process.env.NODE_ENV === "development") {
            console.log("[ragFetch] Decoded RAG data:", {
              rawImageMapKeys: rawImageMap ? Object.keys(rawImageMap) : [],
              relatedCount: rawRelatedImages?.length ?? 0,
            });
          }

          // Convert Record<string, RAGImage> to RAGImage[] while preserving the
          // placeholder id (the record key) as `image_id`.
          // Strip [img:...] wrapper if present since the text parser extracts bare IDs.
          const imageMap: RAGImage[] = rawImageMap
            ? Object.entries(rawImageMap).map(([key, image]) => {
                // Strip [img:...] wrapper from key if present
                const bareId =
                  key.startsWith("[img:") && key.endsWith("]")
                    ? key.slice(5, -1)
                    : key;
                return {
                  ...image,
                  image_id: bareId,
                };
              })
            : [];
          const relatedImages: RAGImage[] = rawRelatedImages ?? [];

          // Store RAG images - we'll associate them with the message once we have the ID
          // For now, store with a pending key
          setRagImagesByMessage((prev) => ({
            ...prev,
            _pending: { imageMap, relatedImages, skipped },
          }));
        }

        return response;
      }

      const mergedController = new AbortController();
      const abort = () => mergedController.abort();
      for (const signal of signals) {
        if (signal.aborted) {
          mergedController.abort();
          break;
        }
        signal.addEventListener("abort", abort, { once: true });
      }

      const response = await fetch(input, {
        ...init,
        signal: mergedController.signal,
      });

      // Check for RAG headers
      const ragImagesHeader = response.headers.get("X-RAG-Images");
      const ragRelatedHeader = response.headers.get("X-RAG-Related-Images");
      const ragSkippedHeader = response.headers.get("X-RAG-Images-Skipped");

      // Debug: Log headers
      if (process.env.NODE_ENV === "development") {
        console.log("[ragFetch] RAG Headers:", {
          hasImageMap: !!ragImagesHeader,
          hasRelated: !!ragRelatedHeader,
          skipped: ragSkippedHeader,
        });
      }

      if (ragImagesHeader || ragRelatedHeader) {
        const rawImageMap = ragImagesHeader
          ? decodeRAGImagesFromHeader(ragImagesHeader)
          : null;
        const rawRelatedImages = ragRelatedHeader
          ? decodeRelatedImagesFromHeader(ragRelatedHeader)
          : null;
        const skipped = (() => {
          if (!ragSkippedHeader) {
            return 0;
          }
          const value = ragSkippedHeader.trim().toLowerCase();
          if (value === "true") {
            return 1;
          }
          if (value === "false") {
            return 0;
          }
          const parsed = Number(value);
          return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
        })();

        // Debug: Log decoded data
        if (process.env.NODE_ENV === "development") {
          console.log("[ragFetch] Decoded RAG data:", {
            rawImageMapKeys: rawImageMap ? Object.keys(rawImageMap) : [],
            relatedCount: rawRelatedImages?.length ?? 0,
          });
        }

        // Convert Record<string, RAGImage> to RAGImage[] while preserving the
        // placeholder id (the record key) as `image_id`.
        // Strip [img:...] wrapper if present since the text parser extracts bare IDs.
        const imageMap: RAGImage[] = rawImageMap
          ? Object.entries(rawImageMap).map(([key, image]) => {
              // Strip [img:...] wrapper from key if present
              const bareId =
                key.startsWith("[img:") && key.endsWith("]")
                  ? key.slice(5, -1)
                  : key;
              return {
                ...image,
                image_id: bareId,
              };
            })
          : [];
        const relatedImages: RAGImage[] = rawRelatedImages ?? [];

        // Store RAG images - we'll associate them with the message once we have the ID
        // For now, store with a pending key
        setRagImagesByMessage((prev) => ({
          ...prev,
          _pending: { imageMap, relatedImages, skipped },
        }));
      }

      return response;
    },
    []
  );

  // Data queries
  const { data: messagesFromDB } = useTanStackQuery({
    ...convexQuery(
      api.messages.getMessagesForChat,
      chatId ? { chatId: chatId as Id<"chats"> } : "skip"
    ),
    enabled: Boolean(chatId),
  });

  const { data: currentChat } = useTanStackQuery({
    ...convexQuery(
      api.chats.getChat,
      chatId ? { chatId: chatId as Id<"chats"> } : "skip"
    ),
    enabled: Boolean(chatId),
  });

  // Derived state
  const selectedModel = useMemo(() => {
    if (currentChat?.model) {
      return getValidModel(currentChat.model, user?.disabledModels);
    }
    const preferredModel =
      tempSelectedModel ?? user?.preferredModel ?? MODEL_DEFAULT;
    return getValidModel(preferredModel, user?.disabledModels);
  }, [
    currentChat?.model,
    tempSelectedModel,
    user?.preferredModel,
    user?.disabledModels,
    getValidModel,
  ]);

  const personaId = currentChat?.personaId ?? tempPersonaId;
  const isAuthenticated = isUserAuthenticated(user);

  // Enhanced useChat hook with AI SDK best practices
  const { regenerate, setMessages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: API_ROUTE_CHAT,
      // Global configuration
      headers: {
        "Content-Type": "application/json",
      },
      // Use custom fetch to capture RAG headers
      fetch: ragFetch,
    }),
    experimental_throttle: 25,
    // AI SDK error handling
    onError: createChatErrorHandler(),
  });

  const messages = useChatMessages<MessageWithExtras>();
  const status = useChatStatus();
  const chatActions = useChatActions<MessageWithExtras>();

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const pendingRagMinMessageIndexRef = useRef<number | null>(null);
  const stoppedByUserRef = useRef(false);

  // Clear the abort controller when streaming/submitted ends
  useEffect(() => {
    if (status === "ready" || status === "error") {
      activeRequestAbortControllerRef.current = null;
    }
  }, [status]);

  const stopAndMarkMessage = useCallback(() => {
    stoppedByUserRef.current = true;
    const controller = activeRequestAbortControllerRef.current;
    if (controller) {
      controller.abort();
      activeRequestAbortControllerRef.current = null;
    }
    chatActions.stop();

    // CRITICAL: Use messagesRef.current (the currently DISPLAYED/throttled messages)
    // instead of the internal store messages which may have buffered content from
    // smoothStream that hasn't been rendered yet. This ensures the stop is instant
    // and no additional text appears after the user clicks stop.
    const displayedMessages = [...messagesRef.current];

    // Find the assistant message that belongs to the CURRENT request
    // (i.e., at or after the index when we sent the message)
    const minIndex = pendingRagMinMessageIndexRef.current ?? 0;

    // Look for an assistant message at or after minIndex
    let targetIndex = -1;
    for (let i = displayedMessages.length - 1; i >= minIndex; i -= 1) {
      const msg = displayedMessages[i];
      if (msg?.role === "assistant") {
        targetIndex = i;
        break;
      }
    }

    // If we found an assistant message for the current request, mark it
    if (targetIndex >= 0) {
      const msg = displayedMessages[targetIndex];
      const parts = msg.parts ?? [];
      const alreadyMarked = parts.some((part) => {
        if (!part || typeof part !== "object") {
          return false;
        }
        const maybe = part as Record<string, unknown>;
        if (maybe.type !== "data-notice") {
          return false;
        }
        const data = maybe.data as Record<string, unknown> | undefined;
        return Boolean(data && data.code === "STOPPED_BY_USER");
      });

      if (!alreadyMarked) {
        displayedMessages[targetIndex] = {
          ...msg,
          parts: [
            ...parts,
            {
              type: "data-notice",
              data: {
                code: "STOPPED_BY_USER",
                message: "Stopped by user",
              },
            },
          ],
        };
      }

      // Set the frozen displayed state, truncating any buffered content
      setMessages(displayedMessages);
    } else {
      // No assistant message for current request yet (still in "submitted" phase)
      // Create a new assistant message with the stopped notice
      const last = displayedMessages.at(-1);
      if (last?.role === "user") {
        setMessages([
          ...displayedMessages,
          {
            id: `stopped-${Date.now()}`,
            role: "assistant",
            parts: [
              {
                type: "data-notice",
                data: {
                  code: "STOPPED_BY_USER",
                  message: "Stopped by user",
                },
              },
            ],
          },
        ]);
      } else {
        // Fallback: just freeze the current displayed state
        setMessages(displayedMessages);
      }
    }

    setRagImagesByMessage((prev) => {
      if (!prev._pending) {
        return prev;
      }
      const { _pending, ...rest } = prev;
      return rest;
    });
  }, [chatActions, setMessages]);

  useEffect(() => {
    if (!chatId) {
      chatActions.reset();
      setTempPersonaId(undefined);
      setTempSelectedModel(undefined);
    }
  }, [chatActions, chatId]);

  // Associate pending RAG images with the latest assistant message
  useEffect(() => {
    const pendingImages = ragImagesByMessage._pending;
    if (!pendingImages) {
      return;
    }

    // Debug: Log pending images
    if (process.env.NODE_ENV === "development") {
      console.log("[Chat] Pending RAG images:", {
        imageMapCount: pendingImages.imageMap.length,
        relatedCount: pendingImages.relatedImages.length,
        imageMapIds: pendingImages.imageMap.map((img) => img.image_id),
      });
    }

    // RAG headers are returned on the fetch response, which can arrive before
    // the assistant message is appended to `messages`. If we eagerly bind to the
    // "last assistant", we often attach images to the *previous* assistant.
    // Instead, bind to the first assistant message that appears at/after the
    // message index captured at send-time.
    const minIndex = pendingRagMinMessageIndexRef.current ?? 0;
    let target: MessageWithExtras | undefined;
    for (let i = messages.length - 1; i >= minIndex; i -= 1) {
      const msg = messages[i];
      if (msg?.role === "assistant") {
        target = msg;
        break;
      }
    }

    if (!target) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[Chat] No target assistant message found for RAG images yet"
        );
      }
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[Chat] Associating RAG images with message: ${target.id}`);
    }

    setRagImagesByMessage((prev) => {
      const { _pending, ...rest } = prev;
      return {
        ...rest,
        [target.id]: pendingImages,
      };
    });
    pendingRagMinMessageIndexRef.current = null;
  }, [messages, ragImagesByMessage._pending]);

  // Message synchronization effect - optimized to prevent infinite re-renders
  useEffect(() => {
    if (
      !chatId ||
      (status !== "ready" && status !== "error") ||
      !messagesFromDB ||
      isDeleting ||
      stoppedByUserRef.current
    ) {
      return;
    }

    const mappedDb = messagesFromDB.map((msg, index) => {
      const mappedMessage = mapMessage(msg) as MessageWithExtras;

      if (msg.role === "user") {
        // Next message is always the assistant response
        const nextMsg = messagesFromDB[index + 1];
        if (nextMsg?.role === "assistant") {
          if (nextMsg.metadata?.modelId) {
            mappedMessage.model = nextMsg.metadata.modelId;
          }
          // Copy search setting from assistant's metadata to the user message metadata
          if (nextMsg.metadata?.includeSearch !== undefined) {
            mappedMessage.metadata = {
              ...mappedMessage.metadata,
              includeSearch: nextMsg.metadata.includeSearch,
            };
          }
        }
      } else if (msg.role === "assistant" && msg.metadata?.modelId) {
        mappedMessage.model = msg.metadata.modelId;
      }

      return mappedMessage;
    });

    let idMigrations: Array<{ from: string; to: string }> = [];

    // Use functional update to access current messages without creating a dependency
    setMessages((currentMessages) => {
      // Early return if DB is empty
      if (mappedDb.length === 0) {
        return currentMessages;
      }

      // Check if we need to update at all by comparing lengths and IDs
      if (
        mappedDb.length === currentMessages.length &&
        mappedDb.every((dbMsg, idx) => dbMsg.id === currentMessages[idx]?.id)
      ) {
        return currentMessages; // No change needed - prevents unnecessary re-renders
      }

      if (mappedDb.length >= currentMessages.length) {
        // DB is up-to-date or ahead – merge to preserve streaming properties
        const max = Math.min(currentMessages.length, mappedDb.length);
        idMigrations = [];
        for (let i = 0; i < max; i += 1) {
          const from = currentMessages[i]?.id;
          const to = mappedDb[i]?.id;
          if (
            from &&
            to &&
            from !== to &&
            from !== "_pending" &&
            to !== "_pending"
          ) {
            idMigrations.push({ from, to });
          }
        }

        const merged = mappedDb.map((dbMsg: UIMessage, idx: number) => {
          const prev = currentMessages[idx];
          if (prev?.parts && !dbMsg.parts) {
            return { ...dbMsg, parts: prev.parts };
          }
          return dbMsg;
        });
        return merged;
      }
      if (mappedDb.length > 0) {
        // DB is behind: merge IDs for the portion we have without dropping optimistic messages
        idMigrations = [];
        const merged = currentMessages.map((msg, idx) => {
          if (idx < mappedDb.length) {
            const dbMsg = mappedDb[idx];
            if (
              msg.id !== dbMsg.id &&
              msg.id !== "_pending" &&
              dbMsg.id !== "_pending"
            ) {
              idMigrations.push({ from: msg.id, to: dbMsg.id });
            }
            return {
              ...msg,
              id: dbMsg.id,
              // Prefer DB parts once streaming is done so we pick up persisted extras
              // like RAG image data parts.
              parts: dbMsg.parts ?? msg.parts,
            };
          }
          return msg;
        });
        return merged;
      }

      return currentMessages;
    });

    if (idMigrations.length > 0) {
      setRagImagesByMessage((prev) => {
        let changed = false;
        const next: Record<
          string,
          { imageMap: RAGImage[]; relatedImages: RAGImage[]; skipped: number }
        > = { ...prev };

        for (const migration of idMigrations) {
          if (next[migration.to] !== undefined) {
            continue;
          }
          const existing = next[migration.from];
          if (existing === undefined) {
            continue;
          }
          next[migration.to] = existing;
          delete next[migration.from];
          changed = true;
        }

        return changed ? next : prev;
      });
    }
  }, [chatId, messagesFromDB, status, setMessages, isDeleting]);

  // Core message sending function
  const sendMessageHelper = useCallback(
    async (
      inputMessage: string,
      currentChatId?: string,
      options?: { enableSearch?: boolean }
    ) => {
      const chatIdToUse = currentChatId || chatId;
      if (!chatIdToUse) {
        return;
      }

      const isReasoningModel = supportsReasoningEffort(selectedModel);
      const timezone = getUserTimezone();

      const body: ChatBody = {
        chatId: chatIdToUse,
        model: selectedModel,
        personaId,
        enableRAG: true, // Enable RAG by default for FRC
        ...(typeof options?.enableSearch !== "undefined"
          ? { enableSearch: options.enableSearch }
          : {}),
        ...(isReasoningModel ? { reasoningEffort } : {}),
        ...(timezone ? { userInfo: { timezone } } : {}),
      };

      // Handle files if present
      let attachments: FileUIPart[] | undefined;
      if (hasFiles) {
        const optimisticAttachments = createOptimisticFiles();
        const placeholderId = createPlaceholderId();

        // Add optimistic message
        setMessages((cur) => [
          ...cur,
          {
            id: placeholderId,
            role: "user" as const,
            parts: [
              { type: "text", text: inputMessage },
              ...optimisticAttachments,
            ],
          },
        ]);

        try {
          attachments = await processFiles(chatIdToUse as Id<"chats">);
          // Remove placeholder and cleanup blob URLs
          setMessages((cur) => cur.filter((m) => m.id !== placeholderId));
          revokeOptimisticAttachments(optimisticAttachments);
        } catch {
          // Remove placeholder and cleanup blob URLs; rely on upload utils to toast errors
          setMessages((cur) => cur.filter((m) => m.id !== placeholderId));
          revokeOptimisticAttachments(optimisticAttachments);
          return;
        }
      }

      // Send message with AI SDK
      try {
        const messageParts = [
          { type: "text" as const, text: inputMessage },
          ...(attachments || []),
        ];

        // Capture the current message count so we can later bind RAG headers to
        // the assistant message created for *this* send.
        pendingRagMinMessageIndexRef.current = messagesRef.current.length;

        // Reset stopped flag for new request
        stoppedByUserRef.current = false;

        // Create abort controller BEFORE sending - it will be cleared by
        // the useEffect when status transitions to ready/error
        activeRequestAbortControllerRef.current = new AbortController();
        await sendMessage({ parts: messageParts, role: "user" }, { body });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        toast({ title: "Failed to send message", status: "error" });
      }
    },
    [
      chatId,
      selectedModel,
      personaId,
      reasoningEffort,
      hasFiles,
      createOptimisticFiles,
      processFiles,
      sendMessage,
      setMessages,
    ]
  );

  // URL parameter processing
  useEffect(() => {
    if (isUserLoading || isApiKeysLoading || !user || processedUrl.current) {
      return;
    }

    const modelId = searchParams.get("model");
    const query = searchParams.get("q");

    if (modelId && query) {
      processedUrl.current = true;

      const trimmedQuery = validateSearchQuery(query);
      if (!trimmedQuery) {
        return;
      }

      if (!validateModelAccess(modelId, user, hasApiKey)) {
        return;
      }

      const startChat = async () => {
        try {
          const newChatId = await handleCreateChat(
            trimmedQuery,
            modelId,
            personaId
          );
          if (newChatId) {
            promoteDraftStoreToChat(newChatId);
            window.history.pushState(null, "", `/chat/${newChatId}`);
            const sendPromise = sendMessageHelper(trimmedQuery, newChatId, {
              enableSearch: false,
            });
            // Scroll to bottom immediately so user's new message is visible
            try {
              conversationBottomRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
              });
            } catch {
              // Ignore scroll failures (e.g. element not mounted yet)
            }
            await sendPromise;
          }
        } catch {
          toast({ title: "Failed to create chat", status: "error" });
        }
      };

      startChat();
    }
  }, [
    isUserLoading,
    isApiKeysLoading,
    user,
    searchParams,
    hasApiKey,
    handleCreateChat,
    personaId,
    validateSearchQuery,
    validateModelAccess,
    sendMessageHelper,
  ]);

  // Main submit handler
  const submit = useCallback(
    async (
      inputMessage: string,
      opts?: { body?: { enableSearch?: boolean } }
    ) => {
      if (!validateInput(inputMessage, files.length, user?._id)) {
        return;
      }

      const allowed = checkRateLimits(isAuthenticated, setHasDialogAuth);
      if (!allowed) {
        return;
      }

      let currentChatId = chatId;

      // Create chat if needed
      if (!currentChatId && messages.length === 0 && inputMessage) {
        currentChatId = await handleCreateChat(
          inputMessage,
          selectedModel,
          personaId
        );
        if (!currentChatId) {
          return;
        }

        promoteDraftStoreToChat(currentChatId);
        window.history.pushState(null, "", `/chat/${currentChatId}`);
        setTempSelectedModel(undefined);
        setTempPersonaId(undefined);
      }

      clearFiles();
      const sendPromise = sendMessageHelper(
        inputMessage,
        currentChatId || undefined,
        opts?.body
      );
      try {
        conversationBottomRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      } catch {
        // Ignore scroll failures (e.g. element not mounted yet)
      }
      await sendPromise;
    },
    [
      files.length,
      user?._id,
      checkRateLimits,
      isAuthenticated,
      chatId,
      messages.length,
      handleCreateChat,
      selectedModel,
      personaId,
      clearFiles,
      sendMessageHelper,
    ]
  );

  // Model change handler
  const handleModelChange = useCallback(
    async (model: string) => {
      // Allow anonymous and logged-in users to change the model selection in UI.
      // For new chats (no chatId yet), store temporarily.
      if (!chatId) {
        setTempSelectedModel(model);
        return;
      }

      // For existing chats, persist via mutation. Server validates access.
      await handleModelUpdate(chatId, model, user);
    },
    [chatId, user, handleModelUpdate]
  );

  // Message handlers
  const handleDelete = useCallback(
    async (id: string) => {
      const currentMessages = messagesRef.current;
      const originalMessages = [...currentMessages];
      const idx = originalMessages.findIndex((m) => m.id === id);

      if (idx === -1) {
        return;
      }

      const filteredMessages = originalMessages.slice(0, idx);
      setMessages(filteredMessages);
      setIsDeleting(true);

      try {
        const result = await handleDeleteMessage(id);
        if (result?.chatDeleted) {
          router.push("/chat");
        } else {
          setIsDeleting(false);
        }
      } catch {
        setMessages(originalMessages);
        setIsDeleting(false);
      }
    },
    [handleDeleteMessage, router, setIsDeleting, setMessages]
  );

  const handleReload = useCallback(
    async (messageId: string, opts?: { enableSearch?: boolean }) => {
      if (!(user?._id && chatId)) {
        return;
      }

      const currentMessages = messagesRef.current;
      const originalMessages = [...currentMessages];
      const targetIdx = originalMessages.findIndex((m) => m.id === messageId);

      if (targetIdx === -1) {
        return;
      }

      const trimmedMessages = originalMessages.slice(0, targetIdx + 1);
      setMessages(trimmedMessages);

      const firstFollowing = originalMessages[targetIdx + 1];
      if (firstFollowing) {
        setIsDeleting(true);
        try {
          await handleDeleteMessage(firstFollowing.id);
        } catch {
          setMessages(originalMessages);
          toast({
            title: "Failed to delete messages for reload",
            status: "error",
          });
        } finally {
          setIsDeleting(false);
        }
      }

      const isReasoningModel = supportsReasoningEffort(selectedModel);
      const timezone = getUserTimezone();

      const options = {
        body: {
          chatId,
          model: selectedModel,
          personaId,
          reloadAssistantMessageId: messageId,
          enableRAG: true, // Enable RAG by default for FRC
          ...(typeof opts?.enableSearch !== "undefined"
            ? { enableSearch: opts.enableSearch }
            : {}),
          ...(isReasoningModel ? { reasoningEffort } : {}),
          ...(timezone ? { userInfo: { timezone } } : {}),
        },
      };
      regenerate(options);
    },
    [
      user,
      chatId,
      selectedModel,
      personaId,
      reasoningEffort,
      setMessages,
      handleDeleteMessage,
      setIsDeleting,
      regenerate,
    ]
  );

  const handleEdit = useCallback(
    async (
      id: string,
      newText: string,
      editOptions: {
        model: string;
        enableSearch: boolean;
        files: File[];
        reasoningEffort: "low" | "medium" | "high";
        removedFileUrls?: string[];
      }
    ) => {
      if (!chatId) {
        return;
      }

      const originalMessages = [...messagesRef.current];
      const targetIdx = originalMessages.findIndex((m) => m.id === id);

      if (targetIdx === -1) {
        return;
      }

      // Helper function to filter out optimistic (blob URL) files
      const getNonOptimisticFiles = (parts: UIMessage["parts"]) =>
        (parts || [])
          .filter((part): part is FileUIPart => part.type === "file")
          .filter(
            (file) =>
              !(typeof file.url === "string" && file.url.startsWith("blob:"))
          );

      // No-op guard: Check if edit has no substantive changes
      const originalMessage = originalMessages[targetIdx] as MessageWithExtras;
      const originalText =
        originalMessage.parts?.find((p) => p.type === "text")?.text || "";

      // Get current settings for comparison
      const originalModel = originalMessage.model || selectedModel;
      const originalSearch = originalMessage.metadata?.includeSearch ?? false;
      const originalEffort =
        originalMessage.metadata?.reasoningEffort || reasoningEffort;

      // Return early if nothing has changed
      if (
        originalText.trim() === newText.trim() &&
        editOptions.files.length === 0 &&
        originalModel === editOptions.model &&
        originalSearch === editOptions.enableSearch &&
        originalEffort === editOptions.reasoningEffort &&
        (editOptions.removedFileUrls?.length ?? 0) === 0
      ) {
        return;
      }

      // Process new files if any were added
      const hasNewFiles = editOptions.files.length > 0;
      let optimisticFileParts: FileUIPart[] = [];

      if (hasNewFiles) {
        // Create optimistic attachments for immediate UI feedback
        optimisticFileParts = createOptimisticAttachments(editOptions.files);
      }

      try {
        const removedSet = new Set(
          (editOptions.removedFileUrls || []).map((u) => u.split("?")[0])
        );
        // 1. Update message content and remove subsequent messages immediately
        setMessages((currentMsgs) => {
          const editTargetIdx = currentMsgs.findIndex((m) => m.id === id);
          if (editTargetIdx === -1) {
            return currentMsgs;
          }

          // Single pass: slice and update in one operation
          return currentMsgs.slice(0, editTargetIdx + 1).map((msg, idx) => {
            // Only create new object for the edited message
            if (idx !== editTargetIdx) {
              return msg; // Return unchanged reference
            }

            // Update only the edited message
            const existingNonOptimisticFiles = getNonOptimisticFiles(msg.parts);
            const filteredExisting = existingNonOptimisticFiles.filter((f) => {
              const url = typeof f.url === "string" ? f.url.split("?")[0] : "";
              return !removedSet.has(url);
            });

            return {
              ...msg,
              parts: [
                { type: "text" as const, text: newText },
                ...filteredExisting,
                ...optimisticFileParts, // Include optimistic files for immediate feedback
              ],
            };
          });
        });

        // 2. Upload files if any (replace optimistic with real files after upload)
        if (hasNewFiles) {
          try {
            const newFileParts = await uploadFilesInParallel(
              editOptions.files,
              chatId as Id<"chats">,
              uploadFile,
              ({ chatId: cid, key, fileName }) =>
                saveFileAttachment({ chatId: cid, key, fileName })
            );

            // Update again to replace optimistic files with uploaded files
            setMessages((currentMsgs) => {
              const editIdx = currentMsgs.findIndex((m) => m.id === id);
              if (editIdx === -1) {
                return currentMsgs;
              }

              const next = currentMsgs.map((msg, idx) => {
                if (idx !== editIdx) {
                  return msg;
                }

                // Remove blob URLs and add real uploaded files
                const nonBlobFiles = getNonOptimisticFiles(msg.parts).filter(
                  (f) => {
                    const url =
                      typeof f.url === "string" ? f.url.split("?")[0] : "";
                    return !removedSet.has(url);
                  }
                );

                return {
                  ...msg,
                  parts: [
                    { type: "text" as const, text: newText },
                    ...nonBlobFiles,
                    ...newFileParts, // Real uploaded files
                  ],
                };
              });
              // Cleanup any previously created blob URLs now that we've replaced them
              revokeOptimisticAttachments(optimisticFileParts);
              return next;
            });
          } catch (_error) {
            // Rollback on file upload failure
            revokeOptimisticAttachments(optimisticFileParts);
            setMessages(originalMessages);
            return; // Abort edit on file upload failure
          }
        }

        // 3. Trigger AI regeneration using the edit-specific model and settings
        const isEditReasoningModel = supportsReasoningEffort(editOptions.model);
        const timezone = getUserTimezone();

        const options = {
          body: {
            chatId,
            model: editOptions.model, // Use the model selected in edit mode
            personaId,
            editMessageId: id,
            enableRAG: true, // Enable RAG by default for FRC
            enableSearch: editOptions.enableSearch, // Use edit-specific search setting
            ...(isEditReasoningModel
              ? { reasoningEffort: editOptions.reasoningEffort }
              : {}),
            ...(timezone ? { userInfo: { timezone } } : {}),
          },
        };

        await regenerate(options);
      } catch {
        // Rollback on failure - restore all original messages
        setMessages(originalMessages);
        toast({
          title: "Failed to update message",
          status: "error",
        });
      }
    },
    [
      chatId,
      personaId,
      setMessages,
      regenerate,
      uploadFile,
      saveFileAttachment,
      selectedModel,
      reasoningEffort,
    ]
  );

  // Chat redirect effect
  useEffect(() => {
    if (!isUserLoading && chatId && currentChat === null && !isDeleting) {
      router.replace("/chat");
    }
  }, [chatId, currentChat, isUserLoading, router, isDeleting]);

  // Document title update
  useDocumentTitle(currentChat?.title, chatId || undefined);

  // Message scrolling
  const targetMessageId = searchParams.get("m");
  const hasScrolledRef = useRef(false);
  const conversationContainerRef = useRef<HTMLDivElement>(null);
  const conversationBottomRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [composerHeight, setComposerHeight] = useState(0);

  useEffect(() => {
    if (targetMessageId) {
      hasScrolledRef.current = false;
    }
  }, [targetMessageId]);

  useEffect(() => {
    if (!targetMessageId || hasScrolledRef.current || messages.length === 0) {
      return;
    }
    const el = document.getElementById(targetMessageId);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      hasScrolledRef.current = true;
    }
  }, [targetMessageId, messages]);

  const hasMessages = messages.length > 0 || chatId;

  useEffect(() => {
    if (!hasMessages) {
      setComposerHeight(0);
      return;
    }

    const composer = composerRef.current;
    if (!composer) {
      setComposerHeight(0);
      return;
    }

    const updateHeight = () => {
      setComposerHeight(composer.getBoundingClientRect().height);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    resizeObserver.observe(composer);

    return () => {
      resizeObserver.disconnect();
    };
  }, [hasMessages]);

  // Early return for redirect
  if (currentChat === null && chatId) {
    return null;
  }

  return (
    <div
      className={cn(
        "@container/main relative flex h-full flex-col items-center",
        hasMessages ? "justify-end" : "justify-center"
      )}
      style={
        { "--chat-input-height": `${composerHeight}px` } as React.CSSProperties
      }
    >
      <DialogAuth open={hasDialogAuth} setOpenAction={setHasDialogAuth} />

      <AnimatePresence initial={false} mode="popLayout">
        {!chatId && messages.length === 0 ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 pt-20"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="onboarding"
            layout="position"
            layoutId="onboarding"
            transition={{ layout: { duration: 0 } }}
          >
            <h1 className="mb-6 font-medium text-3xl tracking-tight">
              {onboardingPrompt}
            </h1>
            <div className="w-full">
              <ChatInput
                files={files}
                hasAnyApiKey={hasAnyApiKey}
                hasSuggestions={!chatId && messages.length === 0}
                isReasoningModel={supportsReasoningEffort(selectedModel)}
                isUserAuthenticated={isAuthenticated}
                onFileRemoveAction={removeFile}
                onFileUploadAction={addFiles}
                onSelectModelAction={handleModelChange}
                onSelectReasoningEffortAction={setReasoningEffort}
                onSelectSystemPromptAction={(id: string) =>
                  setTempPersonaId(id)
                }
                onSendAction={(
                  message: string,
                  { enableSearch }: { enableSearch: boolean }
                ) => submit(message, { body: { enableSearch } })}
                onStopAction={stopAndMarkMessage}
                onSuggestionAction={(suggestion: string) =>
                  sendMessage({ text: suggestion })
                }
                reasoningEffort={reasoningEffort}
                selectedModel={selectedModel}
                selectedPersonaId={personaId}
              />
            </div>
          </motion.div>
        ) : (
          <>
            <Conversation
              autoScroll={!targetMessageId}
              containerRef={conversationContainerRef}
              hasAnyApiKey={hasAnyApiKey}
              isReasoningModel={supportsReasoningEffort(selectedModel)}
              isUserAuthenticated={isAuthenticated}
              key="conversation"
              onBranch={(messageId) => {
                if (!chatId) {
                  return;
                }
                handleBranch(chatId, messageId, user);
              }}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onReload={handleReload}
              ragImagesByMessage={ragImagesByMessage}
              reasoningEffort={reasoningEffort}
              scrollToRef={conversationBottomRef}
              selectedModel={selectedModel}
            />
            {/* Guaranteed visible bottom padding for related images, not inside scrollable area */}
            <div
              aria-hidden="true"
              style={{ height: "164px", width: "100%" }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Input Area - Fixed at bottom only when there are messages */}
      {hasMessages ? (
        <div
          className={cn(
            "fixed right-0 bottom-0 left-0 z-40 px-4 pt-4 pb-4 transition-[left] duration-300 ease-out",
            isSidebarOpen ? "md:left-72" : "md:left-0"
          )}
          ref={composerRef}
        >
          <motion.div
            className={cn("mx-auto flex w-full max-w-3xl flex-col gap-2")}
            layout="position"
            layoutId="chat-input-container"
            transition={{
              layout: {
                ...TRANSITION_LAYOUT,
                duration: messages.length === 1 ? 0.2 : 0,
              },
            }}
          >
            <div className="flex w-full justify-end px-2">
              <ScrollButton
                anchorRef={conversationBottomRef}
                aria-label="Scroll to bottom"
                className="border border-white/10 bg-white/5 text-white/80 shadow-lg backdrop-blur-xl hover:bg-white/[0.07] hover:text-white"
                containerRef={conversationContainerRef}
                size="icon"
                type="button"
                variant="ghost"
              />
            </div>
            <div className="w-full min-w-0">
              <ChatInput
                files={files}
                hasAnyApiKey={hasAnyApiKey}
                hasSuggestions={false}
                isReasoningModel={supportsReasoningEffort(selectedModel)}
                isUserAuthenticated={isAuthenticated}
                onFileRemoveAction={removeFile}
                onFileUploadAction={addFiles}
                onSelectModelAction={handleModelChange}
                onSelectReasoningEffortAction={setReasoningEffort}
                onSelectSystemPromptAction={(id: string) =>
                  setTempPersonaId(id)
                }
                onSendAction={(
                  message: string,
                  { enableSearch }: { enableSearch: boolean }
                ) => submit(message, { body: { enableSearch } })}
                onStopAction={stopAndMarkMessage}
                onSuggestionAction={(suggestion: string) =>
                  sendMessage({ text: suggestion })
                }
                reasoningEffort={reasoningEffort}
                selectedModel={selectedModel}
                selectedPersonaId={personaId}
              />
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}

export default function Chat() {
  const { chatId } = useChatSession();
  const storeKey = chatId ?? DRAFT_STORE_KEY;
  const chatStore = useMemo(() => getChatStoreForKey(storeKey), [storeKey]);

  return (
    <Provider store={chatStore}>
      <ChatContent />
    </Provider>
  );
}
