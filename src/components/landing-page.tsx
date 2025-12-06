"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Bot } from "lucide-react";

export function LandingPage({ onGuestLogin }: { onGuestLogin?: () => void }) {
  const router = useRouter();
  const { signOut } = useClerk();

  const handleGuest = async () => {
    // Sign out first if user has an active session
    try {
      await signOut();
    } catch (e) {
      // Ignore errors - user might not be signed in
    }
    document.cookie = "guest-mode=true; path=/; max-age=86400";
    if (onGuestLogin) {
      onGuestLogin();
    }
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#141414] p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-[#333] rounded-xl p-8 shadow-xl">
        {/* Logo/Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">
            FRC RAG
          </h1>
          <p className="text-[#8e8ea0] text-center text-sm">
            AI Technical Assistant for FRC Teams
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <Button 
            asChild 
            className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg"
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#333]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a1a1a] px-2 text-[#8e8ea0]">Or</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full h-11 bg-transparent border-[#424242] text-[#ececec] hover:bg-[#2f2f2f] hover:text-white font-medium rounded-lg"
            onClick={handleGuest}
          >
            Continue as Guest
          </Button>
        </div>

        <p className="text-[#8e8ea0] text-xs text-center mt-6">
          Sign in to save your chat history and settings
        </p>
      </div>
    </div>
  );
}