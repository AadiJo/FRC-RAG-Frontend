"use client";

import { Bot, Github, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo } from "react";
import { HistoryTrigger } from "@/app/components/history/history-trigger";
import { DialogShare } from "@/app/components/layout/dialog-share";
import { UserMenu } from "@/app/components/layout/user-menu";
import { useBreakpoint } from "@/app/hooks/use-breakpoint";
import { useSidebar } from "@/app/providers/sidebar-provider";
import { useUser } from "@/app/providers/user-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GITHUB_REPO_URL } from "@/lib/config";
import { cn } from "@/lib/utils";

export const Header = memo(function HeaderComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { isSidebarOpen } = useSidebar();
  const isLoggedIn = Boolean(user) && !user?.isAnonymous;
  const isMobile = useBreakpoint(768);

  const showNewChatButton = isMobile && pathname !== "/chat";

  return (
    <header
      className={cn(
        "fixed top-4 right-0 left-0 z-50 px-4 transition-[left] duration-300 ease-out",
        isSidebarOpen ? "md:left-72" : "md:left-0"
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 shadow-lg backdrop-blur-xl">
        {/* Logo on mobile */}
        <div className="flex items-center md:hidden">
          <Link
            className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-white/5"
            href="/"
            prefetch
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-500/20">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-white">FRC RAG</span>
          </Link>
        </div>

        {/* Left side - Home link on desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            className="flex items-center justify-center gap-2 rounded-lg p-2 transition-colors hover:bg-white/5"
            href="/"
          >
            <Bot className="h-4 w-4 text-white/60" />
          </Link>
        </div>

        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            {/* Mobile button for new chat */}
            {showNewChatButton ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="New Chat"
                    className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                    onClick={() => router.push("/chat")}
                    type="button"
                  >
                    <Plus className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>New Chat</TooltipContent>
              </Tooltip>
            ) : null}
            {/* Mobile: Share first, then History for better UX */}
            {isMobile ? (
              <>
                <DialogShare />
                <HistoryTrigger />
              </>
            ) : null}
            {/* Desktop: History first (hidden), then Share to avoid gap */}
            {!isMobile && (
              <>
                <HistoryTrigger />
                <DialogShare />
              </>
            )}
            {isMobile && user ? <UserMenu user={user} /> : null}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  aria-label="View on GitHub"
                  className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                  href={GITHUB_REPO_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Github aria-hidden="true" className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>View on GitHub</TooltipContent>
            </Tooltip>
            {/* Info button removed from top bar per design request */}
            <Link
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              href="/auth"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
});
