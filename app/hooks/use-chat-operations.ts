/**
 * Chat Operations Hook
 * Manages chat creation, updates, branching, and deletion operations
 */

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "@/components/ui/toast";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { processBranchError } from "@/lib/chat-error-utils";

export function useChatOperations() {
  const router = useRouter();
  const [isBranching, setIsBranching] = useState(false);

  const createChat = useMutation(api.chats.createChat);
  const updateChatModel = useMutation(api.chats.updateChatModel);
  const branchChat = useMutation(api.chats.branchChat);
  const deleteMessage = useMutation(api.messages.deleteMessageAndDescendants);

  // Generate a concise subject-based chat title from the user's input.
  // This uses a lightweight heuristic to remove common conversational
  // prefixes ("tell me about", "how to", etc.) and extract the
  // main noun phrase. Keep titles short (<=50 chars).
  function generateTitleFromInput(input: string): string {
    const trimmed = (input || "").trim();
    if (!trimmed) return "New Chat";

    // Remove common leading conversational phrases
    const cleaned = trimmed
      .replace(
        /^(please\s+|hey\s+|hi\s+|could you\s+|can you\s+|i(?:'d| would)? like to\s+|i want to\s+|please\s+)/i,
        ""
      )
      .replace(
        /^(tell me(?: about| how to)?\s+|explain(?: to me)?\s+|how to\s+|what is\s+|what's\s+|give me\s+|summarize(?: this)?\s+|show me\s+|find\s+|search for\s+|help me\s+)/i,
        ""
      )
      .trim();

    // Prefer the clause before punctuation or commas
    let title = cleaned.split(/[?.!;,-]\s/)[0].trim();
    if (!title) title = trimmed;

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Truncate to 50 chars
    if (title.length > 50) {
      title = title.slice(0, 47).trim() + "...";
    }

    return title || "New Chat";
  }

  const handleCreateChat = useCallback(
    async (inputText: string, model: string, personaId?: string) => {
      try {
        const generatedTitle = generateTitleFromInput(inputText).substring(
          0,
          50
        );
        const result = await createChat({
          title: generatedTitle,
          model,
          personaId,
        });
        return result.chatId;
      } catch {
        toast({ title: "Failed to create new chat.", status: "error" });
        return null;
      }
    },
    [createChat]
  );

  const handleModelChange = useCallback(
    async (
      chatId: string | null,
      model: string,
      _user: Doc<"users"> | null
    ) => {
      if (!chatId) {
        // For new chats, this will be handled by temporary state
        return true;
      }

      try {
        await updateChatModel({ chatId: chatId as Id<"chats">, model });
        return true;
      } catch {
        toast({ title: "Failed to update chat model", status: "error" });
        return false;
      }
    },
    [updateChatModel]
  );

  const handleBranch = useCallback(
    async (chatId: string, messageId: string, user: Doc<"users"> | null) => {
      if (!(chatId && user?._id)) {
        toast({
          title: "Unable to branch chat. Please try again.",
          status: "error",
        });
        return false;
      }

      if (isBranching) {
        return false;
      }

      setIsBranching(true);

      try {
        const result = await branchChat({
          originalChatId: chatId as Id<"chats">,
          branchFromMessageId: messageId as Id<"messages">,
        });

        router.push(`/c/${result.chatId}`);
        toast({
          title: "Chat branched successfully",
          status: "success",
        });
        return true;
      } catch (branchError: unknown) {
        const errorMessage = processBranchError(branchError);
        toast({
          title: errorMessage,
          status: "error",
        });
        return false;
      } finally {
        setIsBranching(false);
      }
    },
    [branchChat, router, isBranching]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const result = await deleteMessage({
          messageId: messageId as Id<"messages">,
        });
        return result;
      } catch {
        toast({ title: "Failed to delete message", status: "error" });
        return null;
      }
    },
    [deleteMessage]
  );

  return {
    handleCreateChat,
    handleModelChange,
    handleBranch,
    handleDeleteMessage,
  };
}
