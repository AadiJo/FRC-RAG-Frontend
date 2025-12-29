import type { UIMessage as MessageType } from "@ai-sdk/react";
import type { Infer } from "convex/values";
import React, { useCallback, useState } from "react";
import type { Message as MessageSchema } from "@/convex/schema/message";
import type { RAGImage } from "@/lib/rag";
import { MessageAssistant } from "./message-assistant";
import { MessageUser } from "./message-user";

type RAGDataPart = {
  type: "data-rag";
  data: {
    imageMap: RAGImage[];
    relatedImages: RAGImage[];
    imagesSkipped: boolean | number;
  };
};

const extractRagDataFromParts = (
  parts: MessageType["parts"] | undefined
): {
  imageMap: RAGImage[];
  relatedImages: RAGImage[];
  imagesSkipped: number;
} | null => {
  if (!parts) {
    return null;
  }

  for (const part of parts) {
    if (
      typeof part === "object" &&
      part !== null &&
      "type" in part &&
      part.type === "data-rag" &&
      "data" in part
    ) {
      const maybe = part as RAGDataPart;
      const data = maybe.data;

      const imageMap = Array.isArray(data.imageMap) ? data.imageMap : [];
      const relatedImages = Array.isArray(data.relatedImages)
        ? data.relatedImages
        : [];
      // Accept boolean values and legacy numeric values (>0 === true)
      let imagesSkipped = 0;
      if (typeof data.imagesSkipped === "boolean") {
        imagesSkipped = data.imagesSkipped ? 1 : 0;
      } else if (
        typeof data.imagesSkipped === "number" &&
        Number.isFinite(data.imagesSkipped)
      ) {
        imagesSkipped = Math.max(0, data.imagesSkipped);
      }

      return { imageMap, relatedImages, imagesSkipped };
    }
  }

  return null;
};

export type MessageProps = {
  variant: MessageType["role"];
  model?: string;
  id: string;
  isLast?: boolean;
  readOnly?: boolean;
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
  onReload: () => void;
  onBranch: () => void;
  hasScrollAnchor?: boolean;
  parts?: MessageType["parts"];
  status?: "streaming" | "ready" | "submitted" | "error"; // Add status prop
  metadata?: Infer<typeof MessageSchema>["metadata"];
  selectedModel?: string;
  isUserAuthenticated?: boolean;
  hasAnyApiKey?: boolean;
  isReasoningModel?: boolean;
  reasoningEffort?: "low" | "medium" | "high";
  ragImageMap?: RAGImage[];
  ragRelatedImages?: RAGImage[];
  ragImagesSkipped?: number;
};

function MessageComponent({
  variant,
  model,
  id,
  isLast,
  readOnly,
  onDelete,
  onEdit,
  onReload,
  onBranch,
  hasScrollAnchor,
  parts,
  status, // Receive status prop
  metadata,
  selectedModel,
  isUserAuthenticated = false,
  hasAnyApiKey = false,
  isReasoningModel = false,
  reasoningEffort = "medium",
  ragImageMap = [],
  ragRelatedImages = [],
  ragImagesSkipped = 0,
}: MessageProps) {
  const [copied, setCopied] = useState(false);

  const ragFromParts = extractRagDataFromParts(parts);
  const effectiveRagImageMap =
    ragImageMap.length > 0 ? ragImageMap : (ragFromParts?.imageMap ?? []);
  const effectiveRagRelatedImages =
    ragRelatedImages.length > 0
      ? ragRelatedImages
      : (ragFromParts?.relatedImages ?? []);
  const effectiveRagImagesSkipped =
    ragImagesSkipped > 0
      ? ragImagesSkipped
      : (ragFromParts?.imagesSkipped ?? 0);

  const copyToClipboard = useCallback(() => {
    // Extract text content from parts for copying
    const textContent =
      parts
        ?.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("") || "";
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 500);
  }, [parts]);

  if (variant === "user") {
    return (
      <MessageUser
        copied={copied}
        copyToClipboard={copyToClipboard}
        editFiles={[]}
        hasAnyApiKey={hasAnyApiKey}
        hasScrollAnchor={hasScrollAnchor}
        id={id}
        isReasoningModel={isReasoningModel}
        isSearchEnabled={metadata?.includeSearch ?? false}
        isUserAuthenticated={isUserAuthenticated}
        onDelete={onDelete}
        onEdit={onEdit}
        parts={parts}
        readOnly={readOnly}
        reasoningEffort={reasoningEffort}
        selectedModel={model || selectedModel || ""}
        status={status}
      />
    );
  }

  if (variant === "assistant") {
    return (
      <MessageAssistant
        copied={copied}
        copyToClipboard={copyToClipboard}
        hasScrollAnchor={hasScrollAnchor}
        id={id}
        isLast={isLast}
        metadata={metadata}
        model={model}
        onBranch={onBranch}
        onReload={onReload}
        parts={parts}
        ragImageMap={effectiveRagImageMap}
        ragImagesSkipped={effectiveRagImagesSkipped > 0}
        ragRelatedImages={effectiveRagRelatedImages}
        readOnly={readOnly}
        status={status}
      />
    );
  }

  return null;
}

// Custom comparator to ignore handler prop changes
const equalMessage = (a: MessageProps, b: MessageProps) =>
  a.id === b.id &&
  a.variant === b.variant &&
  a.isLast === b.isLast &&
  a.hasScrollAnchor === b.hasScrollAnchor &&
  a.model === b.model &&
  a.readOnly === b.readOnly &&
  a.status === b.status &&
  a.metadata === b.metadata &&
  a.selectedModel === b.selectedModel &&
  a.isUserAuthenticated === b.isUserAuthenticated &&
  a.isReasoningModel === b.isReasoningModel &&
  a.reasoningEffort === b.reasoningEffort &&
  a.parts === b.parts &&
  a.onDelete === b.onDelete &&
  a.onEdit === b.onEdit &&
  a.ragImageMap === b.ragImageMap &&
  a.ragRelatedImages === b.ragRelatedImages &&
  a.ragImagesSkipped === b.ragImagesSkipped;
// Intentionally ignore: onReload, onBranch (their identities change but logic doesn't)

export const Message = React.memo(MessageComponent, equalMessage);
Message.displayName = "Message";
