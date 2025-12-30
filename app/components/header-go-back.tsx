"use client";

import { ArrowLeft, SignOut } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/providers/user-provider";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type HeaderGoBackProps = {
  href?: string;
  showControls?: boolean;
  showThemeToggle?: boolean;
};

export function HeaderGoBack({
  href = "/chat",
  showControls = true,
  showThemeToggle = true,
}: HeaderGoBackProps) {
  const { signOut } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/");
      toast({ title: "Logged out", status: "success" });
    } catch (_e) {
      // console.error('Sign out failed:', e);
      toast({ title: "Failed to sign out", status: "error" });
    }
  };

  return (
    <header className="flex items-center justify-between p-4">
      <Link
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-foreground hover:bg-muted"
        href={href}
        prefetch
      >
        <ArrowLeft className="size-5 text-foreground" />
        <span className="ml-2 hidden font-base text-sm sm:inline-block">
          Back to Chat
        </span>
      </Link>
      {showControls ? (
        <div className="flex items-center gap-2">
          {/* Theme is forced to dark only; toggle removed intentionally. */}
          <Button
            className="flex items-center gap-1 px-2"
            onClick={handleSignOut}
            size="sm"
            variant="ghost"
          >
            <SignOut className="size-5" />
            <span className="text-sm">Log out</span>
          </Button>
        </div>
      ) : null}
    </header>
  );
}
