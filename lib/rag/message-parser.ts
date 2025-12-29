import type { RAGImage } from "./types";

/**
 * Regex pattern to match RAG image placeholders in the format [img:IMAGE_ID]
 */
export const RAG_IMAGE_PATTERN = /\[img:([^\]]+)\]/g;

/**
 * Check if a text contains RAG image placeholders
 */
export function hasRAGImages(text: string): boolean {
  // Reset regex state before testing
  const regex = /\[img:([^\]]+)\]/g;
  return regex.test(text);
}

/**
 * Extract all image IDs from a text string
 */
export function extractImageIds(text: string): string[] {
  const ids: string[] = [];
  const regex = /\[img:([^\]]+)\]/g;
  let match = regex.exec(text);

  while (match !== null) {
    ids.push(match[1]);
    match = regex.exec(text);
  }

  return ids;
}

/**
 * Parse text and return segments with text and image placeholders
 * Used to render inline images mixed with text
 */
export type TextSegment = {
  type: "text";
  content: string;
};

export type ImageSegment = {
  type: "image";
  imageId: string;
};

export type MessageSegment = TextSegment | ImageSegment;

/**
 * Parse message text into segments of text and image placeholders
 * This allows rendering inline images within the message flow
 */
export function parseMessageSegments(text: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  const regex = /\[img:([^\]]+)\]/g;
  let lastIndex = 0;
  let match = regex.exec(text);

  while (match !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add the image placeholder
    segments.push({
      type: "image",
      imageId: match[1],
    });

    lastIndex = regex.lastIndex;
    match = regex.exec(text);
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Remove image placeholders from text
 * Useful for displaying text-only versions
 */
export function stripImagePlaceholders(text: string): string {
  return text.replace(/\[img:([^\]]+)\]/g, "").trim();
}

/**
 * Get images that were used inline (referenced in text via placeholders)
 */
export function getInlineImages(
  text: string,
  imageMap: RAGImage[]
): RAGImage[] {
  const ids = extractImageIds(text);
  return ids
    .map((id) => imageMap.find((img) => img.image_id === id))
    .filter((img): img is RAGImage => img !== undefined);
}

/**
 * Get images that are related but not used inline
 */
export function getRelatedOnlyImages(
  text: string,
  allImages: RAGImage[],
  _imageMap: RAGImage[]
): RAGImage[] {
  const inlineIds = new Set(extractImageIds(text));

  // Related images are those in allImages that are NOT in the inline set
  return allImages.filter((img) => !inlineIds.has(img.image_id));
}
