"use client";

import {
  BrainIcon,
  CurrencyDollarIcon,
  PushPinSimpleIcon,
  PushPinSimpleSlashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import React, { useCallback, useMemo } from "react";
import { ProviderIcon } from "@/app/components/common/provider-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PROVIDERS_OPTIONS } from "@/lib/config";
import { cn } from "@/lib/utils";

type Model = {
  id: string;
  name: string;
  subName?: string;
  provider: string;
  displayProvider?: string;
  premium: boolean;
  usesPremiumCredits: boolean;
  isFree?: boolean; // For OpenRouter models: true = free tier, false/undefined = paid
  description: string;
  apiKeyUsage: {
    allowUserKey: boolean;
    userKeyOnly: boolean;
  };
  features: Array<{
    id: string;
    enabled: boolean;
    label?: string;
  }>;
};

type ModelCardProps = {
  model: Model;
  isSelected: boolean;
  isFavorite: boolean;
  isDisabled: boolean;
  isLastFavorite?: boolean;
  onSelect: (modelId: string) => void;
  onToggleFavorite: (modelId: string) => void;
};

export const ModelCard = React.memo(function ModelCardInner({
  model,
  isSelected,
  isFavorite,
  isDisabled,
  isLastFavorite = false,
  onSelect,
  onToggleFavorite,
}: ModelCardProps) {
  const provider = PROVIDERS_OPTIONS.find(
    (p) => p.id === (model.displayProvider || model.provider)
  );

  const apiProvider = useMemo(() => {
    const apiProviderId = model.provider === "groq" ? "groq" : "openrouter";
    return PROVIDERS_OPTIONS.find((p) => p.id === apiProviderId);
  }, [model.provider]);

  // Feature flags
  // Pre-compute features map for O(1) lookups
  const featuresMap = useMemo(
    () =>
      model.features?.reduce(
        (acc, feature) => {
          acc[feature.id] = feature.enabled;
          return acc;
        },
        {} as Record<string, boolean>
      ) || {},
    [model.features]
  );

  // Feature flags - O(1) lookups
  const hasReasoning = featuresMap.reasoning;
  // Style definitions for feature icons
  const iconWrapperBaseClasses =
    "relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-md cursor-help";
  const iconOverlayClasses =
    "absolute inset-0 bg-current opacity-20 dark:opacity-25";
  const iconSizeClasses = "h-3 w-3";

  // Color classes for features
  const reasoningColorClasses = "text-pink-600 dark:text-pink-400";

  const handleCardClick = useCallback(() => {
    if (!isDisabled) {
      onSelect(model.id);
    }
  }, [isDisabled, onSelect, model.id]);

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Prevent unpinning if this is the last favorite
      if (isFavorite && isLastFavorite) {
        return;
      }
      onToggleFavorite(model.id);
    },
    [isFavorite, isLastFavorite, onToggleFavorite, model.id]
  );

  const pinTooltipLabel = useMemo(() => {
    if (isFavorite && isLastFavorite) {
      return "Must keep at least one favorite model";
    }
    if (isFavorite) {
      return "Unpin model";
    }
    return "Pin model";
  }, [isFavorite, isLastFavorite]);

  // Helper function to format display name with subName
  const getDisplayName = useCallback(
    (modelName: string, subName?: string) =>
      subName ? `${modelName} (${subName})` : modelName,
    []
  );

  // Use the full display name including subName - memoized
  const { displayName, firstName, restName } = useMemo(() => {
    const computedDisplayName = getDisplayName(model.name, model.subName);
    const nameParts = computedDisplayName.split(" ");
    const firstNamePart = nameParts[0] || "";
    const restNamePart = nameParts.slice(1).join(" ");
    return {
      displayName: computedDisplayName,
      firstName: firstNamePart,
      restName: restNamePart,
    };
  }, [model.name, model.subName, getDisplayName]);

  // Provider id (e.g. 'groq' or 'openrouter') for concise tooltips
  const providerId = useMemo(
    () => model.displayProvider || model.provider,
    [model.displayProvider, model.provider]
  );

  // Check if model is paid - based on isFree property or ":free" suffix
  // Models are paid if they are NOT explicitly free
  const isPaidModel = useMemo(() => {
    // If isFree is explicitly true, it's free
    if (model.isFree === true) {
      return false;
    }
    // If model ID ends with :free, it's free
    if (model.id.endsWith(":free")) {
      return false;
    }
    // Premium models are always paid (when not using own API key)
    if (model.premium) {
      return true;
    }
    // Non-Groq models (OpenRouter) without :free suffix are paid
    // Groq models are free to use (they use Groq's free tier)
    return model.provider !== "groq";
  }, [model.isFree, model.id, model.premium, model.provider]);

  // Memoized tooltip content
  const { tooltipContentParts, tooltipDisplay } = useMemo(() => {
    // If the card is disabled, show a concise instruction telling the user
    // to add the provider API key in Settings to enable this model.
    if (isDisabled) {
      // Models are typically accessed via OpenRouter unless explicitly on Groq.
      // Keep this in sync with the availability logic in `use-enriched-models`.
      const apiKeyProviderId =
        model.provider === "groq" ? "groq" : "openrouter";
      const msg = (
        <div className="flex flex-col gap-1 font-medium text-xs">
          <div>
            Add a {apiKeyProviderId} API key in your{" "}
            <Link className="underline" href="/settings/api-keys">
              Settings
            </Link>{" "}
            to use this model.
          </div>
        </div>
      );

      return { tooltipContentParts: [msg], tooltipDisplay: msg };
    }

    const contentParts: React.ReactNode[] = [];

    // Show provider id and model name (use provider id, not company name)
    contentParts.push(
      <span className="flex items-center gap-1" key="provider-model">
        {providerId} · {displayName}
      </span>
    );

    // Intentionally keep the tooltip minimal (reasoning-only badge policy).

    const tooltipNode = (
      <div className="flex items-center gap-1.5 font-medium text-xs">
        {contentParts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < contentParts.length - 1 && (
              <span className="text-muted-foreground">·</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );

    return { tooltipContentParts: contentParts, tooltipDisplay: tooltipNode };
  }, [displayName, providerId, model.provider, isDisabled]);

  return (
    <div className="group relative" data-state="closed">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "group relative flex h-[7.5rem] w-[5.75rem] cursor-pointer flex-col items-start gap-0.5 overflow-hidden rounded-xl border border-sidebar-border/40 bg-sidebar-accent px-2 pt-2 pb-9 text-color-heading transition-colors",
              "[--model-muted:hsl(var(--muted-foreground)/0.9)] [--model-primary:hsl(var(--color-heading))]",
              "hover:bg-accent/30 hover:text-color-heading",
              "dark:[--model-muted:hsl(var(--color-heading))] dark:[--model-primary:hsl(var(--muted-foreground)/0.9)]",
              "dark:hover:bg-accent/30",
              isSelected &&
                "border-2 border-primary bg-sidebar-accent/95 ring-2 ring-primary/40",
              isDisabled && "cursor-not-allowed opacity-50"
            )}
            disabled={isDisabled}
            onClick={handleCardClick}
            type="button"
          >
            {isPaidModel ? (
              <div className="absolute top-1.5 right-1.5 flex items-center">
                <CurrencyDollarIcon
                  className="size-3.5 text-amber-500"
                  weight="bold"
                />
              </div>
            ) : null}
            <div className="flex w-full flex-col items-center justify-center gap-1 font-medium transition-colors">
              {provider ? (
                <ProviderIcon
                  className="size-6 text-[--model-primary]"
                  provider={provider}
                />
              ) : null}
              <div className="w-full text-center text-[--model-primary]">
                <div className="font-semibold text-sm leading-tight">
                  {firstName}
                </div>
                {restName ? (
                  <div className="-mt-0.5 font-semibold text-xs leading-tight">
                    {restName}
                  </div>
                ) : null}
                <div className="-mt-1 text-[--model-muted] text-[10px]">
                  {/* Icons are now at the top right */}
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-2 flex w-full items-center justify-center gap-2">
              {hasReasoning ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        iconWrapperBaseClasses,
                        reasoningColorClasses
                      )}
                    >
                      <div className={iconOverlayClasses} />
                      <BrainIcon
                        className={cn(
                          iconSizeClasses,
                          "relative",
                          reasoningColorClasses
                        )}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Supports reasoning capabilities</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}

              {apiProvider ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(iconWrapperBaseClasses)}>
                      <div className={iconOverlayClasses} />
                      <ProviderIcon
                        className={cn(iconSizeClasses, "relative")}
                        provider={apiProvider}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{apiProvider.id}</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </button>
        </TooltipTrigger>
        {tooltipContentParts.length > 0 ? (
          <TooltipContent side="top">{tooltipDisplay}</TooltipContent>
        ) : null}
      </Tooltip>

      {/* Pin/Unpin button on hover */}
      <div className="absolute -top-1.5 -right-1.5 left-auto z-50 flex w-auto translate-y-2 scale-95 items-center rounded-[10px] border border-chat-border/40 bg-card p-1 text-muted-foreground text-xs opacity-0 transition-all group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label={isFavorite ? "Unpin model" : "Pin model"}
              className={cn(
                "cursor-pointer rounded-md bg-accent/30 p-1.5 hover:bg-muted/50",
                isFavorite && isLastFavorite && "cursor-not-allowed opacity-50"
              )}
              disabled={isFavorite && isLastFavorite}
              onClick={handleToggleFavorite}
              tabIndex={-1}
              type="button"
            >
              {isFavorite ? (
                <PushPinSimpleSlashIcon className="size-4" />
              ) : (
                <PushPinSimpleIcon className="size-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{pinTooltipLabel}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});
