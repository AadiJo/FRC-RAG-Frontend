"use client";

import { UserDocumentsManager } from "@/app/components/common/user-documents-manager";

export default function DocumentsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Connect Google Drive and index PDF documents for personalized chat
          responses. Your documents are processed and stored securely.
        </p>
      </div>
      <UserDocumentsManager />
    </div>
  );
}
