import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { MODEL_DEFAULT } from "../lib/config";
import { ERROR_CODES } from "../lib/error-codes";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { RATE_LIMITS } from "./lib/rateLimitConstants";
import { rateLimiter } from "./rateLimiter";
import { User } from "./schema/user";

export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      ...User.fields,
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

// TODO: Premium status removed - always returns false for now
// Will be replaced with API key-based tier system
export const userHasPremium = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }
    // Premium is disabled - return false
    return false;
  },
});

export const updateUserProfile = mutation({
  args: {
    updates: v.object({
      preferredModel: v.optional(v.string()),
      preferredName: v.optional(v.string()),
      occupation: v.optional(v.string()),
      traits: v.optional(v.string()),
      about: v.optional(v.string()),
      disabledModels: v.optional(v.array(v.string())),
      favoriteModels: v.optional(v.array(v.string())),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    await ctx.db.patch(userId, { ...updates });

    return null;
  },
});

export const toggleFavoriteModel = mutation({
  args: { modelId: v.string() },
  returns: v.null(),
  handler: async (ctx, { modelId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError(ERROR_CODES.USER_NOT_FOUND);
    }

    const currentFavorites = user.favoriteModels ?? [];
    const currentDisabled = user.disabledModels ?? [];
    const isFavorite = currentFavorites.includes(modelId);

    let newFavorites: string[];
    let newDisabled: string[];

    if (isFavorite) {
      if (currentFavorites.length <= 1) {
        return null;
      }
      newFavorites = currentFavorites.filter((id) => id !== modelId);
      newDisabled = currentDisabled;
    } else {
      newFavorites = [...new Set([...currentFavorites, modelId])];
      newDisabled = currentDisabled.filter((id) => id !== modelId);
    }

    await ctx.db.patch(userId, {
      favoriteModels: newFavorites,
      disabledModels: newDisabled,
    });

    return null;
  },
});

export const setModelEnabled = mutation({
  args: { modelId: v.string(), enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { modelId, enabled }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError(ERROR_CODES.USER_NOT_FOUND);
    }

    if (!enabled && modelId === MODEL_DEFAULT) {
      return null;
    }

    const currentFavorites = user.favoriteModels ?? [];
    const currentDisabled = user.disabledModels ?? [];
    const isCurrentlyDisabled = currentDisabled.includes(modelId);

    let newFavorites = currentFavorites;
    let newDisabled: string[];

    if (enabled) {
      newDisabled = currentDisabled.filter((id) => id !== modelId);
    } else {
      newDisabled = isCurrentlyDisabled
        ? currentDisabled
        : [...new Set([...currentDisabled, modelId])];
      newFavorites = currentFavorites.filter((id) => id !== modelId);

      if (newFavorites.length === 0 && currentFavorites.length > 0) {
        const firstFavorite = currentFavorites[0];
        newFavorites = [firstFavorite];
        newDisabled = newDisabled.filter((id) => id !== firstFavorite);
      }
    }

    await ctx.db.patch(userId, {
      favoriteModels: newFavorites,
      disabledModels: newDisabled,
    });

    return null;
  },
});

export const bulkSetModelsDisabled = mutation({
  args: { modelIds: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, { modelIds }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError(ERROR_CODES.USER_NOT_FOUND);
    }

    const currentFavorites = user.favoriteModels ?? [];
    const currentDisabled = user.disabledModels ?? [];

    const modelsToDisable = modelIds.filter((id) => id !== MODEL_DEFAULT);

    let newFavorites: string[];
    let newDisabled: string[];

    if (modelsToDisable.length === 0) {
      newDisabled = [];
      newFavorites = currentFavorites;
    } else {
      newFavorites = currentFavorites.filter(
        (id) => !modelsToDisable.includes(id)
      );
      newDisabled = [...new Set([...currentDisabled, ...modelsToDisable])];

      if (newFavorites.length === 0 && currentFavorites.length > 0) {
        const firstFavorite = currentFavorites[0];
        newFavorites = [firstFavorite];
        newDisabled = newDisabled.filter((id) => id !== firstFavorite);
      }
    }

    await ctx.db.patch(userId, {
      favoriteModels: newFavorites,
      disabledModels: newDisabled,
    });

    return null;
  },
});

