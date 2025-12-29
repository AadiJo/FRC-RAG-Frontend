"use client";

import { memo, useMemo } from "react";
import { MessageContent } from "@/components/prompt-kit/message";
import { getRagImageUrl, type RAGImage, sanitizeCaption } from "@/lib/rag";
import { RAGInlineImage } from "./rag-inline-image";

type RAGTextContentProps = {
  text: string;
  ragImages: RAGImage[];
  id: string;
  index: number;
};

/**
 * Segment types for pre-processed content
 */
type TextSegment = {
  type: "text";
  content: string;
};

type ImageSegment = {
  type: "image";
  imageId: string;
};

type ContentSegment = TextSegment | ImageSegment;

const TABLE_DIVIDER_ALLOWED_CHARS_REGEX = /^[\s|:.-]+$/;
const NEWLINE_SPLIT_REGEX = /\r?\n/;

type Range = { start: number; end: number };

function isTableDividerLine(line: string): boolean {
  // Accept canonical and non-canonical GFM dividers:
  // | --- | --- |, ---|---, :---:, ---:, etc.
  const trimmed = line.trim();
  if (!trimmed.includes("-")) {
    return false;
  }
  // Only allow characters that can appear in a divider row.
  return TABLE_DIVIDER_ALLOWED_CHARS_REGEX.test(trimmed);
}

function isPotentialTableRow(line: string): boolean {
  // A GFM table row must include at least one pipe separating columns.
  // We allow missing leading/trailing pipes.
  return line.includes("|");
}

/**
 * Detect GFM table blocks and return their start/end positions.
 * This is intentionally line-based (vs regex-only) to handle:
 * - tables without leading/trailing pipes
 * - variable whitespace
 */
function findTableRanges(text: string): Range[] {
  const ranges: Range[] = [];

  const lines = text.split(NEWLINE_SPLIT_REGEX);
  let offset = 0;
  let i = 0;

  while (i < lines.length - 1) {
    const header = lines[i] ?? "";
    const divider = lines[i + 1] ?? "";

    if (isPotentialTableRow(header) && isTableDividerLine(divider)) {
      const start = offset;
      let end = offset + header.length;

      // Include header + divider
      end += 1; // newline
      end += divider.length;

      // Consume subsequent table rows until a blank line or a non-row line.
      let j = i + 2;
      let rowOffset = offset + header.length + 1 + divider.length + 1;

      while (j < lines.length) {
        const row = lines[j] ?? "";
        if (!row.trim()) {
          // Stop before blank line.
          rowOffset += row.length;
          break;
        }

        if (!isPotentialTableRow(row)) {
          break;
        }

        end = rowOffset + row.length;
        rowOffset += row.length + 1;
        j += 1;
      }

      ranges.push({ start, end });

      // Advance i/offset to j
      while (i < j) {
        offset += (lines[i]?.length ?? 0) + 1;
        i += 1;
      }
      continue;
    }

    offset += header.length + 1;
    i += 1;
  }

  return ranges;
}

/**
 * Check if an index position falls within any table range.
 */
function isInsideTable(
  index: number,
  tableRanges: Array<{ start: number; end: number }>
): boolean {
  return tableRanges.some((range) => index >= range.start && index < range.end);
}

/**
 * Replace image placeholders inside tables with inline markdown image syntax.
 * This preserves the table structure while embedding the images.
 */
function escapeMarkdownAltTextForTableCell(value: string): string {
  // Keep alt text one-line and safe inside table rows.
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/\|/g, "\\|")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .trim();
}

function escapeMarkdownUrlForDestination(url: string): string {
  // Avoid breaking markdown parsing in tables and in link destinations.
  // - Encode characters like spaces and `|`
  // - Wrap in <...> when used to allow parentheses safely
  return encodeURI(url).replace(/\|/g, "%7C");
}

function replaceTablePlaceholders(
  tableText: string,
  ragImages: RAGImage[]
): string {
  return tableText.replace(/\[img:([^\]]+)\]/g, (_match, imageId: string) => {
    const imageData = ragImages.find((img) => img.image_id === imageId);
    if (!imageData) {
      return "";
    }

    const imageUrlRaw = getRagImageUrl(imageData.url);
    if (!imageUrlRaw) {
      return "";
    }

    const { caption } = sanitizeCaption(imageData.caption);
    const altText = escapeMarkdownAltTextForTableCell(
      caption || `Image ${imageId}`
    );
    const imageUrl = escapeMarkdownUrlForDestination(imageUrlRaw);

    // Use <...> to keep URLs with parentheses safe, and keep parsing stable in tables.
    return `![${altText}](<${imageUrl}>)`;
  });
}

/**
 * Pre-process text to extract image placeholders BEFORE markdown parsing.
 * This approach matches the reference frontend implementation.
 *
 * TABLE-AWARE: When placeholders appear inside GFM tables, they are replaced
 * with inline markdown image syntax to preserve table structure. Placeholders
 * outside tables are extracted as separate ImageSegments for rich rendering.
 *
 * Returns an array of segments where text can be rendered as markdown
 * and images are rendered as separate components.
 */
