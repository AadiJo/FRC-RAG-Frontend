"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type PromptInputContextType = {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
};

const PromptInputContext = createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
});

function usePromptInput() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInput");
  }
  return context;
}

type PromptInputProps = {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
};

function PromptInput({
  className,
  isLoading = false,
  maxHeight = 240,
  value,
  onValueChange,
  onSubmit,
  children,
}: PromptInputProps) {
  const [internalValue, setInternalValue] = useState(value || "");

  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <PromptInputContext.Provider
      value={{
        isLoading,
        value: value ?? internalValue,
        setValue: onValueChange ?? handleChange,
        maxHeight,
        onSubmit,
      }}
    >
      <div
        className={cn(
          "rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl transition-all duration-300 focus-within:border-white/20 focus-within:bg-white/10 hover:bg-white/[0.07]",
          className
        )}
      >
        {children}
      </div>
    </PromptInputContext.Provider>
  );
}

export type PromptInputTextareaProps = {
  disableAutosize?: boolean;
} & React.ComponentProps<typeof Textarea>;

const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(
  (
    { className, onKeyDown, disableAutosize = false, ...props },
    forwardedRef
  ) => {
    const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
          return;
        }

        if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    useEffect(() => {
      const el = internalRef.current;
      if (!el) {
        return;
      }

      // Never allow horizontal scrollbars in the prompt input.
      el.style.overflowX = "hidden";

      // Disable experimental field sizing behavior so our JS autosize is the
      // single source of truth (ignored by browsers that don't support it).
      el.style.setProperty("field-sizing", "fixed");

      if (disableAutosize) {
        el.style.overflowY = "auto";
        return;
      }

      // Reset height to auto first to properly measure scrollHeight.
      el.style.height = "auto";

      const contentHeight = el.scrollHeight;

      if (typeof maxHeight === "number") {
        const nextHeight = Math.min(contentHeight, maxHeight);
        el.style.height = `${nextHeight}px`;
        el.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
        return;
      }

      el.style.height = `${contentHeight}px`;
      el.style.overflowY = "auto";
    }, [value, disableAutosize, maxHeight]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit?.();
      }
      onKeyDown?.(e);
    };

    const maxHeightStyle =
      typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

    return (
      <Textarea
        autoFocus
        className={cn(
          "min-h-[44px] w-full resize-none border-0 bg-transparent text-white shadow-none outline-none placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0",
          "overflow-x-hidden overflow-y-hidden break-words",
          className
        )}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        ref={setRefs}
        rows={1}
        style={{
          maxHeight: maxHeightStyle,
        }}
        value={value}
        {...props}
      />
    );
  }
);

PromptInputTextarea.displayName = "PromptInputTextarea";

type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>;

function PromptInputActions({
  children,
  className,
  ...props
}: PromptInputActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

type PromptInputActionProps = {
  className?: string;
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
} & React.ComponentProps<typeof Tooltip>;

function PromptInputAction({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}: PromptInputActionProps) {
  const { disabled } = usePromptInput();

  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={disabled}>
        {children}
      </TooltipTrigger>
      <TooltipContent className={className} side={side}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
};
