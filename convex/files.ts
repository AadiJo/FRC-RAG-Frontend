/**
 * File Upload Module
 *
 * TODO: R2 file storage has been disabled for now.
 * This file contains stub implementations to maintain API compatibility.
 * When migrating to VPS storage, replace these stubs with actual implementations.
 *
 * Original R2 implementation used:
 * - @convex-dev/r2 package
 * - Cloudflare R2 storage
 * - generateUploadUrl, syncMetadata, onSyncMetadata from r2.clientApi()
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { sanitizeAndValidateFileName } from "@/lib/filename";
import { ERROR_CODES } from "../lib/error-codes";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";

// TODO: When re-enabling file uploads with VPS storage, uncomment and modify:
// import { R2, type R2Callbacks } from "@convex-dev/r2";
// const r2 = new R2(components.r2);
// const callbacks: R2Callbacks = internal.files;

/**
 * Stub: Generate upload URL
 * TODO: Replace with VPS upload URL generation
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }
    // File uploads are currently disabled
    throw new ConvexError("FILE_UPLOADS_DISABLED");
  },
});

/**
 * Stub: Sync metadata
 * TODO: Replace with VPS metadata sync
 */
export const syncMetadata = mutation({
  args: { key: v.string() },
  handler: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }
    // File uploads are currently disabled
    throw new ConvexError("FILE_UPLOADS_DISABLED");
  },
});

/**
 * Stub: On sync metadata callback
 * TODO: Replace with VPS metadata callback
 */
export const onSyncMetadata = internalMutation({
  args: { key: v.string() },
  handler: async (_ctx, _args) => {
    // File uploads are currently disabled - no-op
  },
});

type SavedAttachment = {
  _id: Id<"chat_attachments">;
  _creationTime: number;
  userId: Id<"users">;
  chatId: Id<"chats">;
  key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url?: string;
};

/**
 * Stub: Save file attachment
 * TODO: Replace with VPS file save logic
 */
export const saveFileAttachment = action({
  args: {
    chatId: v.id("chats"),
    key: v.string(),
    fileName: v.string(),
  },
  handler: async (ctx, _args): Promise<SavedAttachment> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }
    // File uploads are currently disabled
    throw new ConvexError("FILE_UPLOADS_DISABLED");
  },
});

/**
 * Stub: Save generated image
 * TODO: Replace with VPS image save logic (if image generation is re-enabled)
 */
export const saveGeneratedImage = action({
  args: {
    chatId: v.id("chats"),
    key: v.string(),
    url: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, _args): Promise<SavedAttachment> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }
    // File uploads are currently disabled
    throw new ConvexError("FILE_UPLOADS_DISABLED");
  },
});

export const internalSave = internalMutation({
  args: {
    chatId: v.id("chats"),
    key: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const existing = await ctx.db
      .query("chat_attachments")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (!existing || existing.userId !== userId) {
      throw new ConvexError(ERROR_CODES.UNAUTHORIZED);
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new ConvexError(ERROR_CODES.UNAUTHORIZED);
    }

    const safeName = sanitizeAndValidateFileName(args.fileName);

    await ctx.db.patch(existing._id, {
      chatId: args.chatId,
      fileName: safeName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      url: args.url,
    });
    return existing._id;
  },
});

export const internalSaveGenerated = internalMutation({
  args: {
    chatId: v.id("chats"),
    key: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const existing = await ctx.db
      .query("chat_attachments")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (!existing || existing.userId !== userId) {
      throw new ConvexError(ERROR_CODES.UNAUTHORIZED);
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new ConvexError(ERROR_CODES.UNAUTHORIZED);
    }

    const safeName = sanitizeAndValidateFileName(args.fileName);

    await ctx.db.patch(existing._id, {
      chatId: args.chatId,
      fileName: safeName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      isGenerated: true,
      url: args.url,
    });
    return existing._id;
  },
});

export const getAttachment = query({
  args: { attachmentId: v.id("chat_attachments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment || attachment.userId !== userId) {
      throw new ConvexError(ERROR_CODES.UNAUTHORIZED);
    }
    return attachment;
  },
});

export const findAttachmentByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }
    const row = await ctx.db
      .query("chat_attachments")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (!row || row.userId !== userId) {
      return null;
    }
    return row;
  },
});

export const getStorageUrl = query({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }
    // TODO: Replace with VPS URL generation
    return null;
  },
});

export const getAttachmentsForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const attachments = await ctx.db
      .query("chat_attachments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return attachments.map((attachment) => ({
      ...attachment,
      url: attachment.url,
    }));
  },
});

export const deleteAttachments = mutation({
  args: { attachmentIds: v.array(v.id("chat_attachments")) },
  handler: async (ctx, { attachmentIds }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const attachmentIdsToDelete = new Set(attachmentIds);

    const userAttachments = await ctx.db
      .query("chat_attachments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const validAttachments = userAttachments.filter((attachment) =>
      attachmentIdsToDelete.has(attachment._id)
    );

    // TODO: When VPS storage is enabled, also delete files from storage
    // For now, just delete database records
    const docIdsToDelete = validAttachments.map((a) => a._id);
    await Promise.all(docIdsToDelete.map((id) => ctx.db.delete(id)));
  },
});

export const getAttachmentsForChat = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError(ERROR_CODES.NOT_AUTHENTICATED);
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new ConvexError(ERROR_CODES.UNAUTHORIZED);
    }

    const attachments = await ctx.db
      .query("chat_attachments")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .collect();

    return attachments.map((attachment) => ({
      ...attachment,
      url: attachment.url,
    }));
  },
});
