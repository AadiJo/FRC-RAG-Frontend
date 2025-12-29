/**
 * Delete User Document API Route
 * Deletes document from backend vector store and updates Convex status
 */

import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  BackendDeleteRequest,
  BackendDeleteResponse,
} from "@/lib/types/drive";

// Backend configuration
const RAG_BACKEND_URL =
  process.env.NEXT_PUBLIC_RAG_BACKEND_URL ?? process.env.RAG_BACKEND_URL ?? "";
const RAG_API_KEY = process.env.RAG_API_KEY ?? "";

export async function DELETE(req: Request): Promise<Response> {
  try {
    // Authenticate user
    const token = await convexAuthNextjsToken();
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
    const body = await req.json();
    const { documentId } = body as { documentId: Id<"user_documents"> };

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_REQUEST", message: "documentId is required" },
        },
        { status: 400 }
      );
    }

    // Get the document to find its docId
    const document = await fetchQuery(
      api.user_documents.getUserDocument,
      { documentId },
      { token }
    );

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Document not found" },
        },
        { status: 404 }
      );
    }

    // Delete from backend vector store
    if (RAG_BACKEND_URL && document.status === "indexed") {
      console.log(`[Delete] Deleting from backend: ${document.docId}`);

      const backendRequest: BackendDeleteRequest = {
        user_id: userId,
        doc_ids: [document.docId],
      };

      try {
        const response = await fetch(
          `${RAG_BACKEND_URL}/api/v1/user-documents/delete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(RAG_API_KEY ? { "X-API-Key": RAG_API_KEY } : {}),
            },
            body: JSON.stringify(backendRequest),
          }
        );

        if (response.ok) {
          const data: BackendDeleteResponse = await response.json();
          console.log(
            `[Delete] Backend deleted: ${data.deleted?.length ?? 0} documents`
          );
        } else {
          console.error(`[Delete] Backend delete failed: ${response.status}`);
          // Continue with Convex deletion even if backend fails
        }
      } catch (err) {
        console.error("[Delete] Backend request error:", err);
        // Continue with Convex deletion even if backend fails
      }
    }

    // Mark as deleted in Convex
    const result = await fetchMutation(
      api.user_documents.deleteUserDocument,
      { documentId },
      { token }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DELETE_FAILED",
            message: "Failed to delete document",
          },
        },
        { status: 500 }
      );
    }

    console.log(`[Delete] Successfully deleted document: ${document.docId}`);

    return NextResponse.json({
      success: true,
      docId: document.docId,
    });
  } catch (err) {
    console.error("[Delete] Unhandled error:", err);
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
