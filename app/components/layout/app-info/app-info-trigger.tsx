"use client";

import { Info } from "@phosphor-icons/react";
// Image import removed to eliminate banner from About popup
import { useBreakpoint } from "@/app/hooks/use-breakpoint";
import {
  Dialog,
  DialogContent,
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { APP_NAME } from "@/lib/config";
import { AppInfoContent } from "./app-info-content";

type AppInfoTriggerProps = {
  trigger?: React.ReactNode;
};

export function AppInfoTrigger({ trigger }: AppInfoTriggerProps) {
  const isMobile = useBreakpoint(768);

  const defaultTrigger = (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      <Info className="size-4" />
      About {APP_NAME}
    </DropdownMenuItem>
  );

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{trigger || defaultTrigger}</DrawerTrigger>
        <DrawerContent className="border-border bg-background">
          <DrawerHeader>
            <DrawerTitle>{APP_NAME}</DrawerTitle>
            <DrawerDescription>
              Your minimalist AI chat companion
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <AppInfoContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden rounded-3xl p-0 shadow-xs sm:max-w-md [&>button:last-child]:rounded-full [&>button:last-child]:bg-background [&>button:last-child]:p-1">
        <DialogHeader className="p-0">
          <DialogTitle className="sr-only">{APP_NAME}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <AppInfoContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
