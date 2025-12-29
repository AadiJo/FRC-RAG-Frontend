"use client";

import {
  BrainIcon,
  CurrencyDollarIcon,
  EyeIcon,
  FilePdfIcon,
  ImagesIcon,
  KeyIcon,
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

export const ModelCard = React.memo(function ModelCard({
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
  const hasFileUpload = featuresMap["file-upload"];
  const hasPdfProcessing = featuresMap["pdf-processing"];
  const hasReasoning = featuresMap["reasoning"];
  const hasImageGeneration = featuresMap["image-generation"];
  // Style definitions for feature icons
  const iconWrapperBaseClasses =
    "relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-md cursor-help";
  const iconOverlayClasses =
    "absolute inset-0 bg-current opacity-20 dark:opacity-25";
  const iconSizeClasses = "h-3 w-3";

  // Color classes for features
  const visionColorClasses = "text-teal-600 dark:text-teal-400";
  const pdfColorClasses = "text-indigo-600 dark:text-indigo-400";
  const reasoningColorClasses = "text-pink-600 dark:text-pink-400";
  const imageGenerationColorClasses = "text-orange-600 dark:text-orange-400";

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

    if (model.provider === "openrouter" && model.isFree !== true) {
      contentParts.push(
        <span className="flex items-center gap-1" key="paid">
          <CurrencyDollarIcon className="size-3" weight="bold" />
          Paid
        </span>
      );
    }
    if (model.apiKeyUsage.userKeyOnly) {
      contentParts.push(
        <span className="flex items-center gap-1" key="apikey">
          <KeyIcon className="size-3" />
          Requires API Key
        </span>
      );
    }

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
  }, [
    displayName,
    providerId,
    model.provider,
    model.isFree,
    model.apiKeyUsage.userKeyOnly,
    isDisabled,
  ]);

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
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
              {model.provider === "openrouter" && model.isFree !== true && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <CurrencyDollarIcon
                        className="size-3.5 text-amber-500"
                        weight="bold"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Paid model on {providerId}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {model.apiKeyUsage.userKeyOnly ? (
                <KeyIcon className="size-3.5 text-muted-foreground" />
              ) : null}
            </div>
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
              {hasFileUpload ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(iconWrapperBaseClasses, visionColorClasses)}
                    >
                      <div className={iconOverlayClasses} />
                      <EyeIcon
                        className={cn(
                          iconSizeClasses,
                          "relative",
                          visionColorClasses
                        )}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Supports Image Upload and Analysis</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
              {hasPdfProcessing ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(iconWrapperBaseClasses, pdfColorClasses)}
                    >
                      <div className={iconOverlayClasses} />
                      <FilePdfIcon
                        className={cn(
                          iconSizeClasses,
                          "relative",
                          pdfColorClasses
                        )}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Supports PDF Upload and Analysis</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
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
              {hasImageGeneration ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        iconWrapperBaseClasses,
                        imageGenerationColorClasses
                      )}
                    >
                      <div className={iconOverlayClasses} />
                      <ImagesIcon
                        className={cn(
                          iconSizeClasses,
                          "relative",
                          imageGenerationColorClasses
                        )}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Can generate images</p>
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
            <p>
              {isFavorite && isLastFavorite
                ? "Must keep at least one favorite model"
                : isFavorite
                  ? "Unpin model"
                  : "Pin model"}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});
