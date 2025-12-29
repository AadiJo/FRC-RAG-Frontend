"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SpinningLoader } from "@/components/prompt-kit/spinning-loader";

// This callback page handles OAuth redirects for Convex Auth
// After successful authentication, it redirects to the home page

function AuthenticatedCallback() {
  const _router = useRouter();

  // Post-login redirect is handled by the client-side PostAuthRedirect
  // consumer (sessionStorage 'postAuthRedirect'). Do not navigate here.

  return (
    <div className="flex h-dvh items-center justify-center bg-[#030918]">
      <div className="text-center">
        <div className="mx-auto mb-4">
          <SpinningLoader size="lg" />
        </div>
        <p>Authentication successful. Preparing your session...</p>
      </div>
    </div>
  );
}

function UnauthenticatedCallback() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auth page if not authenticated
    router.push("/auth");
  }, [router]);

  return (
    <div className="flex h-dvh items-center justify-center bg-[#030918]">
      <div className="text-center">
        <p>Authentication required. Redirecting...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <>
      <Authenticated>
        <AuthenticatedCallback />
      </Authenticated>
      <AuthLoading>
        <div className="flex h-dvh items-center justify-center bg-[#030918]">
          <SpinningLoader size="lg" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <UnauthenticatedCallback />
      </Unauthenticated>
    </>
  );
}
