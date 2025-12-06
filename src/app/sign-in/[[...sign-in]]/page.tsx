import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#141414] px-4">
      <div className="absolute left-6 top-6">
        <Button
          variant="ghost"
          className="text-[#ececec] hover:bg-white/10"
          asChild
        >
          <Link href="/" className="flex items-center gap-2" aria-label="Back to landing page">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <SignIn 
        forceRedirectUrl="/"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#1a1a1a] border border-[#333] shadow-xl",
            headerTitle: "text-[#ececec]",
            headerSubtitle: "text-[#8e8ea0]",
            formButtonPrimary: "bg-[#3b82f6] hover:bg-[#2563eb] text-white",
            formFieldInput: "bg-[#2a2a2a] border-[#424242] text-[#ececec] placeholder:text-[#666]",
            formFieldLabel: "text-[#ececec]",
            footerActionLink: "text-[#3b82f6] hover:text-[#60a5fa]",
            identityPreviewEditButton: "text-[#3b82f6]",
            formFieldInputShowPasswordButton: "text-[#8e8ea0]",
            dividerLine: "bg-[#333]",
            dividerText: "text-[#8e8ea0]",
            socialButtonsBlockButton: "bg-[#2a2a2a] border-[#424242] text-[#ececec] hover:bg-[#3f3f3f]",
            socialButtonsBlockButtonText: "text-[#ececec]",
            footer: "hidden",
            internal: "hidden",
          }
        }}
      />
    </div>
  );
}