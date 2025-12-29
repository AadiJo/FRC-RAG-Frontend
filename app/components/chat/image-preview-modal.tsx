"use client";

import { Sparkles, X } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  extractTeamFromImage,
  getRagImageUrl,
  type RAGImage,
  sanitizeCaption,
} from "@/lib/rag";

type ImagePreviewModalProps = {
  image: RAGImage | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ImagePreviewModal({
  image,
  isOpen,
  onClose,
}: ImagePreviewModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsClosing(false);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!(isOpen && image && mounted)) {
    return null;
  }

  const imageUrl = getRagImageUrl(image.url);
  const teamCitation = extractTeamFromImage(image);
  const displayCitation = teamCitation || "FRC Team";
  const { caption, removedPrefix } = sanitizeCaption(image.caption);

  const modalContent = (
    <button
      className="fixed inset-0 z-50 flex cursor-default items-center justify-center border-none bg-black/80 p-0 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleClose}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClose();
        }
      }}
      style={{
        opacity: isClosing ? 0 : 1,
        animation: isClosing ? undefined : "fadeIn 0.2s ease-out",
      }}
      type="button"
    >
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: Dialog content needs click handler to prevent close on content click */}
      <div
        aria-label="Image preview dialog"
        className="relative mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-white/10 bg-[#0f0f23] shadow-2xl transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        style={{
          opacity: isClosing ? 0 : 1,
          transform: isClosing
            ? "scale(0.9) translateY(10px)"
            : "scale(1) translateY(0)",
          animation: isClosing
            ? undefined
            : "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div className="flex items-center justify-between border-white/10 border-b p-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-lg text-white">Image Preview</h3>
            <div className="flex flex-col gap-0.5">
              <p className="text-white/60 text-xs">{displayCitation}</p>
              {removedPrefix ? (
                <p className="text-white/40 text-xs italic">{removedPrefix}</p>
              ) : null}
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

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-6">
          {imageUrl ? (
            <div className="relative flex max-h-full max-w-full items-center justify-center">
              <Image
                alt={caption || "Preview image"}
                className="max-h-[60vh] w-auto rounded-lg object-contain"
                height={600}
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = "none";
                }}
                src={imageUrl}
                width={800}
              />
            </div>
          ) : (
            <div className="p-12 text-center text-white/40">
              <p>Image unavailable</p>
            </div>
          )}
        </div>

        {caption ? (
          <div className="flex max-h-[30vh] flex-col overflow-y-auto border-white/10 border-t bg-black/20">
            <div className="sticky top-0 z-10 flex items-center gap-2 border-white/10 border-b bg-black/20 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-white/70" strokeWidth={2} />
              <span className="font-medium text-white/70 text-xs uppercase tracking-wide">
                AI Description
              </span>
            </div>

            <div className="p-4 text-sm text-white/80">
              <ReactMarkdown
                components={{
                  p: ({ children }: { children?: ReactNode }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }: { children?: ReactNode }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  em: ({ children }: { children?: ReactNode }) => (
                    <em className="italic">{children}</em>
                  ),
                  ul: ({ children }: { children?: ReactNode }) => (
                    <ul className="mb-2 list-outside list-disc space-y-1 pl-5">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }: { children?: ReactNode }) => (
                    <ol className="mb-2 list-outside list-decimal space-y-1 pl-5">
                      {children}
                    </ol>
                  ),
                  li: ({ children }: { children?: ReactNode }) => (
                    <li className="pl-1">{children}</li>
                  ),
                }}
                remarkPlugins={[remarkGfm]}
              >
                {caption}
              </ReactMarkdown>
            </div>
          </div>
        ) : null}
      </div>
    </button>
  );

  return createPortal(modalContent, document.body);
}

export default ImagePreviewModal;
