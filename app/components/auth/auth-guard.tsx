"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChatSessionProvider } from "@/app/providers/chat-session-provider";
import { UserProvider, useUser } from "@/app/providers/user-provider";
import { SpinningLoader } from "@/components/prompt-kit/spinning-loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AnonymousSignIn } from "./anonymous-sign-in";

type AuthGuardProps = {
  children: React.ReactNode;
};

function PostAuthRedirect() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user || user.isAnonymous) {
      return;
    }

    const target = sessionStorage.getItem("postAuthRedirect");
    if (!target) {
      return;
    }

    sessionStorage.removeItem("postAuthRedirect");
    if (pathname !== target) {
      router.replace(target);
    }
  }, [user, router, pathname]);

  return null;
}

export function AuthGuard({ children }: AuthGuardProps) {
  return (
    <ThemeProvider>
      {/* Auth Loading State - UserProvider never executes */}
      <AuthLoading>
        <div className="flex h-dvh items-center justify-center bg-[#030918]">
          <SpinningLoader size="lg" />
        </div>
      </AuthLoading>

      {/* Unauthenticated State - Triggers anonymous sign-in */}
      <Unauthenticated>
        <AnonymousSignIn />
      </Unauthenticated>

      {/* Authenticated State - Covers both Google users AND anonymous users */}
      <Authenticated>
        <UserProvider>
          <UserProvider>
            <ChatSessionProvider>
              <Toaster position="top-center" />
              <PostAuthRedirect />
              {children}
            </ChatSessionProvider>
          </UserProvider>
        </UserProvider>
      </Authenticated>
    </ThemeProvider>
  );
}
