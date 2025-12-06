import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141414]">
      <SignUp 
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