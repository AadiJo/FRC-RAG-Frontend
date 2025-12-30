"use client";

import { useMemo } from "react";
import {
  FREE_TIER_MODELS,
  MODELS_OPTIONS,
  PROVIDERS_OPTIONS,
} from "@/lib/config";
import { useUser } from "../providers/user-provider";
import { useModelPreferences } from "./use-model-preferences";

export type EnrichedModel = {
  id: string;
  name: string;
  subName?: string;
  provider: string;
  premium: boolean;
  usesPremiumCredits: boolean;
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
  // Enriched properties
  providerInfo: (typeof PROVIDERS_OPTIONS)[0] | undefined;
  available: boolean;
  featuresMap: Record<string, boolean>;
};

// Set of free tier model IDs for O(1) lookup
const FREE_TIER_MODELS_SET = new Set<string>(FREE_TIER_MODELS);

export function useEnrichedModels() {
  const { apiKeys } = useUser();
  const { favoriteModelsSet } = useModelPreferences();

  // Transform API keys array to Map for O(1) lookups
  const apiKeysMap = useMemo(
    () => new Map(apiKeys.map((key) => [key.provider, true])),
    [apiKeys]
  );

  // Check if user has any API keys at all
  const hasAnyApiKey = apiKeysMap.size > 0;

  const enrichedModels = useMemo(() => {
    return MODELS_OPTIONS.map((model): EnrichedModel => {
      // Determine the API key provider for this model
      // All models route through either 'groq' or 'openrouter' provider
      const isGroqModel = model.provider === "groq";
      const apiKeyProvider = isGroqModel ? "groq" : "openrouter";
      const userHasProviderKey = apiKeysMap.has(apiKeyProvider);

      // Check if model requires user key only
      const requiresKey = model.apiKeyUsage?.userKeyOnly ?? false;

      // Determine availability:
      // 1. Free tier models (3 guest models) are always available - they use server credentials
      // 2. All other models require the user to have the correct provider's API key
      let available: boolean;
      if (FREE_TIER_MODELS_SET.has(model.id)) {
        // Free tier models are always available (use server credentials)
        available = true;
      } else if (requiresKey) {
        // Model requires user key - check if they have the right provider key
        available = userHasProviderKey;
      } else {
        // All non-free-tier models require the correct provider's API key
        available = userHasProviderKey;
      }

      // Pre-compute features map for O(1) feature lookups
      const featuresMap = model.features.reduce(
        (acc, feature) => {
          acc[feature.id] = feature.enabled;
          return acc;
        },
        {} as Record<string, boolean>
      );

      // Find provider info once - use displayProvider for UI, fallback to provider
      const modelWithDisplayProvider = model as typeof model & {
        displayProvider?: string;
      };
      const providerInfo = PROVIDERS_OPTIONS.find(
        (p) =>
          p.id === (modelWithDisplayProvider.displayProvider || model.provider)
      );

      return {
        ...model,
        providerInfo,
        available,
        featuresMap,
      };
    });
  }, [apiKeysMap, hasAnyApiKey]);

  // Separate models by category for efficient filtering
  const categorizedModels = useMemo(() => {
    const favorites: EnrichedModel[] = [];
    const others: EnrichedModel[] = [];
    const available: EnrichedModel[] = [];
    const unavailable: EnrichedModel[] = [];

    for (const model of enrichedModels) {
      // Categorize by favorite status
      if (favoriteModelsSet.has(model.id)) {
        favorites.push(model);
      } else {
        others.push(model);
      }

      // Categorize by availability
      if (model.available) {
        available.push(model);
      } else {
        unavailable.push(model);
      }
    }

    // Sort by availability (available first)
    const sortByAvailability = (a: EnrichedModel, b: EnrichedModel) => {
      if (a.available === b.available) {
        return 0;
      }
      return a.available ? -1 : 1;
    };

    return {
      all: enrichedModels,
      favorites: favorites.sort(sortByAvailability),
      others: others.sort(sortByAvailability),
      available,
      unavailable,
    };
  }, [enrichedModels, favoriteModelsSet]);

  // Feature map for efficient feature-based filtering
  const featureMap = useMemo(() => {
    const map = new Map<string, EnrichedModel[]>();

    for (const model of enrichedModels) {
      for (const [featureId, enabled] of Object.entries(model.featuresMap)) {
        if (enabled) {
          if (!map.has(featureId)) {
            map.set(featureId, []);
          }
          const featureList = map.get(featureId);
          if (featureList) {
            featureList.push(model);
          }
        }
      }
    }

    return map;
  }, [enrichedModels]);

  return {
    enrichedModels,
    categorizedModels,
    featureMap,
    apiKeysMap,
    hasAnyApiKey,
  };
}
