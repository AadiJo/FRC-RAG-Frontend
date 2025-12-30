import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { ERROR_CODES } from "../lib/error-codes";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// ============================================================================
// Drive Connection Queries & Mutations
// ============================================================================

/**
 * Get the current user's Drive connection status
 */
export const getDriveConnection = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("drive_connections"),
      _creationTime: v.number(),
      userId: v.id("users"),
      isConnected: v.boolean(),
      connectedAt: v.optional(v.number()),
      disconnectedAt: v.optional(v.number()),
      grantedScopes: v.optional(v.array(v.string())),
      driveEmail: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const connection = await ctx.db
      .query("drive_connections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return connection;
  },
});

/**
 * Connect user's Google Drive (called after successful OAuth)
 */
export const connectDrive = mutation({
  args: {
    driveEmail: v.optional(v.string()),
    grantedScopes: v.optional(v.array(v.string())),
  },
  returns: v.id("drive_connections"),
  handler: async (ctx, { driveEmail, grantedScopes }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: ERROR_CODES.AUTHENTICATION_REQUIRED,
        message: "Authentication required",
      });
    }

    // Check for existing connection
    const existing = await ctx.db
      .query("drive_connections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        isConnected: true,
        connectedAt: Date.now(),
        disconnectedAt: undefined,
        grantedScopes,
        driveEmail,
      });
      return existing._id;
    }

    // Create new connection
    const connectionId = await ctx.db.insert("drive_connections", {
      userId,
      isConnected: true,
      connectedAt: Date.now(),
      grantedScopes,
      driveEmail,
    });

    return connectionId;
  },
});

/**
 * Disconnect user's Google Drive
 */
export const disconnectDrive = mutation({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: ERROR_CODES.AUTHENTICATION_REQUIRED,
        message: "Authentication required",
      });
    }

    const connection = await ctx.db
      .query("drive_connections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!connection) {
      return false;
    }

    await ctx.db.patch(connection._id, {
      isConnected: false,
      disconnectedAt: Date.now(),
    });

    return true;
  },
});

// ============================================================================
// User Document Queries & Mutations
// ============================================================================

/**
 * List all user documents for the current user
 */
export const listUserDocuments = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("indexed"),
        v.literal("failed"),
        v.literal("deleted")
      )
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("user_documents"),
      _creationTime: v.number(),
      userId: v.id("users"),
      title: v.string(),
      docId: v.string(),
      sourceType: v.union(
        v.literal("gdrive"),
        v.literal("upload"),
        v.literal("manual")
      ),
      sourceUri: v.optional(v.string()),
      driveFileId: v.optional(v.string()),
      driveMimeType: v.optional(v.string()),
      driveModifiedTime: v.optional(v.string()),
      sizeBytes: v.optional(v.number()),
      pageCount: v.optional(v.number()),
      chunkCount: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("indexed"),
        v.literal("failed"),
        v.literal("deleted")
      ),
      errorCode: v.optional(v.string()),
      errorMessage: v.optional(v.string()),
      indexedAt: v.optional(v.number()),
      lastSyncedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, { status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let documents: Doc<"user_documents">[];
    if (status) {
      documents = await ctx.db
        .query("user_documents")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", userId).eq("status", status)
        )
        .collect();
    } else {
      documents = await ctx.db
        .query("user_documents")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    }

    // Filter out deleted documents unless explicitly requested
    if (!status) {
      documents = documents.filter(
        (doc): doc is Doc<"user_documents"> => doc.status !== "deleted"
      );
    }

    return documents;
  },
});

/**
 * Get a single user document by ID
 */
