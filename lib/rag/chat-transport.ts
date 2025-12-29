import {
  decodeRAGImagesFromHeader,
  decodeRelatedImagesFromHeader,
  type RAGImage,
} from "@/lib/rag";

export type RAGHeaders = {
  imageMap: RAGImage[];
  relatedImages: RAGImage[];
  imagesSkipped: boolean;
};

type RAGHeadersCallback = (messageId: string, headers: RAGHeaders) => void;

/**
 * Create a fetch wrapper that extracts RAG headers
 */
export function createRAGFetch(
  onRAGHeaders: RAGHeadersCallback,
  getMessageId: () => string | undefined
): typeof fetch {
  return async function ragFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const response = await fetch(input, init);

    // Check for RAG headers
    const ragImagesHeader = response.headers.get("X-RAG-Images");
    const ragRelatedHeader = response.headers.get("X-RAG-Related-Images");
    const ragSkippedHeader = response.headers.get("X-RAG-Images-Skipped");

    const messageId = getMessageId();

    if (messageId && (ragImagesHeader || ragRelatedHeader)) {
      const rawImageMap = ragImagesHeader
        ? decodeRAGImagesFromHeader(ragImagesHeader)
        : null;
      const relatedImages = ragRelatedHeader
        ? decodeRelatedImagesFromHeader(ragRelatedHeader)
        : null;
      const imagesSkipped = ragSkippedHeader
        ? ragSkippedHeader === "1" || ragSkippedHeader.toLowerCase() === "true"
        : false;

      // Convert Record<string, RAGImage> to RAGImage[] while preserving the
      // placeholder id (the record key) as `image_id`.
      // This is critical because the model outputs markers like [img:<key>].
      // Strip the [img:...] wrapper if present so IDs are bare (e.g., "2910_2025_p4_i0_caeef762")
      const imageMap: RAGImage[] = rawImageMap
        ? Object.entries(rawImageMap).map(([key, image]) => {
            // Strip [img:...] wrapper if present
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

      onRAGHeaders(messageId, {
        imageMap,
        relatedImages: relatedImages ?? [],
        imagesSkipped,
      });
    }

    return response;
  };
}

/**
 * Hook to use RAG-aware fetch in chat components
 */
export function useRAGFetch(
  onRAGHeaders: RAGHeadersCallback,
  messageIdRef: React.MutableRefObject<string | undefined>
) {
  return createRAGFetch(onRAGHeaders, () => messageIdRef.current);
}
