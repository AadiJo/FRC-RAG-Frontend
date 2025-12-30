import { describe, expect, it } from "vitest";
import {
  encodeRAGImagesForHeader,
  encodeRelatedImagesForHeader,
  type RAGContextResponse,
} from "@/lib/rag";

function makeRagContext(overrides?: Partial<RAGContextResponse>): RAGContextResponse {
  return {
    context: "ctx",
    citations: [],
    images: [],
    image_map: {},
    query_id: "q",
    total_chunks: 0,
    ...overrides,
  };
}

describe("RAG header encoding", () => {
  it("returns null when encoded image_map exceeds maxChars", () => {
    const longUrl = `https://example.com/${"a".repeat(10_000)}`;
    const rag = makeRagContext({
      image_map: {
        "[img:abc]": {
          image_id: "abc",
          url: longUrl,
          caption: "cap",
        },
      },
    });

    const encoded = encodeRAGImagesForHeader(rag, { maxChars: 1000 });
    expect(encoded).toBeNull();
  });

  it("returns null when encoded related images exceeds maxChars", () => {
    const longUrl = `https://example.com/${"b".repeat(10_000)}`;
    const rag = makeRagContext({
      images: [
        {
          image_id: "img1",
          url: longUrl,
          caption: "cap",
        },
      ],
    });

    const encoded = encodeRelatedImagesForHeader(rag, { maxChars: 1000 });
    expect(encoded).toBeNull();
  });

  it("returns a base64 string when under maxChars", () => {
    const rag = makeRagContext({
      image_map: {
        "[img:abc]": {
          image_id: "abc",
          url: "https://example.com/x.png",
        },
      },
      images: [
        {
          image_id: "img1",
          url: "https://example.com/y.png",
        },
      ],
    });

    const encodedMap = encodeRAGImagesForHeader(rag, { maxChars: 10_000 });
    const encodedRelated = encodeRelatedImagesForHeader(rag, { maxChars: 10_000 });

    expect(typeof encodedMap).toBe("string");
    expect(encodedMap?.length).toBeGreaterThan(0);

    expect(typeof encodedRelated).toBe("string");
    expect(encodedRelated?.length).toBeGreaterThan(0);
  });
});
