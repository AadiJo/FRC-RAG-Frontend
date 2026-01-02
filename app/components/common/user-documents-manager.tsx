"use client";

import {
  Cloud,
  CloudCheck,
  CloudSlash,
  File,
  FilePdf,
  Plus,
  Spinner,
  Trash,
  Warning,
} from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { toast as sonnerToast } from "sonner";
import { useDriveConnection } from "@/app/hooks/use-drive-connection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// UI toasts for upload flows removed
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Type for document from query
type UserDocument = {
  _id: Id<"user_documents">;
  _creationTime: number;
  userId: Id<"users">;
  title: string;
  docId: string;
  sourceType: "gdrive" | "upload" | "manual";
  sourceUri?: string;
  driveFileId?: string;
  driveMimeType?: string;
  driveModifiedTime?: string;
  sizeBytes?: number;
  pageCount?: number;
  chunkCount?: number;
  status: "pending" | "processing" | "indexed" | "failed" | "deleted";
  errorCode?: string;
  errorMessage?: string;
  indexedAt?: number;
  lastSyncedAt?: number;
};

// Separate component for document item to avoid nested ternaries
function DocumentItem({
  doc,
  isDeleting,
  onDelete,
}: {
  doc: UserDocument;
  isDeleting: boolean;
  onDelete: (id: Id<"user_documents">) => void;
}) {
  const getStatusColor = () => {
    switch (doc.status) {
      case "indexed":
        return "text-red-500";
      case "failed":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <FilePdf className={`size-8 ${getStatusColor()}`} weight="fill" />
        <div>
          <p className="font-medium">{doc.title}</p>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            {doc.status === "indexed" && (
              <span className="text-green-600">{doc.chunkCount} chunks</span>
            )}
            {doc.status === "processing" && (
              <span className="flex items-center gap-1 text-amber-600">
                <Spinner className="size-3 animate-spin" />
                Processing...
              </span>
            )}
            {doc.status === "pending" && (
              <span className="text-muted-foreground">Pending</span>
            )}
            {doc.status === "failed" && (
              <span className="flex items-center gap-1 text-destructive">
                <Warning className="size-3" weight="fill" />
                {doc.errorMessage ?? "Failed"}
              </span>
            )}
            {doc.pageCount ? <span>• {doc.pageCount} pages</span> : null}
          </div>
        </div>
      </div>
      <Button
        className="text-muted-foreground hover:text-destructive"
        disabled={isDeleting}
        onClick={() => onDelete(doc._id)}
        size="icon"
        variant="ghost"
      >
        {isDeleting ? (
          <Spinner className="size-4 animate-spin" />
        ) : (
          <Trash className="size-4" />
        )}
      </Button>
    </div>
  );
}

// Separate component for loading state
function DocumentsLoading() {
  return (
    <div className="flex items-center justify-center py-8">
      <Spinner className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// Separate component for empty state
function DocumentsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <File className="mb-2 size-12 text-muted-foreground" weight="thin" />
      <p className="text-muted-foreground">No documents indexed yet</p>
      <p className="text-muted-foreground text-sm">
        Connect Google Drive and add a PDF to get started
      </p>
    </div>
  );
}

// Separate component for documents list
function DocumentsList({
  documents,
  deletingDocId,
  onDelete,
}: {
  documents: UserDocument[];
  deletingDocId: string | null;
  onDelete: (id: Id<"user_documents">) => void;
}) {
  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <DocumentItem
          doc={doc}
          isDeleting={deletingDocId === doc._id}
          key={doc._id}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

/**
 * User Documents Manager
 * Allows users to connect Google Drive, upload PDFs, and manage indexed documents
 */
export function UserDocumentsManager() {
  const {
    isConnected,
    isLoading: isConnectionLoading,
    driveEmail,
    connect,
    disconnect,
    openPicker,
    isPickerReady,
    requestToken,
    getLatestAccessToken,
    error: driveError,
    clearError,
  } = useDriveConnection();

  const documents = useQuery(api.user_documents.listUserDocuments, {});
  const [isIngesting, setIsIngesting] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Handle Drive connection
  const handleConnect = useCallback(async () => {
    try {
      await connect();
      sonnerToast.success("Google Drive connected successfully");
    } catch {
      sonnerToast.error("Failed to connect Google Drive");
    }
  }, [connect]);

  // Handle Drive disconnection
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      sonnerToast.success("Google Drive disconnected");
    } catch {
      sonnerToast.error("Failed to disconnect Google Drive");
    }
  }, [disconnect]);

  // Handle file selection from Drive Picker
  const handleSelectFile = useCallback(async () => {
    if (!isPickerReady) {
      // picker not ready; notifications removed
      return;
    }

    try {
      const docs = await openPicker();
      // openPicker returned; notifications removed
      if (!docs || docs.length === 0) {
        return; // User cancelled
      }

      const selectedDoc = docs[0];
      if (!selectedDoc) {
        return;
      }

      // selectedDoc obtained; notifications removed

      // Ensure there is a valid token for ingestion
      const token = getLatestAccessToken() ?? (await requestToken());
      // token resolution; notifications removed
      if (!token) {
        sonnerToast.error("Failed to obtain access token");
        return;
      }

      setIsIngesting(true);
      // indexing started; notifications removed

      const mimeType = selectedDoc.mimeType ?? "application/pdf";
      // calling /api/ingest

      // Call the ingestion API
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driveFileId: selectedDoc.id,
          fileName: selectedDoc.name,
          mimeType,
          accessToken: token,
          sizeBytes: selectedDoc.sizeBytes,
          modifiedTime: selectedDoc.lastEditedUtc
            ? new Date(selectedDoc.lastEditedUtc).toISOString()
            : undefined,
        }),
      });

      // /api/ingest response received

      const result: unknown = await response.json();

      const isSuccess =
        typeof result === "object" &&
        result !== null &&
        "success" in result &&
        (result as { success: unknown }).success === true;

      // indexing result: notifications removed; log errors via sonner for failures
      if (isSuccess) {
        sonnerToast.success("Document indexed successfully");
      } else {
        const message =
          typeof (result as { error?: { message?: unknown } }).error
            ?.message === "string"
            ? (result as { error: { message: string } }).error.message
            : "Failed to index document";
        sonnerToast.error(message);
      }
    } catch (err) {
      console.error("File selection error:", err);
      sonnerToast.error("Failed to select file from Drive");
    } finally {
      setIsIngesting(false);
    }
  }, [getLatestAccessToken, isPickerReady, openPicker, requestToken]);

  // Handle document deletion
  const handleDelete = useCallback(async (documentId: Id<"user_documents">) => {
    setDeletingDocId(documentId);

    try {
      const response = await fetch("/api/ingest/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId }),
      });

      const result = await response.json();

      if (result.success) {
        sonnerToast.success("Document deleted successfully");
      } else {
        sonnerToast.error(result.error?.message ?? "Failed to delete document");
      }
    } catch (err) {
      console.error("Delete error:", err);
      sonnerToast.error("Failed to delete document");
    } finally {
      setDeletingDocId(null);
    }
  }, []);

  // Show Drive error if present
  if (driveError) {
    sonnerToast.error(driveError);
    clearError();
  }

  // Render documents content based on state
  const renderDocumentsContent = () => {
    if (documents === undefined) {
      return <DocumentsLoading />;
    }
    if (documents.length === 0) {
      return <DocumentsEmpty />;
    }
    return (
      <DocumentsList
        deletingDocId={deletingDocId}
        documents={documents}
        onDelete={handleDelete}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Drive Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <CloudCheck className="size-5 text-green-500" weight="fill" />
            ) : (
              <Cloud className="size-5 text-muted-foreground" weight="fill" />
            )}
            <span>Google Drive</span>
            <Badge className="rounded-full" variant="secondary">
              Experimental
            </Badge>
          </CardTitle>
          <CardDescription>
            {isConnected
              ? `Connected as ${driveEmail ?? "your account"}`
              : "Connect your Google Drive to index PDF documents"}
          </CardDescription>
          <div className="mt-2 flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
            <Warning className="mt-0.5 size-4 shrink-0" weight="fill" />
            <p>Only upload a 1-3 page document.</p>
          </div>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="flex gap-2">
              <Button
                className="gap-2"
                disabled={isIngesting || !isPickerReady}
                onClick={handleSelectFile}
              >
                {isIngesting ? (
                  <Spinner className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" weight="bold" />
                )}
                {isIngesting ? "Indexing..." : "Add PDF from Drive"}
              </Button>
              <Button
                disabled={isConnectionLoading}
                onClick={handleDisconnect}
                variant="outline"
              >
                <CloudSlash className="mr-2 size-4" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              className="gap-2"
              disabled={isConnectionLoading}
              onClick={handleConnect}
            >
              {isConnectionLoading ? (
                <Spinner className="size-4 animate-spin" />
              ) : (
                <Cloud className="size-4" weight="fill" />
              )}
              Connect Google Drive
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePdf className="size-5" weight="fill" />
            Indexed Documents
          </CardTitle>
          <CardDescription>
            Your indexed documents will be used to provide personalized context
            in chat responses
          </CardDescription>
        </CardHeader>
        <CardContent>{renderDocumentsContent()}</CardContent>
      </Card>
    </div>
  );
}