export const bulkSetFavoriteModels = mutation({
  args: { modelIds: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, { modelIds }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError(ERROR_CODES.USER_NOT_FOUND);
    }

    if (modelIds.length === 0) {
      throw new ConvexError(ERROR_CODES.MISSING_REQUIRED_FIELD);
    }

    const currentDisabled = user.disabledModels ?? [];

    const newFavorites = [...new Set(modelIds)];
    const newDisabled = currentDisabled.filter(
      (id) => !newFavorites.includes(id)
    );

    await ctx.db.patch(userId, {
      favoriteModels: newFavorites,
      disabledModels: newDisabled,
    });

    return null;
  },
});

export const incrementMessageCount = mutation({
  args: {
    usesPremiumCredits: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, { usesPremiumCredits: _usesPremiumCredits }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError(ERROR_CODES.USER_NOT_FOUND);
    }

    // Premium disabled - all users use standard credits
    const isPremium = false;
    const isAnonymous = user.isAnonymous ?? false;

    // CONSUME daily limits for non-premium users
    if (!isPremium) {
      const dailyLimitName = isAnonymous
        ? "anonymousDaily"
        : "authenticatedDaily";

      const today = new Date().toISOString().split("T")[0];
      await rateLimiter.limit(ctx, dailyLimitName, {
        key: `${userId}-${today}`,
        throws: true,
      });
    }

    return null;
  },
});

export const assertNotOverLimit = mutation({
  args: {
    usesPremiumCredits: v.optional(v.boolean()),
  },
  handler: async (ctx, { usesPremiumCredits: _usesPremiumCredits }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError(ERROR_CODES.USER_NOT_FOUND);
    }

    // Premium disabled - all users use standard credits
    const isPremium = false;
    const isAnonymous = user.isAnonymous ?? false;

    // CHECK daily limits for non-premium users
    if (!isPremium) {
      const dailyLimitName = isAnonymous
        ? "anonymousDaily"
        : "authenticatedDaily";

      const today = new Date().toISOString().split("T")[0];
      const dailyStatus = await rateLimiter.check(ctx, dailyLimitName, {
        key: `${userId}-${today}`,
      });

      if (!dailyStatus.ok) {
        throw new ConvexError(ERROR_CODES.DAILY_LIMIT_REACHED);
      }
    }
  },
});

export const getRateLimitStatus = query({
  args: {},
  returns: v.object({
    isPremium: v.boolean(),
    dailyCount: v.number(),
    dailyLimit: v.number(),
    dailyRemaining: v.number(),
    monthlyCount: v.number(),
    monthlyLimit: v.number(),
    monthlyRemaining: v.number(),
    premiumCount: v.number(),
    premiumLimit: v.number(),
    premiumRemaining: v.number(),
    effectiveRemaining: v.number(),
    dailyReset: v.optional(v.number()),
    monthlyReset: v.optional(v.number()),
    premiumReset: v.optional(v.number()),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        isPremium: false,
        dailyCount: 0,
        dailyLimit: 0,
        dailyRemaining: 0,
        monthlyCount: 0,
        monthlyLimit: 0,
        monthlyRemaining: 0,
        premiumCount: 0,
        premiumLimit: 0,
        premiumRemaining: 0,
        effectiveRemaining: 0,
      };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError(ERROR_CODES.USER_NOT_FOUND);
    }

    // Premium disabled
    const isPremium = false;
    const isAnonymous = user.isAnonymous ?? false;

    const dailyLimitName = isAnonymous
      ? "anonymousDaily"
      : "authenticatedDaily";

    const today = new Date().toISOString().split("T")[0];
    const [dailyStatus, dailyConfig] = await Promise.all([
      rateLimiter.check(ctx, dailyLimitName, { key: `${userId}-${today}` }),
      rateLimiter.getValue(ctx, dailyLimitName, { key: `${userId}-${today}` }),
    ]);

    // Process daily limits
    let dailyLimit = 0;
    let dailyCount = 0;
    let dailyRemaining = 0;
    let dailyReset: number | undefined;

    if (dailyStatus && dailyConfig) {
      dailyLimit = isAnonymous
        ? RATE_LIMITS.ANONYMOUS_DAILY
        : RATE_LIMITS.AUTHENTICATED_DAILY;
      dailyCount = dailyLimit - (dailyStatus.ok ? dailyConfig.value : 0);
      dailyRemaining = dailyStatus.ok ? dailyConfig.value : 0;

      // Calculate next midnight UTC for reset
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(now.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      dailyReset = tomorrow.getTime();
    }

    // Monthly limits removed
    const monthlyLimit = 0;
    const monthlyCount = 0;
    const monthlyRemaining = 0;

    const effectiveRemaining = dailyRemaining;

    return {
      isPremium,
      dailyCount,
      dailyLimit,
      dailyRemaining,
      monthlyCount,
      monthlyLimit,
      monthlyRemaining,
      premiumCount: 0,
      premiumLimit: 0,
      premiumRemaining: 0,
      effectiveRemaining,
      dailyReset,
      monthlyReset: undefined,
      premiumReset: undefined,
    };
  },
});

