"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery as useTanStackQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { createContext, useCallback, useContext, useMemo } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export type UserProfile = Doc<"users">;

export type ApiKey = {
  _id: Id<"user_api_keys">;
  provider: string;
  mode?: "priority" | "fallback";
  messageCount?: number;
  createdAt?: number;
  updatedAt?: number;
};

type UserContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  // Rate limit status
  rateLimitStatus:
    | {
        isPremium: boolean;
        dailyCount: number;
        dailyLimit: number;
        dailyRemaining: number;
        monthlyCount: number;
        monthlyLimit: number;
        monthlyRemaining: number;
        premiumCount: number;
        premiumLimit: number;
        premiumRemaining: number;
        effectiveRemaining: number;
        dailyReset?: number;
        monthlyReset?: number;
        premiumReset?: number;
      }
    | undefined;
  // API Keys
  apiKeys: ApiKey[];
  hasApiKey: Map<string, boolean>;
  hasGroq: boolean;
  hasOpenRouter: boolean;
  isApiKeysLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
}: {
  children: React.ReactNode;
  initialUser?: null;
}) {
  const { signIn, signOut } = useAuthActions();
  const { data: user = null, isLoading: isUserLoading } = useTanStackQuery({
    ...convexQuery(api.users.getCurrentUser, {}),
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: rateLimitStatus, isLoading: isRateLimitLoading } =
    useTanStackQuery({
      ...convexQuery(api.users.getRateLimitStatus, {}),
      enabled: Boolean(user),
      gcTime: 5 * 60 * 1000, // 5 minutes
    });

  const { data: apiKeysQuery, isLoading: isApiKeysLoading } = useTanStackQuery({
    ...convexQuery(api.api_keys.getApiKeys, {}),
    enabled: Boolean(user) && !user?.isAnonymous,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const updateUserProfile = useMutation(api.users.updateUserProfile);

  const signInGoogle = useCallback(async () => {
    await signIn("google", { redirectTo: "/chat" });
  }, [signIn]);

  const updateUser = useCallback(
    async (updates: Partial<UserProfile>) => {
      await updateUserProfile({ updates });
    },
    [updateUserProfile]
  );

  // Process API keys data
  const apiKeys = useMemo(
    () => (apiKeysQuery ?? []) as ApiKey[],
    [apiKeysQuery]
  );

  const hasApiKey = useMemo(() => {
    const keyMap = new Map<string, boolean>();
    for (const key of apiKeys) {
      keyMap.set(key.provider, true);
    }
    return keyMap;
  }, [apiKeys]);

  const hasGroq = hasApiKey.get("groq") ?? false;
  const hasOpenRouter = hasApiKey.get("openrouter") ?? false;

  // Combined loading state
  const combinedLoading = Boolean(
    isUserLoading ||
      (user && !user.isAnonymous && (isRateLimitLoading || isApiKeysLoading))
  );

  const contextValue = useMemo(
    () => ({
      user,
      isLoading: combinedLoading,
      signInGoogle,
      signOut,
      updateUser,
      rateLimitStatus: rateLimitStatus as
        | {
            isPremium: boolean;
            dailyCount: number;
            dailyLimit: number;
            dailyRemaining: number;
            monthlyCount: number;
            monthlyLimit: number;
            monthlyRemaining: number;
            premiumCount: number;
            premiumLimit: number;
            premiumRemaining: number;
            effectiveRemaining: number;
            dailyReset?: number;
            monthlyReset?: number;
            premiumReset?: number;
          }
        | undefined,
      // API Keys
      apiKeys,
      hasApiKey,
      hasGroq,
      hasOpenRouter,
      isApiKeysLoading,
    }),
    [
      user,
      combinedLoading,
      signInGoogle,
      signOut,
      updateUser,
      rateLimitStatus,
      apiKeys,
      hasApiKey,
      hasGroq,
      hasOpenRouter,
      isApiKeysLoading,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
