import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  APP_BASE_URL,
  APP_DESCRIPTION,
  APP_NAME,
  META_TITLE,
} from "@/lib/config";
import { cn } from "@/lib/utils";
import { AuthGuard } from "./components/auth/auth-guard";
import { DevTools } from "./components/devtools/devtools";
import LayoutApp from "./components/layout/layout-app";
import { StructuredData } from "./components/structured-data";
import { LayoutClient } from "./layout-client";
import { ConvexClientProvider } from "./providers/convex-client-provider";
import { SidebarProvider } from "./providers/sidebar-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Keep only default theme fonts globally to avoid preloading all fonts

export const metadata: Metadata = {
  title: META_TITLE,
  description: APP_DESCRIPTION,
  metadataBase: new URL(APP_BASE_URL),
  keywords: [
    "FRC RAG",
    "frcrag",
    "frcrag.johari-dev.com",
    "FRC",
    "FIRST Robotics Competition",
    "FRC assistant",
    "FRC AI",
    "robotics AI",
    "FRC technical assistant",
    "FRC code assistant",
    "FRC programming help",
    "WPILib",
    "REV Robotics",
    "CTRE Phoenix",
    "FRC Java",
    "FRC Python",
    "FRC C++",
    "swerve drive",
    "FRC CAD",
    "Onshape FRC",
    "FRC Chief Delphi",
    "FRC documentation",
    "FRC troubleshooting",
    "FRC mentor assistant",
    "FRC student assistant",
    "robot programming",
    "FRC sensors",
    "FRC motor controllers",
    "FRC pneumatics",
    "FRC vision processing",
    "PhotonVision",
    "Limelight",
    "AprilTags FRC",
    "FRC path planning",
    "PathPlanner",
    "FRC autonomous",
    "FRC teleoperated",
    "FRC game manual",
    "FRC rules assistant",
    "FIRST Robotics",
    "FRC build season",
    "FRC competition",
    "FRC strategy",
    "technical copilot",
    "robotics education",
  ],
  creator: "FRC RAG Team",
  publisher: "FRC RAG",
  applicationName: APP_NAME,
  category: "Education",
  openGraph: {
    title: META_TITLE,
    description: APP_DESCRIPTION,
    url: APP_BASE_URL,
    siteName: APP_NAME,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: APP_DESCRIPTION,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: APP_DESCRIPTION,
    images: ["/opengraph-image.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "FRC RAG",
  },
};

import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData type="homepage" />
      </head>
      <body
        className={cn(
          "font-sans antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        {!isDev &&
          process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL &&
          process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
            <Script
              data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
              src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
              strategy="afterInteractive"
            />
          )}
        <LayoutClient />
        <TooltipProvider>
          <ConvexAuthNextjsServerProvider>
            <ConvexClientProvider>
              <AuthGuard>
                <SidebarProvider>
                  <LayoutApp>{children}</LayoutApp>
                </SidebarProvider>
                <Analytics />
                <SpeedInsights />
                {isDev ? <DevTools /> : null}
              </AuthGuard>
            </ConvexClientProvider>
          </ConvexAuthNextjsServerProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
