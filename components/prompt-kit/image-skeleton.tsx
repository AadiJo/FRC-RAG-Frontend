"use client";

import { cn } from "@/lib/utils";

export interface ImageSkeletonProps {
  className?: string;
  width?: number;
  height?: number;
}

export function ImageSkeleton({
  className,
  width = 300,
  height = 300,
}: ImageSkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "animate-pulse",
        className
      )}
      style={{ width, height }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Image placeholder icon */}
      <div className="flex h-full w-full items-center justify-center">
        <svg
          className="h-12 w-12 text-muted-foreground/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21,15 16,10 5,21" />
        </svg>
      </div>
    </div>
  );
}
