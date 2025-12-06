"use client";

import { useAuth } from "@clerk/nextjs";
import { ChatInterface } from "@/components/chat-interface";
import { LandingPage } from "@/components/landing-page";
import { useEffect, useState } from "react";

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const guestCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("guest-mode="));
    setIsGuest(guestCookie?.split("=")[1] === "true");
    setChecking(false);
  }, []);

  // Show nothing while loading auth state
  if (!isLoaded || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414]">
        <div className="animate-pulse text-[#8e8ea0]">Loading...</div>
      </div>
    );
  }

  if (isSignedIn || isGuest) {
    return <ChatInterface isGuest={!isSignedIn} />;
  }

  return <LandingPage />;
}
