import { v } from "convex/values";

/**
 * User Document - Represents a PDF or text document uploaded by a user
 * The actual embeddings are stored in the backend vector DB, not in Convex
 * This table stores metadata and indexing status
 */
export const UserDocument = v.object({
  // Owner of the document
  userId: v.id("users"),

  // Document identification
  title: v.string(),
  docId: v.string(), // Stable ID used in the backend vector DB

  // Source information
  sourceType: v.union(
    v.literal("gdrive"),
    v.literal("upload"),
    v.literal("manual")
  ),
  sourceUri: v.optional(v.string()), // e.g., Google Drive file ID or URL

  // Google Drive specific metadata
  driveFileId: v.optional(v.string()),
  driveMimeType: v.optional(v.string()),
  driveModifiedTime: v.optional(v.string()), // ISO timestamp from Drive

  // Document stats
  sizeBytes: v.optional(v.number()),
  pageCount: v.optional(v.number()),
  chunkCount: v.optional(v.number()),

  // Indexing status
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("indexed"),
    v.literal("failed"),
    v.literal("deleted")
  ),
  errorCode: v.optional(v.string()),
  errorMessage: v.optional(v.string()),

  // Timestamps
  indexedAt: v.optional(v.number()),
  lastSyncedAt: v.optional(v.number()),
});

/**
 * Drive Connection - Tracks whether a user has connected their Google Drive
 * We use token model (no refresh tokens stored) so this is just state tracking
 */
export const DriveConnection = v.object({
  userId: v.id("users"),

  // Connection status
  isConnected: v.boolean(),
  connectedAt: v.optional(v.number()),
  disconnectedAt: v.optional(v.number()),

  // Granted scopes (for reference, not stored tokens)
  grantedScopes: v.optional(v.array(v.string())),

  // User's email associated with the Drive connection
  driveEmail: v.optional(v.string()),
});
