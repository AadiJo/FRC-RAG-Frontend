import type { UIMessage } from "@ai-sdk/react";
import { useChatMessages, useChatStatus } from "@ai-sdk-tools/store";
import type { Infer } from "convex/values";
import React, { useRef } from "react";
import { ChatContainer } from "@/components/prompt-kit/chat-container";
import { ImageSkeleton } from "@/components/prompt-kit/image-skeleton";
import { Loader } from "@/components/prompt-kit/loader";
import type { Message as MessageSchema } from "@/convex/schema/message";
import { MODELS_MAP } from "@/lib/config";
import type { RAGImage } from "@/lib/rag";
import { Message } from "./message";

export type MessageWithExtras = UIMessage & {
  model?: string;
  metadata?: Infer<typeof MessageSchema>["metadata"];
};

type ConversationProps = {
  onDelete: (id: string) => void;
  onEdit: (
    id: string,
    newText: string,
    options: {
      model: string;
      enableSearch: boolean;
      files: File[];
      reasoningEffort: "low" | "medium" | "high";
      removedFileUrls?: string[];
    }
  ) => void;
  onReload: (id: string) => void;
  onBranch: (messageId: string) => void;
  autoScroll?: boolean;
  selectedModel?: string;
  isUserAuthenticated?: boolean;
  hasAnyApiKey?: boolean;
  isReasoningModel?: boolean;
  reasoningEffort?: "low" | "medium" | "high";
  containerRef?: React.RefObject<HTMLDivElement | null>;
  scrollToRef?: React.RefObject<HTMLDivElement | null>;
  ragImagesByMessage?: Record<
    string,
    { imageMap: RAGImage[]; relatedImages: RAGImage[]; skipped: number }
  >;
};

const Conversation = React.memo(
  ({
    onDelete,
    onEdit,
    onReload,
    onBranch,
    autoScroll = true,
    selectedModel,
    isUserAuthenticated = false,
    hasAnyApiKey = false,
    isReasoningModel = false,
    reasoningEffort = "medium",
    containerRef: externalContainerRef,
    scrollToRef,
    ragImagesByMessage,
  }: ConversationProps) => {
    const messages = useChatMessages<MessageWithExtras>();
    const status = useChatStatus();
    const initialMessageCount = useRef(messages.length);
    const internalContainerRef = useRef<HTMLDivElement>(null);
    const containerRef = externalContainerRef ?? internalContainerRef;

    // Check if the selected model is an image generation model
    const isImageGenerationModel =
      selectedModel &&
      MODELS_MAP[selectedModel]?.features?.some(
        (feature) => feature.id === "image-generation" && feature.enabled
      );

    if (!messages || messages.length === 0) {
      return <div className="h-full w-full" />;
    }

    // console.log('Rendering messages:', messages);

    return (
      <div className="relative flex h-full w-full flex-col items-center overflow-hidden">
        <ChatContainer
          autoScroll={autoScroll && status === "submitted"}
          className="relative flex min-h-0 w-full flex-1 flex-col items-center pt-20"
          ref={containerRef}
          scrollToRef={scrollToRef}
          style={{
            scrollbarGutter: "stable both-edges",
            paddingBottom:
              "calc(var(--chat-input-height, 168px) + env(safe-area-inset-bottom) + 1rem)",
          }}
        >
          {messages?.map((message, index) => {
            const isLast =
              index === messages.length - 1 && status !== "submitted";
            const hasScrollAnchor = isLast
              ? messages.length > initialMessageCount.current
              : false;
            const messageStatus = isLast ? status : "ready";
            const ragData = ragImagesByMessage?.[message.id];

            return (
              <Message
                hasAnyApiKey={hasAnyApiKey}
                hasScrollAnchor={hasScrollAnchor}
                id={message.id}
                isLast={isLast}
                isReasoningModel={isReasoningModel}
                isUserAuthenticated={isUserAuthenticated}
                key={message.id}
                metadata={message.metadata}
                model={message.model}
                onBranch={() => onBranch(message.id)}
                onDelete={onDelete}
                onEdit={onEdit}
                onReload={() => onReload(message.id)}
                parts={message.parts}
                ragImageMap={ragData?.imageMap}
                ragImagesSkipped={ragData?.skipped}
                ragRelatedImages={ragData?.relatedImages}
                reasoningEffort={reasoningEffort}
                selectedModel={selectedModel}
                status={messageStatus}
                variant={message.role}
              />
            );
          })}
          {(() => {
            const last = messages.at(-1);
            const showSkeleton =
              (status === "submitted" &&
                messages.length > 0 &&
                last?.role === "user") ||
              (status === "streaming" &&
                isImageGenerationModel &&
                messages.length > 0 &&
                (last?.role === "user" ||
                  (last?.role === "assistant" &&
                    !last?.parts?.some((part) => part.type === "file"))));

            return showSkeleton ? (
              <div className="group flex min-h-scroll-anchor w-full max-w-3xl flex-col items-start gap-2 px-6 pb-2">
                {isImageGenerationModel ? (
                  <ImageSkeleton height={300} width={300} />
                ) : (
                  <Loader size="md" variant="dots" />
                )}
              </div>
            ) : null;
          })()}

          {/* Always-reserved bottom padding for related images, never covered by input */}
          <div aria-hidden="true" style={{ height: "90px", width: "100%" }} />
        </ChatContainer>
      </div>
    );
  }
);

export { Conversation };
