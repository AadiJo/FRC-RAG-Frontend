/**
 * Google Drive Integration Types
 * Types for Drive OAuth, Picker, and document ingestion
 */

// ============================================================================
// Google Identity Services Types
// ============================================================================

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
};

export type TokenClient = {
  requestAccessToken: (config?: { prompt?: string }) => void;
  callback?: (response: TokenResponse) => void;
};

// ============================================================================
// Google Drive Picker Types
// ============================================================================

export type DrivePickerDocument = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
  iconUrl?: string;
  url?: string;
};

export type DrivePickerResponse = {
  action: "picked" | "cancel";
  docs?: DrivePickerDocument[];
};

// ============================================================================
// Document Ingestion Types
// ============================================================================

export type IngestDocumentRequest = {
  driveFileId: string;
  fileName: string;
  mimeType: string;
  accessToken: string;
  sizeBytes?: number;
  modifiedTime?: string;
};

export type IngestDocumentResponse = {
  success: boolean;
  documentId?: string;
  docId?: string;
  chunkCount?: number;
  pageCount?: number;
  error?: {
    code: string;
    message: string;
  };
};

// ============================================================================
// Backend API Types (User Vector Store)
// ============================================================================

export type BackendUpsertRequest = {
  user_id: string;
  documents: Array<{
    doc_id: string;
    title: string | null;
    text: string;
    source: {
      type: "manual" | "upload" | "gdrive" | "other";
      uri: string | null;
    };
    metadata?: {
      tags?: string[];
      created_at?: string;
      page_count?: number;
      drive_file_id?: string;
    };
  }>;
  chunking?: {
    strategy: "recursive" | "fixed";
    chunk_size: number;
    chunk_overlap: number;
  };
};

export type BackendUpsertResponse = {
  user_id: string;
  upserted: Array<{
    doc_id: string;
    chunks_created: number;
    bytes_indexed: number;
  }>;
  failed: Array<{
    doc_id: string;
    error: {
      code: string;
      message: string;
    };
  }>;
};

export type BackendDeleteRequest = {
  user_id: string;
  doc_ids: string[];
};

export type BackendDeleteResponse = {
  user_id: string;
  deleted: string[];
  not_found: string[];
};

export type BackendSearchRequest = {
  user_id: string;
  query: string;
  k?: number;
};

export type BackendSearchResponse = {
  user_id: string;
  query_id: string;
  matches: Array<{
    doc_id: string;
    chunk_id: string;
    score: number;
    title: string | null;
    excerpt: string;
  }>;
};

// ============================================================================
// Fused RAG Context Types (Extended from existing RAG types)
// ============================================================================

export type FusedCitation = {
  id: string;
  marker: number;
  source_type: "frc_corpus" | "user_doc";
  doc_id: string;
  chunk_id: string;
  title: string | null;
  source: string | null;
  uri: string | null;
  team: string | null;
  year: string | null;
  page: number | null;
  score: {
    frc_dense_rank: number | null;
    frc_lexical_rank: number | null;
    user_dense_rank: number | null;
    rrf_score: number;
    rerank_score: number | null;
  };
  excerpt: string;
  text_range?: {
    start: number;
    end: number;
  };
};

export type FusedRAGContextResponse = {
  query_id: string;
  user_id: string;
  context: string;
  total_chunks: number;
  citations: FusedCitation[];
  images: Array<{
    image_id: string;
    url: string;
    caption: string | null;
  }>;
  image_map: Record<
    string,
    {
      image_id: string;
      url: string;
      caption: string | null;
    }
  >;
  images_skipped: boolean;
  timings_ms?: {
    frc_dense: number;
    frc_lexical: number;
    user_dense: number;
    fusion: number;
    rerank: number;
    format: number;
    total: number;
  };
  backend?: {
    version: string;
    deployment_id: string | null;
  };
};

// ============================================================================
// Error Types
// ============================================================================

export type BackendError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    request_id?: string;
    retryable: boolean;
  };
};

export type DriveErrorCode =
  | "DRIVE_NOT_CONNECTED"
  | "DRIVE_TOKEN_EXPIRED"
  | "DRIVE_ACCESS_DENIED"
  | "DRIVE_FILE_NOT_FOUND"
  | "DRIVE_DOWNLOAD_FAILED"
  | "PDF_EXTRACTION_FAILED"
  | "PDF_NO_TEXT"
  | "PDF_TOO_LARGE"
  | "INGESTION_FAILED"
  | "BACKEND_UNAVAILABLE";
