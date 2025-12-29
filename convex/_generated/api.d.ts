/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as api_keys from "../api_keys.js";
import type * as auth from "../auth.js";
import type * as chats from "../chats.js";
import type * as email from "../email.js";
import type * as feedback from "../feedback.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as import_export from "../import_export.js";
import type * as lib_auth_helper from "../lib/auth_helper.js";
import type * as lib_cleanup_helper from "../lib/cleanup_helper.js";
import type * as lib_rateLimitConstants from "../lib/rateLimitConstants.js";
import type * as lib_sanitization_helper from "../lib/sanitization_helper.js";
import type * as messages from "../messages.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as schema_chat from "../schema/chat.js";
import type * as schema_chat_attachment from "../schema/chat_attachment.js";
import type * as schema_feedback from "../schema/feedback.js";
import type * as schema_message from "../schema/message.js";
import type * as schema_usage_history from "../schema/usage_history.js";
import type * as schema_user from "../schema/user.js";
import type * as schema_user_api_key from "../schema/user_api_key.js";
import type * as schema_user_document from "../schema/user_document.js";
import type * as user_documents from "../user_documents.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  api_keys: typeof api_keys;
  auth: typeof auth;
  chats: typeof chats;
  email: typeof email;
  feedback: typeof feedback;
  files: typeof files;
  http: typeof http;
  import_export: typeof import_export;
  "lib/auth_helper": typeof lib_auth_helper;
  "lib/cleanup_helper": typeof lib_cleanup_helper;
  "lib/rateLimitConstants": typeof lib_rateLimitConstants;
  "lib/sanitization_helper": typeof lib_sanitization_helper;
  messages: typeof messages;
  rateLimiter: typeof rateLimiter;
  "schema/chat": typeof schema_chat;
  "schema/chat_attachment": typeof schema_chat_attachment;
  "schema/feedback": typeof schema_feedback;
  "schema/message": typeof schema_message;
  "schema/usage_history": typeof schema_usage_history;
  "schema/user": typeof schema_user;
  "schema/user_api_key": typeof schema_user_api_key;
  "schema/user_document": typeof schema_user_document;
  user_documents: typeof user_documents;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
};
