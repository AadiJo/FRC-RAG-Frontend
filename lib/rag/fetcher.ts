/**
 * RAG Context Fetcher
 * Fetches context from the FRC RAG backend
 * Supports both global corpus retrieval and user document retrieval with fusion
 */

import type { RAGContextResponse, RAGImage } from "./types";

function decodeBase64ToUtf8(encoded: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(encoded, "base64").toString("utf-8");
  }

  // Browser/edge runtime fallback
  const binary = globalThis.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

/**
 * Fetch RAG context from the backend
 * Now supports user_id for fused retrieval (global corpus + user documents)
 * @param query - The user's query
 * @param options - Optional parameters including user_id for personalized retrieval
 * @returns RAG context response or null on failure
 */
export async function fetchRAGContext(
  query: string,
  options?: {
    k?: number;
    team?: string;
    year?: string;
    timeout?: number;
    signal?: AbortSignal;
    userId?: string; // Convex user ID for fused retrieval
  }
): Promise<RAGContextResponse | null> {
  // Use NEXT_PUBLIC_ env var for consistency across server/client
  // Also check the non-public version for server-only contexts
  const ragBackendUrl =
    process.env.NEXT_PUBLIC_RAG_BACKEND_URL || process.env.RAG_BACKEND_URL;
  const ragApiKey = process.env.RAG_API_KEY;

  if (!ragBackendUrl) {
    console.log(
      "[RAG] Neither NEXT_PUBLIC_RAG_BACKEND_URL nor RAG_BACKEND_URL configured, skipping RAG retrieval"
    );
    return null;
  }

  try {
    // Use fused endpoint if user_id is provided, otherwise use standard context endpoint
    const endpoint = options?.userId
      ? `${ragBackendUrl}/api/v1/rag/context_fused`
      : `${ragBackendUrl}/api/v1/context`;

    console.log(
      `[RAG] Fetching context from: ${endpoint}${options?.userId ? " (with user docs)" : ""}`
    );

    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (options?.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener("abort", onAbort, { once: true });
      }
    }

    const timeoutId = setTimeout(
      () => controller.abort(),
      options?.timeout ?? 10_000
    );

    // Build request body based on endpoint
    const requestBody = options?.userId
      ? {
          user_id: options.userId,
          query,
          retrieval: {
            frc_dense_k: 50,
            user_dense_k: 50,
            rrf_k: 60,
            fuse_top_k: 100,
            rerank_top_k: 50,
            final_k: options?.k ?? 15,
          },
          options: {
            include_images: true,
            max_context_chars: 12_000,
          },
          ...(options?.team ? { filters: { team: options.team } } : {}),
          ...(options?.year ? { filters: { year: options.year } } : {}),
        }
      : {
          query,
          k: options?.k ?? 15,
          ...(options?.team ? { team: options.team } : {}),
          ...(options?.year ? { year: options.year } : {}),
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ragApiKey ? { "X-API-Key": ragApiKey } : {}),
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (options?.signal) {
      options.signal.removeEventListener("abort", onAbort);
    }

    if (!response.ok) {
      console.error(`[RAG] Backend returned status ${response.status}`);
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`[RAG] Error: ${errorText}`);
      return null;
    }

    const data = (await response.json()) as RAGContextResponse;

    // Log stats
    if (data.total_chunks) {
      console.log(`[RAG] Retrieved ${data.total_chunks} chunks`);
    }
    if (data.images?.length) {
      console.log(`[RAG] Retrieved ${data.images.length} related images`);
    }
    if (data.image_map && Object.keys(data.image_map).length > 0) {
      console.log(
        `[RAG] ${Object.keys(data.image_map).length} inline image placeholders`
      );
    }

    // Resolve relative image URLs to absolute
    if (data.image_map && Object.keys(data.image_map).length > 0) {
      const cleanBase = ragBackendUrl.endsWith("/")
        ? ragBackendUrl.slice(0, -1)
        : ragBackendUrl;

      for (const key of Object.keys(data.image_map)) {
        const img = data.image_map[key];
        if (img?.url && !img.url.startsWith("http")) {
          const cleanPath = img.url.startsWith("/") ? img.url : `/${img.url}`;
          img.url = `${cleanBase}${cleanPath}`;
        }
      }
    }

    // Also resolve related images
    if (data.images?.length > 0) {
      const cleanBase = ragBackendUrl.endsWith("/")
        ? ragBackendUrl.slice(0, -1)
        : ragBackendUrl;

      for (const img of data.images) {
        if (img?.url && !img.url.startsWith("http")) {
          const cleanPath = img.url.startsWith("/") ? img.url : `/${img.url}`;
          img.url = `${cleanBase}${cleanPath}`;
        }
      }
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      if (options?.signal?.aborted) {
        console.error("[RAG] Request aborted by client");
      } else {
        console.error("[RAG] Request timed out");
      }
    } else {
      console.error("[RAG] Failed to fetch context:", error);
    }
    return null;
  }
}

/**
 * Extract image map from RAG context for streaming headers
 * @param ragContext - The RAG context response
 * @returns Base64-encoded JSON string of image map
 */
export function encodeRAGImagesForHeader(
  ragContext: RAGContextResponse | null
): string | null {
  if (
    !ragContext?.image_map ||
    Object.keys(ragContext.image_map).length === 0
  ) {
    return null;
  }

  try {
    const json = JSON.stringify(ragContext.image_map);
    return Buffer.from(json).toString("base64");
  } catch {
    return null;
  }
}

/**
 * Extract related images from RAG context for streaming headers
 * @param ragContext - The RAG context response
 * @returns Base64-encoded JSON string of related images
 */
export function encodeRelatedImagesForHeader(
  ragContext: RAGContextResponse | null
): string | null {
  if (!ragContext?.images || ragContext.images.length === 0) {
    return null;
  }

  try {
    const json = JSON.stringify(ragContext.images);
    return Buffer.from(json).toString("base64");
  } catch {
    return null;
  }
}

/**
 * Decode RAG images from header
 * @param encoded - Base64-encoded JSON string
 * @returns Decoded image map or null
 */
export function decodeRAGImagesFromHeader(
  encoded: string | null
): Record<string, RAGImage> | null {
  if (!encoded) {
    return null;
  }

  try {
    const json = decodeBase64ToUtf8(encoded);
    return JSON.parse(json) as Record<string, RAGImage>;
  } catch {
    return null;
  }
}

/**
 * Decode related images from header
 * @param encoded - Base64-encoded JSON string
 * @returns Decoded images array or null
 */
export function decodeRelatedImagesFromHeader(
  encoded: string | null
): RAGImage[] | null {
  if (!encoded) {
    return null;
  }

  try {
    const json = decodeBase64ToUtf8(encoded);
    return JSON.parse(json) as RAGImage[];
  } catch {
    return null;
  }
}
