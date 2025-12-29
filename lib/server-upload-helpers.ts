/**
 * Server-side Upload Helpers
 *
 * TODO: R2 file uploads have been disabled for now.
 * This file contains stub implementations to maintain API compatibility.
 * When migrating to VPS storage, implement actual upload logic here.
 *
 * Original implementation used:
 * - fetchAction, fetchMutation from "convex/nextjs"
 * - api.files.generateUploadUrl, api.files.syncMetadata, api.files.saveFileAttachment
 * - Cloudflare R2 PUT requests
 */

import type { Id } from "@/convex/_generated/dataModel";

/**
 * Stub: Server-side upload to storage
 * TODO: Replace with VPS upload logic
 */
export function uploadBlobToR2(
  _blob: Blob,
  _options: {
    chatId: Id<"chats">;
    fileName?: string;
    token: string;
    isGenerated?: boolean;
  }
): Promise<{
  key: string;
  url?: string;
  fileName: string;
}> {
  // File uploads are currently disabled
  return Promise.reject(
    new Error(
      "FILE_UPLOADS_DISABLED: R2 storage has been removed. VPS storage not yet implemented."
    )
  );
}
