"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { MessageUsageCard } from "@/app/components/layout/settings/message-usage-card";
import { useUser } from "@/app/providers/user-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { api } from "@/convex/_generated/api";

export default function AccountSettingsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const deleteAccount = useMutation(api.users.deleteAccount);
  const { signOut } = useUser();
  const router = useRouter();

  const handleDeleteAccount = useCallback(() => {
    setShowDeleteAccountDialog(true);
  }, []);

  const confirmDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteAccount({});
      await signOut();
      toast({ title: "Account deleted", status: "success" });
      router.replace("/");
    } catch {
      toast({
        title: "Failed to delete account",
        status: "error",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteAccountDialog(false);
    }
  }, [deleteAccount, signOut, router]);

  return (
    <div className="w-full space-y-8">
      <div className="space-y-12">
        {/* Usage Card */}
        <section className="space-y-6">
          <h2 className="text-left font-bold text-2xl">Usage</h2>
          <MessageUsageCard />
        </section>
      </div>

      {/* Danger Zone */}
      <section className="mt-20 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="text-left font-bold text-2xl">Danger Zone</h2>
        </div>
        <p className="px-0.25 py-1.5 text-muted-foreground/80 text-sm">
          Permanently delete your account and all associated data.
        </p>
        <Button
          disabled={isDeleting}
          onClick={handleDeleteAccount}
          size="sm"
          variant="destructive"
        >
          {isDeleting ? (
            <>
              <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            "Delete Account"
          )}
        </Button>
      </section>

      {/* Delete account confirmation dialog */}
      <Dialog
        onOpenChange={setShowDeleteAccountDialog}
        open={showDeleteAccountDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and all associated data including chat history, API keys,
              and all other settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowDeleteAccountDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={confirmDeleteAccount} variant="destructive">
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
