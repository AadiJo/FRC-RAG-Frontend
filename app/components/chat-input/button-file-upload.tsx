import { SpinnerGap } from "@phosphor-icons/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useDriveConnection } from "@/app/hooks/use-drive-connection";
import { Button } from "@/components/ui/button";
// toasts removed for upload flows
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ButtonFileUploadProps = {
  onFileUpload: (files: File[]) => void;
  isUserAuthenticated: boolean;
  model: string;
};

export function ButtonFileUpload({
  onFileUpload: _onFileUpload,
  isUserAuthenticated,
  model: _model,
}: ButtonFileUploadProps) {
  const router = useRouter();

  const handleClick = () => {
    // Use a full page navigation to ensure Drive picker and related
    // initialization runs correctly on the settings page.
    window.location.href = "/settings/documents";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label="Open Documents settings"
          className="h-8 w-8 shrink-0 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          onClick={handleClick}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Plus className="size-[18px]" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Go to Documents</TooltipContent>
    </Tooltip>
  );
}

function ButtonDrivePdfAdd() {
  const router = useRouter();
  const {
    isConnected,
    isPickerReady,
    openPicker,
    requestToken,
    getLatestAccessToken,
  } = useDriveConnection();

  const [isIngesting, setIsIngesting] = useState(false);

  const handleClick = useCallback(async () => {
    if (isIngesting) {
      return;
    }

    if (!isConnected) {
      router.push("/settings/documents");
      return;
    }

    if (!isPickerReady) {
      // picker not ready; abort
      return;
    }

    try {
      const docs = await openPicker();
      // picker returned; notifications removed
      if (!docs || docs.length === 0) {
        return;
      }

      const selectedDoc = docs[0];
      // selected doc; notifications removed
      if (!selectedDoc) {
        return;
      }

      const token = getLatestAccessToken() ?? (await requestToken());
      // auth token obtained; notifications removed
      if (!token) {
        // auth failed; abort without UI toast
        return;
      }

      setIsIngesting(true);

      // indexing started; notifications removed

      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driveFileId: selectedDoc.id,
          fileName: selectedDoc.name,
          mimeType: selectedDoc.mimeType ?? "application/pdf",
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

      const chunkCount =
        typeof result === "object" &&
        result !== null &&
        "chunkCount" in result &&
        typeof (result as { chunkCount: unknown }).chunkCount === "number"
          ? (result as { chunkCount: number }).chunkCount
          : null;

      // indexing result: notifications removed
    } catch {
      // swallow: indexing failed (no UI toast)
    } finally {
      setIsIngesting(false);
    }
  }, [
    isConnected,
    isIngesting,
    isPickerReady,
    openPicker,
    requestToken,
    router,
  ]);

  let tooltipText = "Add a PDF";
  if (isIngesting) {
    tooltipText = "Indexing…";
  } else if (!isConnected) {
    tooltipText = "Connect Google Drive";
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={isIngesting ? "Indexing PDF" : "Add a PDF"}
          className="h-8 w-8 shrink-0 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          disabled={isIngesting}
          onClick={handleClick}
          size="icon"
          type="button"
          variant="ghost"
        >
          {isIngesting ? (
            <SpinnerGap className="size-[18px] animate-spin" weight="bold" />
          ) : (
            <Plus className="size-[18px]" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}

function formatIndexedDescription(fileName: string, chunkCount: number | null) {
  if (chunkCount === null) {
    return `Indexed "${fileName}"`;
  }
  return `Indexed "${fileName}" (${chunkCount} chunks)`;
}
