import { redirect } from "next/navigation";

// Legacy redirect: /c/[chatId] -> /chat/[chatId]
export default async function LegacyChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  if (!chatId) {
    redirect("/chat");
  }

  // Redirect to the new chat route
  redirect(`/chat/${chatId}`);
}
