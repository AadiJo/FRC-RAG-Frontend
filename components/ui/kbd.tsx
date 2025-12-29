import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Kbd = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <kbd
      className={cn(
        "rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground text-xs",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Kbd.displayName = "Kbd";

export { Kbd };
