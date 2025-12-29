"use client";

import { Code, Info } from "@phosphor-icons/react";
// Image removed to avoid showing banner in About popup
import { useBreakpoint } from "@/app/hooks/use-breakpoint";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { APP_DESCRIPTION, APP_NAME, GITHUB_REPO_URL } from "@/lib/config";

const InfoContent = () => (
  <div className="space-y-4">
    <p className="text-foreground leading-relaxed">
      {APP_DESCRIPTION} Built with Vercel&apos;s AI SDK, Convex, and prompt-kit
      components.
    </p>
    <p className="text-foreground leading-relaxed">
      The code is available on{" "}
      <a
        className="underline"
        href={GITHUB_REPO_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        GitHub
      </a>
      .
    </p>
    <a
      aria-label="Open Source"
      className="inline-flex items-center gap-1 underline"
      href="/open-source"
      rel="noopener"
      target="_blank"
    >
      <Code className="inline size-4 align-text-bottom" />
      Open Source
    </a>
  </div>
);

const defaultTrigger = (
  <Button
    aria-label={`About ${APP_NAME}`}
    className="h-8 w-8 rounded-full bg-background/80 text-muted-foreground hover:bg-muted"
    size="icon"
    variant="ghost"
  >
    <Info className="size-4" />
  </Button>
);

type AppInfoProps = {
  trigger?: React.ReactNode;
};

export function AppInfo({ trigger = defaultTrigger }: AppInfoProps) {
  const isMobile = useBreakpoint(768);

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="border-border bg-background">
          <DrawerHeader>
            <DrawerTitle>{APP_NAME}</DrawerTitle>
            <DrawerDescription>
              Your minimalist AI chat companion
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <InfoContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden rounded-3xl p-0 shadow-xs sm:max-w-md [&>button:last-child]:rounded-full [&>button:last-child]:bg-background [&>button:last-child]:p-1">
        <DialogHeader className="p-0">
          <DialogTitle>{APP_NAME}</DialogTitle>
          <DialogDescription>
            Your minimalist AI chat companion
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <InfoContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
