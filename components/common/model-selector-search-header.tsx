"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import type * as React from "react";

type SearchHeaderProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function ModelSelectorSearchHeader({
  value,
  onChange,
  placeholder = "Search models...",
}: SearchHeaderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="shrink-0 rounded-t-lg border-sidebar-border/60 border-b bg-sidebar px-3.5 pt-0.5">
      <div className="flex items-center">
        <MagnifyingGlassIcon className="!size-4 mr-3 ml-px text-muted-foreground/75" />
        <input
          aria-label="Search models"
          className="w-full bg-transparent py-2 text-foreground text-sm placeholder-muted-foreground/50 placeholder:select-none focus:outline-none"
          onChange={handleChange}
          placeholder={placeholder}
          type="search"
          value={value}
        />
      </div>
    </div>
  );
}
