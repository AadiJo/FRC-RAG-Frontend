import { TavilySearchProvider } from "./providers/tavily-search";
import type { SearchAdapter, SearchOptions, SearchResult } from "./types";

// Singleton instance of Tavily provider
let tavilyInstance: SearchAdapter | null = null;

export function getProvider(): SearchAdapter {
  if (tavilyInstance) {
    return tavilyInstance;
  }

  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    throw new Error("TAVILY_API_KEY environment variable is not set");
  }

  tavilyInstance = new TavilySearchProvider(tavilyKey);
  return tavilyInstance;
}

export async function searchWithFallback(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const provider = getProvider();
  return await provider.search(query, options);
}
