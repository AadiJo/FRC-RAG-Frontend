"use client";

import type { VariantProps } from "class-variance-authority";
import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ScrollButtonProps = {
  containerRef: React.RefObject<HTMLElement | null>;
  anchorRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  threshold?: number;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function ScrollButton({
  containerRef,
  anchorRef,
  className,
  threshold = 24,
  variant = "outline",
  size = "sm",
  ...props
}: ScrollButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let rafId = 0;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const attach = (container: HTMLElement) => {
      const resolvedThreshold = Math.max(0, threshold);

      const updateVisibility = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const remaining = scrollHeight - (scrollTop + clientHeight);
        setIsVisible(remaining > resolvedThreshold);
      };

      let observer: IntersectionObserver | undefined;
      let resizeObserver: ResizeObserver | undefined;
      let mutationObserver: MutationObserver | undefined;

      container.addEventListener("scroll", updateVisibility, { passive: true });
      window.addEventListener("resize", updateVisibility);
      updateVisibility();

      const anchor = anchorRef?.current;
      if (anchor && typeof IntersectionObserver !== "undefined") {
        observer = new IntersectionObserver(
          () => {
            updateVisibility();
          },
          {
            root: container,
            threshold: 0,
            rootMargin: `0px 0px ${resolvedThreshold}px 0px`,
          }
        );
        observer.observe(anchor);
      }

      resizeObserver = new ResizeObserver(() => {
        updateVisibility();
      });
      resizeObserver.observe(container);

      mutationObserver = new MutationObserver(() => {
        updateVisibility();
      });
      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        if (observer) {
          observer.disconnect();
        }
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (mutationObserver) {
          mutationObserver.disconnect();
        }
        container.removeEventListener("scroll", updateVisibility);
        window.removeEventListener("resize", updateVisibility);
      };
    };

    const tryAttach = () => {
      if (disposed) {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        rafId = requestAnimationFrame(tryAttach);
        return;
      }

      cleanup = attach(container);
    };

    tryAttach();

    return () => {
      disposed = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      cleanup?.();
    };
  }, [containerRef, threshold, anchorRef]);

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <Button
      className={cn(
        "z-50 rounded-full p-0 transition-all duration-150 ease-out",
        isVisible
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-95 opacity-0",
        className
      )}
      onClick={scrollToBottom}
      size={size}
      variant={variant}
      {...props}
    >
      <ArrowDown className="h-4 w-4" />
    </Button>
  );
}

export { ScrollButton };
