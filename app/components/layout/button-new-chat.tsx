"use client";

import { NotePencil } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ButtonNewChat() {
  const pathname = usePathname();
  if (pathname === "/chat") {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/70 backdrop-blur-xl transition-colors hover:bg-white/[0.07] hover:text-white"
          href="/chat"
          prefetch
        >
          <NotePencil size={24} />
        </Link>
      </TooltipTrigger>
      <TooltipContent>New Chat</TooltipContent>
    </Tooltip>
  );
}