export const getUserDocument = query({
  args: {
    documentId: v.id("user_documents"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("user_documents"),
      _creationTime: v.number(),
      userId: v.id("users"),
      title: v.string(),
      docId: v.string(),
      sourceType: v.union(
        v.literal("gdrive"),
        v.literal("upload"),
        v.literal("manual")
      ),
      sourceUri: v.optional(v.string()),
      driveFileId: v.optional(v.string()),
      driveMimeType: v.optional(v.string()),
      driveModifiedTime: v.optional(v.string()),
      sizeBytes: v.optional(v.number()),
      pageCount: v.optional(v.number()),
      chunkCount: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("indexed"),
        v.literal("failed"),
        v.literal("deleted")
      ),
      errorCode: v.optional(v.string()),
      errorMessage: v.optional(v.string()),
      indexedAt: v.optional(v.number()),
      lastSyncedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, { documentId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const document = await ctx.db.get(documentId);
    if (!document || document.userId !== userId) {
      return null;
    }

    return document;
  },
});

/**
 * Create a new user document record (called before ingestion starts)
 */
export const createUserDocument = mutation({
  args: {
    title: v.string(),
    sourceType: v.union(
      v.literal("gdrive"),
      v.literal("upload"),
      v.literal("manual")
    ),
    sourceUri: v.optional(v.string()),
    driveFileId: v.optional(v.string()),
    driveMimeType: v.optional(v.string()),
    driveModifiedTime: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),
  },
  returns: v.object({
    documentId: v.id("user_documents"),
    docId: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: ERROR_CODES.AUTHENTICATION_REQUIRED,
        message: "Authentication required",
      });
    }

    // Check if document with same driveFileId already exists
    if (args.driveFileId) {
      const existing = await ctx.db
        .query("user_documents")
        .withIndex("by_drive_file", (q) =>
          q.eq("driveFileId", args.driveFileId)
        )
        .first();

      if (existing && existing.userId === userId) {
        // Return existing document for re-indexing
        return {
          documentId: existing._id,
          docId: existing.docId,
        };
      }
    }

    // Generate a stable docId for the backend vector DB
    // Format: user_<userId>_doc_<timestamp>_<random>
    const docId = `user_${userId}_doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const documentId = await ctx.db.insert("user_documents", {
      userId,
      title: args.title,
      docId,
      sourceType: args.sourceType,
      sourceUri: args.sourceUri,
      driveFileId: args.driveFileId,
      driveMimeType: args.driveMimeType,
      driveModifiedTime: args.driveModifiedTime,
      sizeBytes: args.sizeBytes,
      status: "pending",
    });

    return { documentId, docId };
  },
});

/**
 * Update document status after ingestion attempt
 */
export const updateDocumentStatus = mutation({
  args: {
    documentId: v.id("user_documents"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("indexed"),
      v.literal("failed"),
      v.literal("deleted")
    ),
    chunkCount: v.optional(v.number()),
    pageCount: v.optional(v.number()),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: ERROR_CODES.AUTHENTICATION_REQUIRED,
        message: "Authentication required",
      });
    }

    const document = await ctx.db.get(args.documentId);
    if (!document || document.userId !== userId) {
      return false;
    }

    const updates: Record<string, unknown> = {
      status: args.status,
    };

    if (args.status === "indexed") {
      updates.indexedAt = Date.now();
      updates.lastSyncedAt = Date.now();
      updates.errorCode = undefined;
      updates.errorMessage = undefined;
    }

    if (args.chunkCount !== undefined) {
      updates.chunkCount = args.chunkCount;
    }

    if (args.pageCount !== undefined) {
      updates.pageCount = args.pageCount;
    }

    if (args.errorCode !== undefined) {
      updates.errorCode = args.errorCode;
    }

    if (args.errorMessage !== undefined) {
      updates.errorMessage = args.errorMessage;
    }

    await ctx.db.patch(args.documentId, updates);
    return true;
  },
});

/**
 * Delete a user document (marks as deleted and triggers backend cleanup)
 */
export const deleteUserDocument = mutation({
  args: {
    documentId: v.id("user_documents"),
  },
  returns: v.object({
    success: v.boolean(),
    docId: v.optional(v.string()),
  }),
  handler: async (ctx, { documentId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: ERROR_CODES.AUTHENTICATION_REQUIRED,
        message: "Authentication required",
      });
    }

    const document = await ctx.db.get(documentId);
    if (!document || document.userId !== userId) {
      return { success: false };
    }

    // Store docId before deletion for backend cleanup
    const { docId } = document;

    // Actually delete the document from the database
    // The API route handles backend vector deletion before calling this mutation
    await ctx.db.delete(documentId);

    return { success: true, docId };
  },
});

/**
 * Get user ID for backend requests (internal use)
 * Returns the stable user ID that should be passed to the RAG backend
 */
export const getUserIdForBackend = query({
  args: {},
  returns: v.union(v.null(), v.string()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    // Return the Convex user ID as the stable identifier
    return userId;
  },
});
