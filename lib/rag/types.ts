/**
 * RAG (Retrieval-Augmented Generation) Types
 * Types for FRC RAG backend integration
 */

/**
 * RAG Image returned from the backend
 */
export type RAGImage = {
  image_id: string;
  url: string;
  caption?: string;
};

/**
 * RAG Context response from /api/v1/context endpoint
 */
export type RAGContextResponse = {
  /** Pre-formatted context with [1], [2] citation markers and [img:ID] placeholders */
  context: string;
  /** Citation metadata */
  citations: RAGCitation[];
  /** Related images from vector search */
  images: RAGImage[];
  /** Map of placeholder markers to image details */
  image_map: Record<string, RAGImage>;
  /** Query identifier */
  query_id: string;
  /** Total chunks retrieved */
  total_chunks: number;
  /** Whether images were intentionally skipped */
  images_skipped?: boolean;
};

/**
 * Citation metadata from RAG context
 */
export type RAGCitation = {
  id: string;
  team?: string;
  year?: string;
  page?: number;
  binder?: string;
  source?: string;
};

/**
 * Game piece mapping for FRC terminology
 */
export type GamePiece = {
  name: string;
  aliases: string[];
  year: number;
  properties?: {
    dimensions?: string;
    weight?: string;
    material?: string;
  };
};

/**
 * RAG query request
 */
export type RAGQueryRequest = {
  query: string;
  k?: number;
  team?: string;
  year?: string;
};

/**
 * Enhanced message with RAG data
 */
export type RAGMessageExtras = {
  ragImages?: RAGImage[];
  ragImageMap?: Record<string, RAGImage>;
};
