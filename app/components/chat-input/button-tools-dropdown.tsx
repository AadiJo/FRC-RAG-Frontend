"use client";

import { Globe, Settings2 } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MODELS_OPTIONS } from "@/lib/config";
import { PopoverContentApiKey } from "./popover-content-api-key";
import { PopoverContentAuth } from "./popover-content-auth";

type ButtonToolsDropdownProps = {
  isUserAuthenticated: boolean;
  hasAnyApiKey: boolean;
  selectedModel: string;
  searchEnabled: boolean;
  onToggleSearch: () => void;
};

function BaseButtonToolsDropdown({
  isUserAuthenticated,
  hasAnyApiKey,
  selectedModel,
  searchEnabled,
  onToggleSearch,
}: ButtonToolsDropdownProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedModelConfig = useMemo(
    () => MODELS_OPTIONS.find((m) => m.id === selectedModel),
    [selectedModel]
  );

  const isToolCallingAvailable = useMemo(
    () =>
      selectedModelConfig?.features?.find((f) => f.id === "tool-calling")
        ?.enabled === true,
    [selectedModelConfig]
  );

  // Web search is only supported/toggleable for models routed through OpenRouter.
  const isOpenRouterModel = selectedModelConfig?.provider === "openrouter";
  const canToggleSearch = isToolCallingAvailable && isOpenRouterModel;

  // Auth gating: mirror existing pattern from ButtonSearch
  if (!isUserAuthenticated) {
    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                aria-label="Tools"
                className="h-8 w-8 shrink-0 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
                size="icon"
                type="button"
                variant="ghost"
              >
                <Settings2 className="size-[18px]" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Tools</TooltipContent>
        </Tooltip>
        <PopoverContentAuth />
      </Popover>
    );
  }

  // Require API key for tools (search)
  if (!hasAnyApiKey) {
    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                aria-label="Tools"
                className="h-8 w-8 shrink-0 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
                size="icon"
                type="button"
                variant="ghost"
              >
                <Settings2 className="size-[18px]" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Tools require an API key</TooltipContent>
        </Tooltip>
        <PopoverContentApiKey />
      </Popover>
    );
  }

  return (
    <DropdownMenu onOpenChange={setMenuOpen} open={menuOpen}>
      <Tooltip {...(menuOpen ? { open: false } : {})}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Tools"
              className={`h-8 w-8 shrink-0 rounded-lg transition-all duration-200 active:scale-95 ${
                menuOpen
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Settings2 className="size-[18px]" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Tools</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="start"
        className="min-w-[12rem] border-white/10 bg-white/5 p-0 text-foreground shadow-lg backdrop-blur-xl"
        onCloseAutoFocus={(e) => e.preventDefault()}
        side="top"
      >
        <DropdownMenuItem
          className="m-1.5 rounded-lg px-3 py-2 focus:bg-white/10"
          disabled={!canToggleSearch}
          onSelect={(e) => {
            e.preventDefault();
            if (!canToggleSearch) {
              return;
            }
            onToggleSearch();
            setMenuOpen(false);
          }}
        >
          <div className="flex w-full cursor-pointer items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="size-4" />
              <span>Web Search</span>
            </div>
            <Switch
              aria-label="Toggle web search"
              checked={searchEnabled}
              className="pointer-events-none"
              disabled={!canToggleSearch}
            />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const ButtonToolsDropdown = memo(BaseButtonToolsDropdown);
