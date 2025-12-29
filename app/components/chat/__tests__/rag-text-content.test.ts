import { describe, expect, it } from "vitest";
import { parseRagTextContentSegmentsForTest } from "../rag-text-content";

type RAGImage = {
  image_id: string;
  url: string;
  caption?: string | undefined;
};

describe("RAGTextContent table placeholder handling", () => {
  it("replaces placeholders inside canonical pipe tables with markdown images", () => {
    const text =
      "| Image | What you're seeing |\n" +
      "| --- | --- |\n" +
      "| [img:abc] | A description |";

    const ragImages: RAGImage[] = [
      {
        image_id: "abc",
        url: "/images/frc/254/2025/a(b)|c.png",
        caption: "nonpenetrating | bracket ] test",
      },
    ];

    const segments = parseRagTextContentSegmentsForTest(text, ragImages);
    expect(segments).toHaveLength(1);
    expect(segments[0]?.type).toBe("text");

    const rendered = segments[0].type === "text" ? segments[0].content : "";

    // Alt text should be escaped for table safety.
    // sanitizeCaption normalizes casing.
    expect(rendered).toContain("Nonpenetrating \\| bracket \\] test");

    // URL should be encoded and wrapped in <...>.
    expect(rendered).toContain(
      "![Nonpenetrating \\| bracket \\] test](</images/frc/254/2025/a(b)%7Cc.png>)"
    );
  });

  it("replaces placeholders inside non-canonical tables without leading/trailing pipes", () => {
    const text = `Image | Desc
--- | ---
[img:abc] | Hello`;

    const ragImages: RAGImage[] = [
      {
        image_id: "abc",
        url: "https://example.com/a(b).png",
        caption: "Example image",
      },
    ];

    const segments = parseRagTextContentSegmentsForTest(text, ragImages);
    expect(segments).toHaveLength(1);
    expect(segments[0]?.type).toBe("text");

    const rendered = segments[0].type === "text" ? segments[0].content : "";
    expect(rendered).toContain(
      "![Example image](<https://example.com/a(b).png>)"
    );
  });

  it("extracts placeholders outside tables as image segments", () => {
    const text = "Before [img:abc] after";

    const ragImages: RAGImage[] = [
      {
        image_id: "abc",
        url: "https://example.com/image.png",
        caption: "Example image",
      },
    ];

    const segments = parseRagTextContentSegmentsForTest(text, ragImages);
    expect(segments.map((s) => s.type)).toEqual(["text", "image", "text"]);
  });
});
