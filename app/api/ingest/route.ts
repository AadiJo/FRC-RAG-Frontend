/**
 * PDF Ingestion API Route
 * Downloads PDF from Google Drive, extracts text, sends to backend for indexing
 */

import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import type {
  BackendUpsertRequest,
  BackendUpsertResponse,
  IngestDocumentRequest,
  IngestDocumentResponse,
} from "@/lib/types/drive";

// Maximum PDF size (10 MB)
const MAX_PDF_SIZE = 10 * 1024 * 1024;

// Backend configuration
const RAG_BACKEND_URL =
  process.env.NEXT_PUBLIC_RAG_BACKEND_URL ?? process.env.RAG_BACKEND_URL ?? "";
const RAG_API_KEY = process.env.RAG_API_KEY ?? "";

export async function POST(req: Request): Promise<Response> {
  try {
    // Log incoming request metadata
    try {
      // incoming request metadata (debug logging removed)
    } catch (e) {
      // ignore
    }
    // Authenticate user
    const token = await convexAuthNextjsToken();
    // auth token presence checked
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    // Get user ID for backend
    const userId = await fetchQuery(
      api.user_documents.getUserIdForBackend,
      {},
      { token }
    );
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "User not found" },
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body: IngestDocumentRequest = await req.json();
    // Log size of parsed body roughly
    try {
      // parsed body size logging removed
    } catch {}
    const {
      driveFileId,
      fileName,
      mimeType,
      accessToken,
      sizeBytes,
      modifiedTime,
    } = body;

    // Log request details (mask access token)
    const maskedAccessToken = accessToken
      ? `${accessToken.slice(0, 6)}...${accessToken.slice(-6)} (len=${accessToken.length})`
      : null;
    // request body parsed (sensitive fields masked, logging removed)

    // Validate request
    if (!(driveFileId && fileName && accessToken)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Missing required fields",
          },
        },
        { status: 400 }
      );
    }

    if (mimeType !== "application/pdf") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_FILE_TYPE",
            message: "Only PDF files are supported",
          },
        },
        { status: 400 }
      );
    }

    if (sizeBytes && sizeBytes > MAX_PDF_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PDF_TOO_LARGE",
            message: `PDF exceeds maximum size of ${MAX_PDF_SIZE / 1024 / 1024} MB`,
          },
        },
        { status: 400 }
      );
    }

    // Create document record in Convex (or get existing one)
    const { documentId, docId } = await fetchMutation(
      api.user_documents.createUserDocument,
      {
        title: fileName,
        sourceType: "gdrive",
        sourceUri: `https://drive.google.com/file/d/${driveFileId}`,
        driveFileId,
        driveMimeType: mimeType,
        driveModifiedTime: modifiedTime,
        sizeBytes,
      },
      { token }
    );

    // Update status to processing
    await fetchMutation(
      api.user_documents.updateDocumentStatus,
      { documentId, status: "processing" },
      { token }
    );

    try {
      // Download PDF from Google Drive
      // Downloading PDF from Drive (logging removed)
      const driveResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // drive response status logging removed

      if (!driveResponse.ok) {
        const errorText = await driveResponse
          .text()
          .catch(() => "Unknown error");
        console.error(
          `[Ingest] Drive download failed: ${driveResponse.status} - ${errorText}`
        );

        await fetchMutation(
          api.user_documents.updateDocumentStatus,
          {
            documentId,
            status: "failed",
            errorCode: "DRIVE_DOWNLOAD_FAILED",
            errorMessage: `Failed to download from Drive: ${driveResponse.status}`,
          },
          { token }
        );

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DRIVE_DOWNLOAD_FAILED",
              message: "Failed to download file from Google Drive",
            },
          },
          { status: 502 }
        );
      }

      const pdfBytes = await driveResponse.arrayBuffer();
      // downloaded bytes (logging removed)

      // Extract text from PDF
      // extracting text (logging removed)
      const { text, pageCount } = await extractTextFromPDF(
        new Uint8Array(pdfBytes)
      );

      if (!text || text.trim().length === 0) {
        await fetchMutation(
          api.user_documents.updateDocumentStatus,
          {
            documentId,
            status: "failed",
            errorCode: "PDF_NO_TEXT",
            errorMessage:
              "No extractable text found in PDF. The document may be scanned or image-based.",
          },
          { token }
        );

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PDF_NO_TEXT",
              message:
                "No extractable text found. OCR is not currently supported.",
            },
          },
          { status: 422 }
        );
      }

      // extracted text (logging removed)

      // Send to backend for indexing
      // sending to backend (logging removed)
      const backendResponse = await sendToBackend(
        userId,
        docId,
        fileName,
        text,
        driveFileId
      );

      if (!backendResponse.success) {
        await fetchMutation(
          api.user_documents.updateDocumentStatus,
          {
            documentId,
            status: "failed",
            errorCode: "INGESTION_FAILED",
            errorMessage: backendResponse.error ?? "Backend indexing failed",
          },
          { token }
        );

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INGESTION_FAILED",
              message: backendResponse.error ?? "Failed to index document",
            },
          },
          { status: 502 }
        );
      }

      // Update status to indexed
      await fetchMutation(
        api.user_documents.updateDocumentStatus,
        {
          documentId,
          status: "indexed",
          chunkCount: backendResponse.chunkCount,
          pageCount,
        },
        { token }
      );

      // successfully indexed (logging removed)

      const response: IngestDocumentResponse = {
        success: true,
        documentId: documentId as string,
        docId,
        chunkCount: backendResponse.chunkCount,
        pageCount,
      };

      return NextResponse.json(response);
    } catch (err) {
      console.error("[Ingest] Error during ingestion:", err);

      await fetchMutation(
        api.user_documents.updateDocumentStatus,
        {
          documentId,
          status: "failed",
          errorCode: "INGESTION_FAILED",
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        },
        { token }
      );

      throw err;
    }
  } catch (err) {
    console.error("[Ingest] Unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Extract text from PDF using pdf-parse or similar
 * Returns the extracted text and page count
 */
async function extractTextFromPDF(
  pdfData: Uint8Array
): Promise<{ text: string; pageCount: number }> {
  try {
    // In Node.js environments pdfjs may rely on DOM classes (DOMMatrix, ImageData, Path2D).
    // Try to polyfill those from the optional `@napi-rs/canvas` package so server
    // side text extraction works without a browser-like DOM.
    try {
      if (!globalThis.DOMMatrix) {
        let canvasModule: any = undefined;
        try {
          // Use createRequire to load CommonJS packages from ESM code.
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { createRequire } = await import("module");
          const require = createRequire(import.meta.url);
          try {
            canvasModule = require("@napi-rs/canvas");
          } catch (e) {
            // optional dependency not installed
          }
        } catch (e) {
          // ignore createRequire failures
        }

        if (canvasModule?.DOMMatrix) {
          (globalThis as any).DOMMatrix = canvasModule.DOMMatrix;
          if (canvasModule.ImageData) (globalThis as any).ImageData = canvasModule.ImageData;
          if (canvasModule.Path2D) (globalThis as any).Path2D = canvasModule.Path2D;
        } else {
          console.warn(
            "[Ingest] DOMMatrix polyfill not available. Install @napi-rs/canvas on the server to enable PDF rendering in Node.js."
          );
        }
      }
    } catch (e) {
      console.warn("[Ingest] DOMMatrix polyfill attempt failed:", e);
    }
    // Use pdfjs-dist directly in a Node-friendly way to avoid worker bundling issues
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // Attempt to preload the worker module so PDFJS doesn't try to dynamic-import
    // a worker path that Next/Turbopack doesn't emit into the server chunks.
    try {
      // Importing the worker directly from the package and attach it so pdfjs
      // can reuse it instead of attempting a dynamic import.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
      // Attach to global so pdfjs checks it first (used by some builds).
      (globalThis as any).pdfjsPreloadedWorker = worker;
    } catch (e) {
      // pdf.worker preload failed (logging removed)
    }

    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages ?? 0;

    let text = "";
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((it: any) => (it.str ? it.str : ""))
          .join(" ");
        text += pageText + "\n\n";
      } catch (pageErr) {
        // failed to extract text from page (logging removed)
      }
    }

    try {
      // Some pdfjs builds expose a destroy on the document
      await (pdfDoc as any).destroy?.();
    } catch {}

    return { text: text.trim(), pageCount: numPages };
  } catch (err) {
    console.error("[Ingest] PDF extraction error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    // If DOMMatrix caused the failure, include an actionable hint.
    const hint = msg.includes("DOMMatrix")
      ? " (server is missing a DOMMatrix polyfill — install @napi-rs/canvas)"
      : "";
    throw new Error(`Failed to extract text from PDF: ${msg}${hint}`);
  }
}

/**
 * Send extracted text to backend for indexing
 */
async function sendToBackend(
  userId: string,
  docId: string,
  title: string,
  text: string,
  driveFileId: string
): Promise<{ success: boolean; chunkCount?: number; error?: string }> {
  if (!RAG_BACKEND_URL) {
    console.error("[Ingest] RAG_BACKEND_URL not configured");
    return { success: false, error: "Backend not configured" };
  }

  console.debug("[Ingest] sendToBackend configured", {
    backendHost: (() => {
      try {
        return new URL(RAG_BACKEND_URL).host;
      } catch {
        return "<invalid-url>";
      }
    })(),
    hasApiKey: !!RAG_API_KEY,
    textChars: text.length,
  });

  const request: BackendUpsertRequest = {
    user_id: userId,
    documents: [
      {
        doc_id: docId,
        title,
        text,
        source: {
          type: "gdrive",
          uri: `https://drive.google.com/file/d/${driveFileId}`,
        },
        metadata: {
          drive_file_id: driveFileId,
          created_at: new Date().toISOString(),
        },
      },
    ],
    chunking: {
      strategy: "recursive",
      chunk_size: 900,
      chunk_overlap: 150,
    },
  };

  try {
    const response = await fetch(
      `${RAG_BACKEND_URL}/api/v1/user-documents/upsert`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(RAG_API_KEY ? { "X-API-Key": RAG_API_KEY } : {}),
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `[Ingest] Backend upsert failed: ${response.status} - ${errorText}`
      );
      return { success: false, error: `Backend error: ${response.status}` };
    }

    const data: BackendUpsertResponse = await response.json();

    if (data.failed?.length > 0) {
      const failedDoc = data.failed[0];
      return {
        success: false,
        error: failedDoc?.error?.message ?? "Indexing failed",
      };
    }

    const upserted = data.upserted?.[0];
    return {
      success: true,
      chunkCount: upserted?.chunks_created ?? 0,
    };
  } catch (err) {
    console.error("[Ingest] Backend request error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