// Delete account and all associated data
export const deleteAccount = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const [
      attachments,
      messages,
      chats,
      feedback,
      usage,
      authAccounts,
      authSessions,
    ] = await Promise.all([
      ctx.db
        .query("chat_attachments")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("messages")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("chats")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("feedback")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("usage_history")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    const deletionPromises: Promise<unknown>[] = [];

    // Delete attachments (R2 storage removed - just delete DB records)
    // TODO: Add VPS file deletion when implemented
    deletionPromises.push(...attachments.map((att) => ctx.db.delete(att._id)));

    deletionPromises.push(...messages.map((msg) => ctx.db.delete(msg._id)));
    deletionPromises.push(...chats.map((chat) => ctx.db.delete(chat._id)));
    deletionPromises.push(...feedback.map((f) => ctx.db.delete(f._id)));
    deletionPromises.push(...usage.map((u) => ctx.db.delete(u._id)));

    deletionPromises.push(
      ...authAccounts.map((acc) => ctx.db.delete(acc._id as Id<"authAccounts">))
    );
    deletionPromises.push(
      ...authSessions.map((sess) =>
        ctx.db.delete(sess._id as Id<"authSessions">)
      )
    );

    await Promise.allSettled(deletionPromises);

    await ctx.db.delete(userId);
    return null;
  },
});

// React hook API functions for rate limiting
export const { getRateLimit: getRateLimitHook, getServerTime } =
  rateLimiter.hookAPI("authenticatedDaily", {
    key: async (ctx) => {
      type AuthContext = Parameters<typeof getAuthUserId>[0];
      const userId = await getAuthUserId(ctx as AuthContext);
      const today = new Date().toISOString().split("T")[0];
      return `${userId || "anonymous"}-${today}`;
    },
  });

// Internal query to get user by ID
export const getUser = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      ...User.fields,
    })
  ),
  handler: async (ctx, args) => await ctx.db.get(args.userId),
});

// Internal mutation to check rate limits
export const assertNotOverLimitInternal = internalMutation({
  args: {
    userId: v.id("users"),
    usesPremiumCredits: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, usesPremiumCredits: _usesPremiumCredits }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError(ERROR_CODES.USER_NOT_FOUND);
    }

    const isPremium = false;
    const isAnonymous = user.isAnonymous ?? false;

    if (!isPremium) {
      const dailyLimitName = isAnonymous
        ? "anonymousDaily"
        : "authenticatedDaily";

      const today = new Date().toISOString().split("T")[0];
      const dailyStatus = await rateLimiter.check(ctx, dailyLimitName, {
        key: `${userId}-${today}`,
      });

      if (!dailyStatus.ok) {
        throw new ConvexError(ERROR_CODES.DAILY_LIMIT_REACHED);
      }
    }
  },
});

// Internal mutation to increment message count
export const incrementMessageCountInternal = internalMutation({
  args: {
    userId: v.id("users"),
    usesPremiumCredits: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, { userId, usesPremiumCredits: _usesPremiumCredits }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError(ERROR_CODES.USER_NOT_FOUND);
    }

    const isPremium = false;
    const isAnonymous = user.isAnonymous ?? false;

    if (!isPremium) {
      const dailyLimitName = isAnonymous
        ? "anonymousDaily"
        : "authenticatedDaily";

      const today = new Date().toISOString().split("T")[0];
      await rateLimiter.limit(ctx, dailyLimitName, {
        key: `${userId}-${today}`,
        throws: true,
      });
    }

    return null;
  },
});

// Update all users' preferred model to a new value
export const updateAllUsersPreferredModel = internalMutation({
  args: {
    newPreferredModel: v.string(),
  },
  returns: v.object({
    updatedCount: v.number(),
    totalCount: v.number(),
  }),
  handler: async (ctx, { newPreferredModel }) => {
    const allUsers = await ctx.db.query("users").collect();
    const totalCount = allUsers.length;

    const updatePromises = allUsers.map(async (user) => {
      await ctx.db.patch(user._id, {
        preferredModel: newPreferredModel,
      });
    });

    const results = await Promise.allSettled(updatePromises);
    const updatedCount = results.filter(
      (result) => result.status === "fulfilled"
    ).length;

    return {
      updatedCount,
      totalCount,
    };
  },
});
