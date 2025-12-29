"use client";

import { CaretLeftIcon, CaretUpIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

type ModelSelectorFooterProps = {
  isExtended: boolean;
  onToggleMode: () => void;
  onFilterClick?: () => void;
};

export function ModelSelectorFooter({
  isExtended,
  onToggleMode,
}: ModelSelectorFooterProps) {
  return (
    <div className="flex shrink-0 items-center justify-between rounded-b-lg border-sidebar-border/60 border-t bg-sidebar px-2.5 py-1.5">
      <Button
        className="flex items-center gap-2 pl-2 text-muted-foreground text-sm hover:cursor-pointer hover:bg-muted/40 hover:text-foreground"
        onClick={onToggleMode}
        size="sm"
        variant="ghost"
      >
        {isExtended ? (
          <>
            <CaretLeftIcon className="h-4 w-4" />
            <span>Favorites</span>
          </>
        ) : (
          <>
            <CaretUpIcon className="h-4 w-4" />
            <span>Show all</span>
          </>
        )}
      </Button>
    </div>
  );
}
