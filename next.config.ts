import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// Extract hostname from CONVEX_URL for image configuration
const getConvexHostname = (): string | null => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (convexUrl) {
    try {
      return new URL(convexUrl).hostname;
    } catch {
      // Silent fail - return null if URL parsing fails
    }
  }
  return null;
};

const nextConfig: NextConfig = {
  // Disable React Strict Mode to prevent double-invoking effects
  reactStrictMode: false,
  experimental: {
    useCache: true,
    optimizePackageImports: [
      "@phosphor-icons/react",
      "@ridemountainpig/svgl-react",
      "@lobehub/icons",
    ],
  },
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.frcrag.johari-dev.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
      },
      {
        protocol: "https",
        hostname: "api.microlink.io",
      },
      {
        protocol: "https",
        hostname: "*.ngrok-free.dev",
      },
      // Add Convex hostname dynamically
      ...(() => {
        const convexHostname = getConvexHostname();
        return convexHostname
          ? [
              {
                protocol: "https" as const,
                hostname: convexHostname,
              },
            ]
          : [];
      })(),
    ],
  },
};

export async function headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value:
            "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com https://csp.withgoogle.com; connect-src 'self' https://www.googleapis.com https://oauth2.googleapis.com; frame-src 'self' https://accounts.google.com https://csp.withgoogle.com https://apis.google.com https://*.google.com https://*.withgoogle.com; img-src 'self' data: https://lh3.googleusercontent.com https://*.googleusercontent.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
        },
      ],
    },
  ];
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
