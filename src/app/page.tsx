"use client";

import { useAuth } from "@clerk/nextjs";
import { ChatInterface } from "@/components/chat-interface";
import { LandingPage } from "@/components/landing-page";
import { useState } from "react";

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const [guestMode, setGuestMode] = useState(false);

  // Show nothing while loading auth state
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414]">
        <div className="animate-pulse text-[#8e8ea0]">Loading...</div>
      </div>
    );
  }

  if (isSignedIn || guestMode) {
    return <ChatInterface isGuest={!isSignedIn} />;
  }

  return <LandingPage onGuestLogin={() => setGuestMode(true)} />;
}
