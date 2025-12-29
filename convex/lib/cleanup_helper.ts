import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Deletes all messages for a given chat.
 * Returns the deleted message IDs.
 *
 * @example
 * await deleteMessagesForChat(ctx, chatId);
 */
export async function deleteMessagesForChat(
  ctx: MutationCtx,
  chatId: Id<"chats">
): Promise<Id<"messages">[]> {
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_chat_and_created", (q) => q.eq("chatId", chatId))
    .collect();

  const messageIds = messages.map((m) => m._id);

  // Delete all messages in parallel
  await Promise.all(messageIds.map((id) => ctx.db.delete(id)));

  return messageIds;
}

/**
 * Deletes all attachments (files and database records) for a given chat.
 * TODO: R2 storage disabled - only deletes DB records
 *
 * @example
 * await deleteAttachmentsForChat(ctx, chatId);
 */
export async function deleteAttachmentsForChat(
  ctx: MutationCtx,
  chatId: Id<"chats">
): Promise<void> {
  const attachments = await ctx.db
    .query("chat_attachments")
    .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
    .collect();

  // Delete database records only (R2 storage disabled)
  await Promise.all(
    attachments.map(async (attachment) => {
      await ctx.db.delete(attachment._id);
    })
  );
}

/**
 * Removes branch references from all chats that branch from the specified chat.
 * Updates their originalChatId to undefined and timestamps.
 *
 * @example
 * await removeBranchReferences(ctx, originalChatId, userId);
 */
export async function removeBranchReferences(
  ctx: MutationCtx,
  originalChatId: Id<"chats">,
  userId: Id<"users">
): Promise<void> {
  // Find all chats that are branched from this chat
  // This uses .filter() correctly - first narrows by index (by_user), then filters by originalChatId
  // See: https://docs.convex.dev/database/indexes/ - "For all other filtering you can use the .filter method"
  const branchedChats = await ctx.db
    .query("chats")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("originalChatId"), originalChatId))
    .collect();

  // Remove the branch reference from all branched chats in parallel
  await Promise.all(
    branchedChats.map((branchedChat) =>
      ctx.db.patch(branchedChat._id, {
        originalChatId: undefined,
        updatedAt: Date.now(),
      })
    )
  );
}

/**
 * Completely deletes a chat and all its associated data.
 * This includes messages, attachments, and branch references.
 *
 * @example
 * await deleteChatCompletely(ctx, chatId, userId);
 */
export async function deleteChatCompletely(
  ctx: MutationCtx,
  chatId: Id<"chats">,
  userId: Id<"users">
): Promise<void> {
  // Remove branch references first
  await removeBranchReferences(ctx, chatId, userId);

  // Delete messages and attachments in parallel
  await Promise.all([
    deleteMessagesForChat(ctx, chatId),
    deleteAttachmentsForChat(ctx, chatId),
  ]);

  // Finally delete the chat itself
  await ctx.db.delete(chatId);
}

/**
 * Deletes multiple chats and all their associated data in parallel.
 * Efficiently handles bulk deletion operations.
 *
 * @example
 * await deleteMultipleChats(ctx, validChats, userId);
 */
export async function deleteMultipleChats(
  ctx: MutationCtx,
  chats: Doc<"chats">[],
  userId: Id<"users">
): Promise<void> {
  // Handle branch cleanup for all chats in parallel
  await Promise.all(
    chats.map((chat) => removeBranchReferences(ctx, chat._id, userId))
  );

  // Process all chat deletions in parallel
  await Promise.all(
    chats.map(async (chat) => {
      // Delete messages and attachments in parallel for each chat
      await Promise.all([
        deleteMessagesForChat(ctx, chat._id),
        deleteAttachmentsForChat(ctx, chat._id),
      ]);

      // Delete the chat
      await ctx.db.delete(chat._id);
    })
  );
}
