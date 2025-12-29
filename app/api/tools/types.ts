// Search provider interfaces and types
export type SearchAdapter = {
  readonly name: string;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
};

export type SearchResult = {
  url: string;
  title: string;
  description: string;
  content?: string;
  markdown?: string;
};

// Search category types for targeted content filtering
export type ExaSearchCategory =
  | "company"
  | "research paper"
  | "news"
  | "linkedin profile"
  | "github"
  | "tweet"
  | "movie"
  | "song"
  | "personal site"
  | "pdf"
  | "financial report";

export type SearchOptions = {
  maxResults?: number;
  scrapeContent?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  category?: ExaSearchCategory;
};

// Only Tavily is supported
export type SearchProvider = "tavily";

// Provider-specific limits
export const PROVIDER_LIMITS = {
  tavily: { maxResults: 20, maxChunks: 5 },
} as const;

// Search configuration
export const SEARCH_CONFIG = {
  defaultProvider: "tavily" as SearchProvider,
  maxResults: 3,
  scrapeContent: true,
  maxTextCharacters: 1000,
};
