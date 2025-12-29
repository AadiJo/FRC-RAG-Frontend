"use client";

import { ImageBroken } from "@phosphor-icons/react";
import Image from "next/image";
import { memo, useState } from "react";
import ImagePreviewModal from "@/components/chat/image-preview-modal";
import { getRagImageUrl, type RAGImage, sanitizeCaption } from "@/lib/rag";

type RAGInlineImageProps = {
  imageId: string;
  ragImages: RAGImage[];
  className?: string;
};

/**
 * Inline RAG image component
 * Renders an image from the RAG backend inline with the message text
 */
function RAGInlineImageComponent({
  imageId,
  ragImages,
  className,
}: RAGInlineImageProps) {
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);

  // Find the image metadata
  const imageData = ragImages.find((img) => img.image_id === imageId);
  const { caption: cleanCaption } = sanitizeCaption(imageData?.caption);

  // If no metadata found, render nothing silently
  if (!imageData) {
    return null;
  }

  const imageUrl = getRagImageUrl(imageData.url);

  // Handle missing URL or load error
  if (!imageUrl || error) {
    return (
      <div className="my-3 flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-muted-foreground text-xs">
        <ImageBroken size={14} />
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={`my-3 flex justify-center ${className ?? ""}`}>
      <figure className="max-w-[80vw] sm:max-w-md">
        <div className="z-10">
          <button
            className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/20"
            onClick={() => setOpen(true)}
            type="button"
          >
            <Image
              alt={cleanCaption || `FRC RAG Image ${imageId}`}
              className="h-auto max-h-[300px] w-full object-contain"
              height={300}
              loading="lazy"
              onError={() => setError(true)}
              src={imageUrl}
              width={400}
            />
          </button>

          <ImagePreviewModal
            image={imageData}
            isOpen={open}
            onClose={() => setOpen(false)}
          />
        </div>
      </figure>
    </div>
  );
}

export const RAGInlineImage = memo(RAGInlineImageComponent);
