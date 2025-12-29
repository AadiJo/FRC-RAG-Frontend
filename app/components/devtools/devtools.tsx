"use client";

import dynamic from "next/dynamic";

const AIDevtools = dynamic(
  async () => import("@ai-sdk-tools/devtools").then((mod) => mod.AIDevtools),
  { ssr: false }
);

export function DevTools() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <AIDevtools
      config={{
        enabled: true,
        position: "bottom",
        theme: "dark",
        maxEvents: 200,
      }}
    />
  );
}
