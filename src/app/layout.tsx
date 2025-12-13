import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FRC RAG",
  description: "AI-powered FRC Technical Assistant",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorBackground: "#1a1a1a",
          colorInputBackground: "#2a2a2a",
          colorInputText: "#ececec",
          colorText: "#ececec",
          colorTextSecondary: "#8e8ea0",
          colorPrimary: "#3b82f6",
          colorDanger: "#ef4444",
          colorNeutral: "#ececec",
          borderRadius: "0.5rem",
        },
        elements: {
          // Card styling
          card: "bg-[#1a1a1a] border border-[#333] shadow-xl",
          // Header
          headerTitle: "text-[#ececec]",
          headerSubtitle: "text-[#8e8ea0]",
          // Form elements
          formButtonPrimary: "bg-[#3b82f6] hover:bg-[#2563eb] text-white",
          formFieldInput: "bg-[#2a2a2a] border-[#424242] text-[#ececec]",
          formFieldLabel: "text-[#ececec]",
          // Links
          footerActionLink: "text-[#3b82f6] hover:text-[#60a5fa]",
          identityPreviewEditButton: "text-[#3b82f6]",
          // Social buttons
          socialButtonsBlockButton: "bg-[#2a2a2a] border-[#424242] text-[#ececec] hover:bg-[#3f3f3f]",
          socialButtonsBlockButtonText: "text-[#ececec]",
          // User button popover
          userButtonPopoverCard: "bg-[#1a1a1a] border border-[#333]",
          userButtonPopoverActionButton: "text-[#ececec] hover:bg-[#2a2a2a]",
          userButtonPopoverActionButtonText: "text-[#ececec]",
          userButtonPopoverActionButtonIcon: "text-[#8e8ea0]",
          userPreviewMainIdentifier: "text-[#ececec]",
          userPreviewSecondaryIdentifier: "text-[#8e8ea0]",
          // Hide branding
          footer: "hidden",
          footerPages: "hidden",
          footerPagesLink: "hidden",
          badge: "hidden",
          // Dividers
          dividerLine: "bg-[#333]",
          dividerText: "text-[#8e8ea0]",
          // Other elements
          formFieldInputShowPasswordButton: "text-[#8e8ea0] hover:text-[#ececec]",
          otpCodeFieldInput: "bg-[#2a2a2a] border-[#424242] text-[#ececec]",
          alertText: "text-[#ececec]",
          // User profile
          profileSectionPrimaryButton: "text-[#3b82f6]",
          accordionTriggerButton: "text-[#ececec]",
          navbarButton: "text-[#ececec]",
          navbarButtonIcon: "text-[#8e8ea0]",
        },
        layout: {
          socialButtonsPlacement: "bottom",
          logoPlacement: "inside",
          shimmer: true,
        },
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
    >
      <html lang="en" className="dark">
        <body
          className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
