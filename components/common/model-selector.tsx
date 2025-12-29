"use client";

import {
  BrainIcon,
  CaretDownIcon,
  EyeIcon,
  EyeSlashIcon,
  FilePdfIcon,
  KeyIcon,
  PushPinSimpleIcon,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { ProviderIcon } from "@/app/components/common/provider-icon";
import { useBreakpoint } from "@/app/hooks/use-breakpoint";
import {
  type EnrichedModel,
  useEnrichedModels,
} from "@/app/hooks/use-enriched-models";
import { useModelPreferences } from "@/app/hooks/use-model-preferences";
import { useModelSettings } from "@/app/hooks/use-model-settings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MODELS_OPTIONS, PROVIDERS_OPTIONS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { ModelCard } from "./model-card";
import { ModelSelectorFooter } from "./model-selector-footer";
import { ModelSelectorSearchHeader } from "./model-selector-search-header";

type ModelSelectorProps = {
  selectedModelId: string;
  setSelectedModelId: (modelId: string) => void;
  className?: string;
};

export function ModelSelector({
  selectedModelId,
  setSelectedModelId,
  className,
}: ModelSelectorProps) {
  const { toggleFavoriteModel } = useModelPreferences();
  const { categorizedModels } = useEnrichedModels();
  const { disabledModelsSet } = useModelSettings();
  const isMobile = useBreakpoint(768);

  // State for dropdown, search, and extended mode
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExtendedMode, setIsExtendedMode] = useState(false);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedModelId(id);
      setIsOpen(false);
    },
    [setSelectedModelId]
  );

  // Determine if extended mode should be shown
  const isExtended = searchQuery.length > 0 || isExtendedMode;

  // Helper function to format display name with subName
  const getDisplayName = useCallback(
    (modelName: string, subName?: string) =>
      subName ? `${modelName} (${subName})` : modelName,
    []
  );

  // Optimized model filtering using pre-computed enriched models
  const { normalModeModels, favoritesModels, othersModels, disabledModels } =
    useMemo(() => {
      let favorites = categorizedModels.favorites;
      let others = categorizedModels.others.filter(
        (modelOption) => !disabledModelsSet.has(modelOption.id)
      );
      let disabled = categorizedModels.all.filter((modelOption) =>
        disabledModelsSet.has(modelOption.id)
      );

      // Apply search filter if needed
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (candidateModel: EnrichedModel) => {
          const displayName = getDisplayName(
            candidateModel.name,
            candidateModel.subName
          );
          const modelWithDisplayProvider =
            candidateModel as typeof candidateModel & {
              displayProvider?: string;
            };
          const displayProvider =
            modelWithDisplayProvider.displayProvider || candidateModel.provider;
          return (
            displayName.toLowerCase().includes(query) ||
            candidateModel.provider.toLowerCase().includes(query) ||
            displayProvider.toLowerCase().includes(query)
          );
        };

        favorites = favorites.filter(matchesSearch);
        others = others.filter(matchesSearch);
        disabled = disabled.filter(matchesSearch);
      }

      return {
        normalModeModels: favorites,
        favoritesModels: favorites,
        othersModels: others,
        disabledModels: disabled,
      };
    }, [categorizedModels, searchQuery, disabledModelsSet, getDisplayName]);

  // Handle toggle between normal and extended mode
  const handleToggleMode = useCallback(() => {
    if (isExtended && searchQuery) {
      setSearchQuery("");
    } else {
      setIsExtendedMode(!isExtendedMode);
    }
  }, [isExtended, searchQuery, isExtendedMode]);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(
    (modelId: string) => {
      toggleFavoriteModel(modelId);
    },
    [toggleFavoriteModel]
  );

  const model = useMemo(
    () => MODELS_OPTIONS.find((option) => option.id === selectedModelId),
    [selectedModelId]
  );

  const provider = useMemo(
    () =>
      PROVIDERS_OPTIONS.find(
        (providerOption) =>
          providerOption.id === (model?.displayProvider || model?.provider)
      ),
    [model]
  );

  const renderModelOption = useCallback(
    (modelOption: EnrichedModel) => {
      const providerOption = modelOption.providerInfo;
      const hasFileUpload = modelOption.featuresMap["file-upload"];
      const hasPdfProcessing = modelOption.featuresMap["pdf-processing"];
      const hasReasoning = modelOption.featuresMap.reasoning;

      const iconWrapperBaseClasses =
        "relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md cursor-help";
      const iconOverlayClasses =
        "absolute inset-0 bg-current opacity-20 dark:opacity-25";
      const iconSizeClasses = "h-4 w-4";

      const visionColorClasses = "text-teal-600 dark:text-teal-400";
      const pdfColorClasses = "text-indigo-600 dark:text-indigo-400";
      const reasoningColorClasses = "text-pink-600 dark:text-pink-400";

      return (
        <DropdownMenuItem
          className={cn(
            "flex items-center justify-between px-3 py-2",
            !modelOption.available &&
              "cursor-not-allowed opacity-50 focus:bg-transparent",
            selectedModelId === modelOption.id && "bg-accent"
          )}
          key={modelOption.id}
          onClick={() => {
            if (modelOption.available) {
              handleSelect(modelOption.id);
            }
          }}
        >
          <div className="flex items-center gap-3">
            {providerOption ? (
              <ProviderIcon className="size-5" provider={providerOption} />
            ) : null}
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm">
                {getDisplayName(modelOption.name, modelOption.subName)}
              </span>
              {modelOption.apiKeyUsage.userKeyOnly ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <KeyIcon className="size-3 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Requires API Key</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                  <div className={cn(iconWrapperBaseClasses, pdfColorClasses)}>
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
          </div>
        </DropdownMenuItem>
      );
    },
    [selectedModelId, handleSelect, getDisplayName]
  );

  return (
    <DropdownMenu modal={false} onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn("justify-between", isMobile && "py-3", className)}
          variant="outline"
        >
          <div className="flex items-center gap-2">
            {provider ? (
              <ProviderIcon className="size-5" provider={provider} />
            ) : null}
            {isMobile ? (
              <div className="flex flex-col items-start">
                <span className="text-sm leading-tight">
                  {model?.name ?? "Select Model"}
                </span>
                {model?.subName ? (
                  <span className="text-muted-foreground text-xs leading-tight">
                    {model.subName}
                  </span>
                ) : null}
              </div>
            ) : (
              <span>
                {model
                  ? getDisplayName(model.name, model.subName)
                  : "Select Model"}
              </span>
            )}
          </div>
          <CaretDownIcon className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          "model-selector-theme relative flex max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-lg border border-sidebar-border/60 bg-[#030918] p-0 text-foreground shadow-lg transition-[height,width] ease-snappy max-sm:mx-4 sm:max-h-[54vh] sm:rounded-lg",
          isExtended ? "sm:w-[560px]" : "sm:w-[380px]"
        )}
        collisionPadding={16}
        side="top"
        sideOffset={4}
      >
        {/* Fixed Search Header */}
        <ModelSelectorSearchHeader
          onChange={setSearchQuery}
          value={searchQuery}
        />

        {/* Scrollable Content */}
        <div className="scrollbar-model-selector scrollbar-gutter-both flex-1 overflow-y-auto px-3 py-3">
          {isExtended ? (
            <div className="flex w-full flex-wrap justify-start gap-3 pt-2.5 pb-4">
              {/* Favorites Section */}
              {favoritesModels.length > 0 && (
                <>
                  <div className="-mb-2 flex w-full select-none items-center justify-start gap-1.5 text-color-heading">
                    <PushPinSimpleIcon className="mt-px size-4" />
                    Favorites
                  </div>
                  {favoritesModels.map((modelOption) => (
                    <ModelCard
                      isDisabled={!modelOption.available}
                      isFavorite={true}
                      isLastFavorite={favoritesModels.length === 1}
                      isSelected={selectedModelId === modelOption.id}
                      key={modelOption.id}
                      model={modelOption}
                      onSelect={handleSelect}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </>
              )}

              {/* Others Section */}
              {othersModels.length > 0 && (
                <>
                  <div className="mt-1 -mb-2 w-full select-none text-color-heading">
                    Others
                  </div>
                  {othersModels.map((modelOption) => (
                    <ModelCard
                      isDisabled={!modelOption.available}
                      isFavorite={false}
                      isLastFavorite={false}
                      isSelected={selectedModelId === modelOption.id}
                      key={modelOption.id}
                      model={modelOption}
                      onSelect={handleSelect}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </>
              )}

              {/* Disabled Section */}
              {disabledModels.length > 0 && (
                <>
                  <div className="mt-1 -mb-2 flex w-full select-none items-center justify-start gap-1.5 text-color-heading">
                    <EyeSlashIcon className="mt-px size-4" />
                    Disabled
                  </div>
                  {disabledModels.map((modelOption) => (
                    <ModelCard
                      isDisabled={true}
                      isFavorite={false}
                      isLastFavorite={false}
                      isSelected={selectedModelId === modelOption.id}
                      key={modelOption.id}
                      model={modelOption}
                      onSelect={handleSelect}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            normalModeModels.map((modelOption) =>
              renderModelOption(modelOption)
            )
          )}
        </div>

        {/* Fixed Footer */}
        <ModelSelectorFooter
          isExtended={isExtended}
          onToggleMode={handleToggleMode}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
