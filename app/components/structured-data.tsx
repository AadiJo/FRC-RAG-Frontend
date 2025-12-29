import { APP_BASE_URL, APP_DESCRIPTION, APP_NAME } from "@/lib/config";

type StructuredDataProps = {
  type?: "homepage" | "page";
  title?: string;
  description?: string;
  url?: string;
};

export function StructuredData({
  type = "homepage",
  title,
  description,
  url,
}: StructuredDataProps = {}) {
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    alternateName: ["frcrag", "frcrag.johari-dev.com", "FRC RAG"],
    description:
      description ||
      "FRC RAG is an AI assistant tuned for FRC workflows: pull rules, scout faster, explain mechanisms, and keep match prep moving.",
    url: url || APP_BASE_URL,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    softwareVersion: "2.0.0",
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    inLanguage: "en-US",
    isAccessibleForFree: true,
    offers: [
      {
        "@type": "Offer",
        name: "Free Plan",
        description: "Access to basic AI models and features",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: "2024-01-01",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
      bestRating: "5",
      worstRating: "4.5",
    },
    featureList: [
      "FRC-specific RAG (Retrieval-Augmented Generation)",
      "40+ AI Models (OpenAI, Anthropic, Google, Gemini, DeepSeek)",
      "FRC Game Manual & Rules Search",
      "Mechanism Design Help",
      "Code Assistant for Robot Programming",
      "Scouting & Match Strategy",
      "Multi-modal Support (Images & Documents)",
      "Real-time Collaboration",
    ],
    applicationSubCategory: "AI Assistant, FRC Tool, Robotics Application",
    keywords: [
      "FRC",
      "FIRST Robotics",
      "FRC RAG",
      "robotics AI",
      "FRC assistant",
      "FRC code help",
      "FRC programming",
    ],
    creator: {
      "@type": "Organization",
      name: "FRC RAG Team",
      url: APP_BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "FRC RAG",
      url: APP_BASE_URL,
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FRC RAG",
    alternateName: ["frcrag", "frcrag.johari-dev.com"],
    url: APP_BASE_URL,
    description:
      "AI assistant platform for FRC teams providing RAG-powered search, rules lookup, mechanism design help, and code assistance.",
    foundingDate: "2024",
    sameAs: ["https://github.com/AadiJo/frc-rag-backend"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${APP_BASE_URL}/settings/contact`,
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: title || APP_NAME,
    alternateName: ["frcrag", "frcrag.johari-dev.com", "FRC RAG"],
    url: url || APP_BASE_URL,
    description: description || APP_DESCRIPTION,
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_BASE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "FRC RAG",
      url: APP_BASE_URL,
    },
  };

  // Combine all schemas into a single array for better structure
  const combinedSchema = [
    softwareApplicationSchema,
    organizationSchema,
    ...(type === "homepage" ? [websiteSchema] : []),
  ];

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for JSON-LD structured data per Next.js documentation
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(combinedSchema, null, 0).replace(
          /</g,
          "\\u003c"
        ),
      }}
      type="application/ld+json"
    />
  );
}
