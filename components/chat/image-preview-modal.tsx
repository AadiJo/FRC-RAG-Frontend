"use client";

import { Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSidebar } from "@/app/providers/sidebar-provider";
import type { RAGImage } from "@/lib/rag";
import {
  extractTeamFromImage,
  getRagImageUrl,
  sanitizeCaption,
} from "@/lib/rag";
import { cn } from "@/lib/utils";

function MarkdownParagraph({ children }: React.ComponentPropsWithoutRef<"p">) {
  return <p className="mb-2 last:mb-0">{children}</p>;
}

function MarkdownStrong({
  children,
}: React.ComponentPropsWithoutRef<"strong">) {
  return <strong className="font-semibold">{children}</strong>;
}

function MarkdownEmphasis({ children }: React.ComponentPropsWithoutRef<"em">) {
  return <em className="italic">{children}</em>;
}

function MarkdownUnorderedList({
  children,
}: React.ComponentPropsWithoutRef<"ul">) {
  return (
    <ul className="mb-2 list-outside list-disc space-y-1 pl-5">{children}</ul>
  );
}

function MarkdownOrderedList({
  children,
}: React.ComponentPropsWithoutRef<"ol">) {
  return (
    <ol className="mb-2 list-outside list-decimal space-y-1 pl-5">
      {children}
    </ol>
  );
}

function MarkdownListItem({ children }: React.ComponentPropsWithoutRef<"li">) {
  return <li className="pl-1">{children}</li>;
}

interface ImagePreviewModalProps {
  image: RAGImage | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ImagePreviewModal({
  image,
  isOpen,
  onClose,
}: ImagePreviewModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const { isSidebarOpen } = useSidebar();

  useEffect(() => setMounted(true), []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsClosing(false);
      setImageLoadError(false);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!(isOpen && image && mounted)) return null;

  const imageUrl = getRagImageUrl(image.url);
  const teamCitation = extractTeamFromImage(image);
  const displayCitation = teamCitation || "FRC Team";
  const { caption, removedPrefix } = sanitizeCaption(image.caption);

  const markdownComponents = useMemo<Components>(
    () => ({
      em: MarkdownEmphasis,
      li: MarkdownListItem,
      ol: MarkdownOrderedList,
      p: MarkdownParagraph,
      strong: MarkdownStrong,
      ul: MarkdownUnorderedList,
    }),
    []
  );

  const modalContent = (
    <div
      className={cn(
        "fixed inset-y-0 right-0 left-0 z-52 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-[left,opacity] duration-300 ease-out",
        isSidebarOpen ? "md:left-72" : "md:left-0"
      )}
      onClick={handleClose}
      style={{ opacity: isClosing ? 0 : 1 }}
    >
      <div
        className={cn(
          "relative mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl transition-all duration-300",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: isClosing
            ? "scale(0.9) translateY(10px)"
            : "scale(1) translateY(0)",
        }}
      >
        <div className="flex items-center justify-between border-white/10 border-b p-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-lg text-white">Image Preview</h3>
            <div className="flex flex-col gap-0.5">
              <p className="text-white/60 text-xs">{displayCitation}</p>
              {removedPrefix && (
                <p className="text-white/40 text-xs italic">{removedPrefix}</p>
              )}
            </div>
          </div>
          <button
            aria-label="Close"
            className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-white/5"
            onClick={handleClose}
            type="button"
          >
            <X className="h-5 w-5 text-white/60 hover:text-white" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-6">
          {imageUrl && !imageLoadError ? (
            <div className="relative mx-auto h-[60vh] w-full max-w-4xl">
              <Image
                alt={caption || "Preview"}
                className="rounded-lg object-contain"
                fill
                onError={() => setImageLoadError(true)}
                sizes="(max-width: 768px) 90vw, 1024px"
                src={imageUrl}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-12 text-center text-muted-foreground">
              <p>Image unavailable</p>
            </div>
          )}
        </div>

        {caption && (
          <div className="flex max-h-[30vh] flex-col overflow-y-auto border-white/10 border-t bg-black/20">
            <div className="sticky top-0 z-10 flex items-center gap-2 border-white/10 border-b bg-black/20 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-white/70" strokeWidth={2} />
              <span className="font-medium text-white/70 text-xs uppercase tracking-wide">
                AI Description
              </span>
            </div>

            <div className="p-4 text-sm text-white/80">
              <ReactMarkdown
                components={markdownComponents}
                remarkPlugins={[remarkGfm]}
              >
                {caption}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default ImagePreviewModal;
