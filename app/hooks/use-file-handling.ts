/**
 * File Handling Hook
 *
 * TODO: R2 file uploads have been disabled for now.
 * This hook returns stubs/disabled state to maintain API compatibility.
 * When migrating to VPS storage, implement actual upload logic here.
 *
 * Original implementation used:
 * - @convex-dev/r2/react useUploadFile hook
 * - uploadFilesInParallel from file-upload-utils
 */

import type { FileUIPart } from "ai";
import { useCallback, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import type { FileAttachment } from "@/lib/file-upload-utils";

// TODO: When re-enabling file uploads, uncomment:
// import { useUploadFile } from "@convex-dev/r2/react";
// import { useAction } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { createOptimisticAttachments, uploadFilesInParallel } from "@/lib/file-upload-utils";

export function useFileHandling() {
  // File uploads are disabled - always empty
  const [files] = useState<File[]>([]);

  // No-op functions that log warnings
  const addFiles = useCallback((_newFiles: File[]) => {
    console.warn("File uploads are currently disabled");
  }, []);

  const removeFile = useCallback((_file: File) => {
    // No-op - files array is always empty
  }, []);

  const clearFiles = useCallback(() => {
    // No-op - files array is always empty
  }, []);

  const processFiles = useCallback(
    (_chatId: Id<"chats">): Promise<FileUIPart[]> => {
      // File uploads are disabled - always return empty array
      return Promise.resolve([]);
    },
    []
  );

  const createOptimisticFiles = useCallback(() => [], []);

  // Stub functions with proper type signatures for API compatibility
  const uploadFile = (_file: File): Promise<string> =>
    Promise.reject(new Error("File uploads are currently disabled"));

  const saveFileAttachment = (_attachment: {
    chatId: Id<"chats">;
    key: string;
    fileName: string;
  }): Promise<FileAttachment> =>
    Promise.reject(new Error("File uploads are currently disabled"));

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    processFiles,
    createOptimisticFiles,
    hasFiles: false, // Always false - uploads disabled
    uploadFile,
    saveFileAttachment,
  };
}
