"use client";

import { Key } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";

export function PopoverContentApiKey() {
  return (
    <PopoverContent
      align="start"
      className="w-[320px] overflow-hidden rounded-xl border border-white/10 bg-black/20 p-0 text-white shadow-lg backdrop-blur-xl"
      side="top"
    >
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Key className="size-5 text-yellow-400" weight="duotone" />
          <p className="font-medium text-base text-primary">
            API Key Required for Search
          </p>
        </div>
        <p className="mb-4 text-muted-foreground text-sm">
          Web search requires an API key from any provider. Adding your own keys
          is{" "}
          <span className="font-semibold text-green-400">completely free</span>{" "}
          and unlocks all features with no daily limits.
        </p>
        <Button asChild className="w-full" size="default" variant="secondary">
          <Link href="/settings/api-keys">
            <Key className="mr-2 size-4" weight="bold" />
            Add API Keys
          </Link>
        </Button>
      </div>
    </PopoverContent>
  );
}
