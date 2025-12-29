"use client";

import { Images } from "@phosphor-icons/react";
import Image from "next/image";
import { memo, useState } from "react";
import ImagePreviewModal from "@/components/chat/image-preview-modal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  extractTeamFromImage,
  getRagImageUrl,
  type RAGImage,
  sanitizeCaption,
} from "@/lib/rag";

type RAGRelatedImagesProps = {
  images: RAGImage[];
  imagesSkipped?: boolean;
  className?: string;
};

type ThumbnailProps = {
  image: RAGImage;
};

/**
 * Individual thumbnail for the related images grid
 */
function ThumbnailComponent({ image }: ThumbnailProps) {
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const imageUrl = getRagImageUrl(image.url);
  const { caption: cleanCaption } = sanitizeCaption(image.caption);
  const _team = extractTeamFromImage(image);

  if (!imageUrl || error) {
    return null;
  }

  return (
    <>
      <button
        className="group z-10"
        onClick={() => setOpen(true)}
        type="button"
      >
        <div className="relative size-20 flex-shrink-0 overflow-hidden rounded-md border border-border bg-muted/20 transition-all duration-150 group-hover:border-primary/50 group-hover:shadow-md sm:size-24">
          <Image
            alt={cleanCaption || "Related FRC image"}
            className="size-full object-cover"
            fill
            loading="lazy"
            onError={() => setError(true)}
            sizes="96px"
            src={imageUrl}
          />
        </div>
      </button>

      <ImagePreviewModal
        image={image}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const Thumbnail = memo(ThumbnailComponent);

/**
 * Related images section component
 * Displays a horizontal scrolling grid of related RAG images at the bottom of assistant messages
 */
function RAGRelatedImagesComponent({
  images,
  className,
}: RAGRelatedImagesProps) {
  // Filter to only images that have valid URLs
  const validImages = images.filter(
    (img) => img.url && getRagImageUrl(img.url)
  );

  // Don't render if no valid images
  if (validImages.length === 0) {
    return null;
  }

  return (
    <div className={`mt-4 ${className ?? ""}`}>
      <div className="mb-2 flex items-center gap-1.5 text-muted-foreground text-xs">
        <Images size={14} />
        <span>Related images ({validImages.length})</span>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-6">
          {validImages.map((image) => (
            <Thumbnail image={image} key={image.image_id} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

export const RAGRelatedImages = memo(RAGRelatedImagesComponent);
