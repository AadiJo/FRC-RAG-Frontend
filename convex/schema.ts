import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Chat } from "./schema/chat";
import { ChatAttachment } from "./schema/chat_attachment";
import { Feedback } from "./schema/feedback";
import { Message } from "./schema/message";
import { UsageHistory } from "./schema/usage_history";
// Import all schema modules
import { User } from "./schema/user";
import { UserApiKey } from "./schema/user_api_key";
import { DriveConnection, UserDocument } from "./schema/user_document";

export default defineSchema({
  ...authTables,
  users: defineTable(User).index("email", ["email"]),
  chats: defineTable(Chat).index("by_user", ["userId"]),
  messages: defineTable(Message)
    .index("by_chat_and_created", ["chatId", "createdAt"])
    .index("by_user", ["userId"])
    .searchIndex("by_user_content", {
      searchField: "content",
      filterFields: ["userId", "chatId"],
    }),
  feedback: defineTable(Feedback).index("by_user", ["userId"]),
  chat_attachments: defineTable(ChatAttachment)
    .index("by_chatId", ["chatId"])
    .index("by_userId", ["userId"])
    // Dedicated index for direct lookups/deletes by R2 object key
    .index("by_key", ["key"]),
  usage_history: defineTable(UsageHistory).index("by_user", ["userId"]),
  user_api_keys: defineTable(UserApiKey).index("by_user_provider", [
    "userId",
    "provider",
  ]),
  // User documents (PDFs from Google Drive) - metadata only, vectors stored in backend
  user_documents: defineTable(UserDocument)
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_drive_file", ["driveFileId"])
    .index("by_doc_id", ["docId"]),
  // Google Drive connection state per user
  drive_connections: defineTable(DriveConnection).index("by_user", ["userId"]),
});
