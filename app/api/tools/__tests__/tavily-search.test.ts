import { describe, expect, it, vi } from "vitest";
import { TavilySearchProvider } from "../providers/tavily-search";

type FetchCall = {
  url: string;
  init: RequestInit;
};

describe("TavilySearchProvider", () => {
  it("uses chunks_per_source <= 5 when scrapeContent=true", async () => {
    const calls: FetchCall[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init: init ?? {} });

        return {
          ok: true,
          json: async () => ({ results: [] }),
        } as unknown as Response;
      })
    );

    const provider = new TavilySearchProvider("test-key");

    await provider.search("test query", { scrapeContent: true, maxResults: 3 });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.tavily.com/search");

    const body = calls[0]?.init.body;
    expect(typeof body).toBe("string");

    const parsed = JSON.parse(String(body)) as {
      chunks_per_source?: number;
      include_content?: boolean;
      search_depth?: string;
    };

    expect(parsed.include_content).toBe(true);
    expect(parsed.search_depth).toBe("advanced");
    expect(parsed.chunks_per_source).toBe(5);
  });

  it("uses chunks_per_source=3 when scrapeContent=false", async () => {
    const calls: FetchCall[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init: init ?? {} });

        return {
          ok: true,
          json: async () => ({ results: [] }),
        } as unknown as Response;
      })
    );

    const provider = new TavilySearchProvider("test-key");

    await provider.search("test query", {
      scrapeContent: false,
      maxResults: 3,
    });

    expect(calls).toHaveLength(1);

    const body = calls[0]?.init.body;
    expect(typeof body).toBe("string");

    const parsed = JSON.parse(String(body)) as {
      chunks_per_source?: number;
      include_content?: boolean;
      search_depth?: string;
    };

    expect(parsed.include_content).toBe(false);
    expect(parsed.search_depth).toBe("basic");
    expect(parsed.chunks_per_source).toBe(3);
  });
});
