"use client";

import { Eye, EyeSlash, Gear, SignIn, SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useUser } from "@/app/providers/user-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import type { Doc } from "../../../convex/_generated/dataModel";
// import dynamic from "next/dynamic"
// import { APP_NAME } from "../../../lib/config"
import { AppInfoTrigger } from "./app-info/app-info-trigger";

export function UserMenu({
  user,
  trigger,
}: {
  user: Doc<"users">;
  trigger?: React.ReactNode;
}) {
  const { signOut, rateLimitStatus } = useUser();
  const router = useRouter();
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const [isSettingsOpen, setSettingsOpen] = React.useState(false);

  const isAnonymous = Boolean(user?.isAnonymous);

  const [showEmail, setShowEmail] = React.useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return localStorage.getItem("showEmail") === "true";
  });

  const maskEmail = (email?: string) => {
    if (!email) {
      return "";
    }
    const [local, domain] = email.split("@");
    const tld = domain.substring(domain.lastIndexOf("."));
    const prefix = local.slice(0, 2);
    return `${prefix}*****${tld}`;
  };

  const _handleSettingsOpenChange = (isOpen: boolean) => {
    setSettingsOpen(isOpen);
    if (!isOpen) {
      setMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Logged out", status: "success" });
      router.replace("/");
    } catch {
      toast({ title: "Failed to sign out", status: "error" });
    }
  };

  const handleLogin = () => {
    router.push("/auth");
  };

  // Theme selection has been removed from this menu.

  return (
    <DropdownMenu modal={false} onOpenChange={setMenuOpen} open={isMenuOpen}>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <button type="button">
            <Avatar>
              <AvatarImage src={user?.image ?? undefined} />
              <AvatarFallback>
                {user?.name?.charAt(0) ||
                  (user?.email ? user.email.charAt(0) : "")}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="w-56 rounded-lg border border-sidebar-border/60 bg-[#030918] p-1 text-foreground"
        forceMount
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          if (isSettingsOpen) {
            e.preventDefault();
            return;
          }
        }}
        onInteractOutside={(e) => {
          if (isSettingsOpen) {
            e.preventDefault();
            return;
          }
          setMenuOpen(false);
        }}
      >
        <DropdownMenuItem className="flex flex-col items-start gap-1 no-underline hover:bg-transparent focus:bg-transparent">
          <span className="font-medium">{user?.name}</span>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setShowEmail((prev) => {
                  localStorage.setItem("showEmail", (!prev).toString());
                  return !prev;
                });
              }}
              type="button"
            >
              <span className="text-sm">
                {showEmail ? user?.email : maskEmail(user?.email)}
              </span>
              {showEmail ? (
                <EyeSlash className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          <div className="mt-1 text-muted-foreground text-xs">
            {typeof rateLimitStatus?.dailyRemaining === "number"
              ? `${rateLimitStatus.dailyRemaining} messages remaining today`
              : null}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
            href="/settings"
            onClick={(_e) => {
              // Let the SettingsTrigger drawer behavior handle mobile; this is a simple link for desktop
            }}
          >
            <Gear className="size-4" />
            <span>Settings</span>
          </a>
        </DropdownMenuItem>
        <AppInfoTrigger />
        <DropdownMenuSeparator />
        {isAnonymous ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <div className="flex items-center">
              <SignIn className="mr-2 size-4" />
              <span>Login</span>
            </div>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleSignOut();
            }}
          >
            <div className="flex items-center">
              <SignOut className="mr-2 size-4" />
              <span>Logout</span>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