function parseContentSegments(
  text: string,
  ragImages: RAGImage[]
): ContentSegment[] {
  // Normalize the text to handle various model output formats
  let normalizedText = text
    // Remove bold syntax around placeholders: **[img:ID]** → [img:ID]
    .replace(/\*\*(\s*\[img:[^\]]+\]\s*)\*\*/g, "$1")
    // Remove italic syntax around placeholders: *[img:ID]* → [img:ID]
    .replace(/\*(\s*\[img:[^\]]+\]\s*)\*/g, "$1")
    // If the model wraps placeholders in inline code, undo it: `[img:ID]` → [img:ID]
    .replace(/`(\s*\[img:[^\]]+\]\s*)`/g, "$1")
    // If the model uses Markdown image syntax but puts a placeholder in the URL,
    // rewrite it back to a plain placeholder so our renderer can handle it.
    // Examples: ![]([img:123])  ![alt](<[img:123]>)  ![alt]([img:123] "title")
    .replace(/!\[[^\]]*\]\(\s*<?(\[img:[^\]]+\])>?\s*(?:"[^"]*")?\s*\)/g, "$1")
    // If the model mistakenly uses Markdown image syntax, undo it.
    // This prevents placeholders from degrading into stray '!' in the rendered output.
    .replace(/!\s*\[(img:[^\]]+)\](?:\([^)]*\))?/g, "[$1]");

  // If no placeholders, return the whole text as a single segment
  if (!normalizedText.includes("[img:")) {
    return [{ type: "text", content: normalizedText }];
  }

  // Find all table ranges in the text
  const tableRanges = findTableRanges(normalizedText);

  // First pass: Replace placeholders inside tables with inline markdown images
  // We process tables in reverse order to maintain correct indices
  for (let i = tableRanges.length - 1; i >= 0; i--) {
    const range = tableRanges[i];
    const tableText = normalizedText.slice(range.start, range.end);
    const replacedTable = replaceTablePlaceholders(tableText, ragImages);
    normalizedText =
      normalizedText.slice(0, range.start) +
      replacedTable +
      normalizedText.slice(range.end);
  }

  // Recalculate table ranges after replacement (tables no longer contain [img:] placeholders)
  const updatedTableRanges = findTableRanges(normalizedText);

  // If no remaining placeholders outside tables, return as single text segment
  if (!normalizedText.includes("[img:")) {
    return [{ type: "text", content: normalizedText }];
  }

  // Second pass: Extract remaining placeholders (outside tables) as ImageSegments
  const segments: ContentSegment[] = [];
  const regex = /\[img:([^\]]+)\]/g;
  let lastIndex = 0;
  let match = regex.exec(normalizedText);

  while (match !== null) {
    const start = match.index;
    const imageId = match[1];

    // Skip placeholders that are inside tables (shouldn't happen after first pass, but safety check)
    if (isInsideTable(start, updatedTableRanges)) {
      match = regex.exec(normalizedText);
      continue;
    }

    // Add text before the placeholder
    if (start > lastIndex) {
      const textContent = normalizedText.slice(lastIndex, start);
      if (textContent.trim()) {
        segments.push({ type: "text", content: textContent });
      }
    }

    // Only add image if we have metadata for it (prevents showing broken images)
    const hasImage = ragImages.some((img) => img.image_id === imageId);
    if (hasImage) {
      segments.push({ type: "image", imageId });
    }

    lastIndex = regex.lastIndex;
    match = regex.exec(normalizedText);
  }

  // Add remaining text after the last placeholder
  if (lastIndex < normalizedText.length) {
    const textContent = normalizedText.slice(lastIndex);
    if (textContent.trim()) {
      segments.push({ type: "text", content: textContent });
    }
  }

  return segments;
}

export function parseRagTextContentSegmentsForTest(
  text: string,
  ragImages: RAGImage[]
): ContentSegment[] {
  return parseContentSegments(text, ragImages);
}

/**
 * Renders text content with inline RAG images.
 *
 * This component pre-processes the text to extract [img:ID] placeholders
 * BEFORE passing to markdown, then renders text segments as markdown
 * and image segments as inline images.
 *
 * This approach matches the reference frontend implementation and ensures
 * images are rendered correctly regardless of markdown formatting around them.
 */
function RAGTextContentComponent({
  text,
  ragImages,
  id,
  index,
}: RAGTextContentProps) {
  // Pre-process text into segments
  const segments = useMemo(
    () => parseContentSegments(text, ragImages),
    [text, ragImages]
  );

  // If no segments or empty text, render nothing
  if (segments.length === 0) {
    return null;
  }

  // If only one text segment and no images, render as simple markdown
  if (segments.length === 1 && segments[0].type === "text") {
    const textContent = segments[0].content;
    if (!textContent.trim()) {
      return null;
    }
    return (
      <MessageContent
        className="prose dark:prose-invert relative min-w-full bg-transparent p-0"
        id={`${id}-text-${index}`}
        markdown={true}
      >
        {textContent}
      </MessageContent>
    );
  }

  // Render segments with interleaved markdown text and inline images
  return (
    <div className="space-y-3">
      {segments.map((segment, segmentIndex) => {
        if (segment.type === "image") {
          return (
            <RAGInlineImage
              imageId={segment.imageId}
              key={`${id}-img-${segment.imageId}-${segmentIndex}`}
              ragImages={ragImages}
            />
          );
        }

        // Text segment - render as markdown
        const textContent = segment.content;
        if (!textContent.trim()) {
          return null;
        }

        return (
          <MessageContent
            className="prose dark:prose-invert relative min-w-full bg-transparent p-0"
            id={`${id}-text-${index}-${segmentIndex}`}
            key={`${id}-text-${segmentIndex}`}
            markdown={true}
          >
            {textContent}
          </MessageContent>
        );
      })}
    </div>
  );
}

export const RAGTextContent = memo(RAGTextContentComponent);
