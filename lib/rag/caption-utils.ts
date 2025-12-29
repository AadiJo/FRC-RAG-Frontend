/**
 * Caption utilities for RAG images
 * Sanitizes AI-generated captions for display
 */

// Top-level regex patterns for performance
const TRAILING_MARKER_REGEX = /\s+([-*•]|\d+\.)\s*$/;
const LIST_START_REGEX = /^\s*[-*•]\s/;
const NUMBERED_LIST_START_REGEX = /^\s*\d+\.\s/;
const LIST_MARKER_REGEX = /^\s*([-*•]|\d+\.)\s*/;
const MARKER_MATCH_REGEX = /\s*([-*•]|\d+\.)\s*/;
const FIRST_CAPITAL_REGEX = /[A-Z]/;
const DIGIT_REGEX = /\d/;
// Additional regex patterns for removeTrailingEmptyListItems and removeIncompleteEnd
const EMPTY_LIST_ON_NEWLINE_REGEX = /\n[\s]*([-*•]|\d+\.)[\s]*$/;
const EXCLAMATION_QUESTION_END_REGEX = /[!?]\s*$/;
const PERIOD_END_REGEX = /\.\s*$/;
const DIGIT_PERIOD_END_REGEX = /\d\.\s*$/;

/**
 * Remove trailing empty list items (list markers with no content)
 */
function removeTrailingEmptyListItems(text: string): string {
  if (!text || text.length === 0) {
    return text;
  }

  let result = text;
  let changed = true;

  while (changed) {
    changed = false;
    const trimmed = result.trimEnd();

    // Pattern: newline + optional whitespace + list marker + optional whitespace + end
    // Matches empty list items like "\n3. " or "\n- "
    const match = trimmed.match(EMPTY_LIST_ON_NEWLINE_REGEX);

    if (match?.index !== undefined) {
      result = trimmed.substring(0, match.index);
      changed = true;
      continue;
    }

    // Handle edge case: trailing marker on same line with whitespace
    // Matches patterns like " 3. " at end of text
    const sameLineMatch = trimmed.match(TRAILING_MARKER_REGEX);
    if (sameLineMatch?.index !== undefined) {
      result = trimmed.substring(0, sameLineMatch.index);
      changed = true;
    }
  }

  return result.trimEnd();
}

/**
 * Remove incomplete sentences at the end of a caption
 * If the incomplete part is a list item, remove the entire list item
 */
function removeIncompleteEnd(text: string): string {
  if (!text || text.length === 0) {
    return text;
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return trimmedText;
  }

  // First, check if text ends with an empty list marker (e.g., "3." or "3. ")
  // These should be removed as they are incomplete list items
  if (EMPTY_LIST_ON_NEWLINE_REGEX.test(trimmedText)) {
    // Remove the empty list marker and try again
    const withoutEmptyMarker = trimmedText.replace(
      EMPTY_LIST_ON_NEWLINE_REGEX,
      ""
    );
    return removeIncompleteEnd(withoutEmptyMarker);
  }

  // Check if text ends with sentence-ending punctuation
  // Exclude periods that are part of list markers (preceded by digit)
  const endsWithSentencePunctuation =
    EXCLAMATION_QUESTION_END_REGEX.test(trimmedText) ||
    (PERIOD_END_REGEX.test(trimmedText) &&
      !DIGIT_PERIOD_END_REGEX.test(trimmedText));

  if (endsWithSentencePunctuation) {
    return trimmedText;
  }

  // Find the last complete sentence
  let lastSentenceEnd = -1;

  // Check ! and ? first
  lastSentenceEnd = Math.max(
    trimmedText.lastIndexOf("!"),
    trimmedText.lastIndexOf("?")
  );

  // Find sentence-ending periods (not list markers like "5.")
  const sentenceEndPeriods: number[] = [];
  for (let i = 0; i < trimmedText.length; i++) {
    // Not a list marker if not preceded by a digit
    if (
      trimmedText[i] === "." &&
      (i === 0 || !DIGIT_REGEX.test(trimmedText[i - 1]))
    ) {
      sentenceEndPeriods.push(i);
    }
  }
  if (sentenceEndPeriods.length > 0) {
    lastSentenceEnd = Math.max(
      lastSentenceEnd,
      sentenceEndPeriods.at(-1) ?? -1
    );
  }

  if (lastSentenceEnd === -1) {
    // No complete sentences - check if it's a list
    if (
      LIST_START_REGEX.test(trimmedText) ||
      NUMBERED_LIST_START_REGEX.test(trimmedText)
    ) {
      return "";
    }
    return trimmedText;
  }

  const afterLastSentenceRaw = trimmedText.substring(lastSentenceEnd + 1);
  const afterLastSentence = afterLastSentenceRaw.trim();

  if (!afterLastSentence) {
    return trimmedText;
  }

  // Check if incomplete part is a list item
  if (LIST_MARKER_REGEX.test(afterLastSentence)) {
    const markerMatch = afterLastSentence.match(MARKER_MATCH_REGEX);
    if (markerMatch?.index !== undefined) {
      const leadingWhitespaceLength =
        afterLastSentenceRaw.length - afterLastSentenceRaw.trimStart().length;
      const markerStartInText =
        lastSentenceEnd + 1 + leadingWhitespaceLength + markerMatch.index;

      const textBeforeMarker = trimmedText.substring(0, markerStartInText);
      const lastNewlineBeforeMarker = textBeforeMarker.lastIndexOf("\n");

      if (lastNewlineBeforeMarker >= 0) {
        const result = trimmedText
          .substring(0, lastNewlineBeforeMarker + 1)
          .trimEnd();
        return removeTrailingEmptyListItems(result);
      }
      const result = trimmedText.substring(0, markerStartInText).trim();
      return removeTrailingEmptyListItems(result);
    }

    const result = trimmedText.substring(0, lastSentenceEnd + 1).trim();
    return removeTrailingEmptyListItems(result);
  }

  const result = trimmedText.substring(0, lastSentenceEnd + 1).trim();
  return removeTrailingEmptyListItems(result);
}

/**
 * Find the start of the first full sentence in a caption
 */
function findFirstSentenceStart(text: string): {
  caption: string;
  removedPrefix: string | null;
} {
  if (!text || text.length === 0) {
    return { caption: text, removedPrefix: null };
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return { caption: trimmedText, removedPrefix: null };
  }

  // Already starts with capital letter
  const firstChar = trimmedText[0];
  if (firstChar >= "A" && firstChar <= "Z") {
    return { caption: trimmedText, removedPrefix: null };
  }

  // Check if text starts with a list marker (numbered or bullet)
  // Lists are valid sentence starters and should be preserved
  if (
    LIST_START_REGEX.test(trimmedText) ||
    NUMBERED_LIST_START_REGEX.test(trimmedText)
  ) {
    return { caption: trimmedText, removedPrefix: null };
  }

  // Find sentence boundary: punctuation + space + capital
  // Create a new regex each time since we need fresh state for exec
  const sentenceBoundaryRegex = /[.!?]\s+([A-Z])/g;
  const match = sentenceBoundaryRegex.exec(trimmedText);

  // Only need to check first match since we return inside the if
  if (match !== null) {
    const startIndex = match.index + match[0].length - 1;
    const removedPrefix = trimmedText.substring(0, startIndex).trim();
    const caption = trimmedText.substring(startIndex).trim();
    return { caption, removedPrefix: removedPrefix || null };
  }

  // Find first capital letter
  const firstCapitalMatch = trimmedText.match(FIRST_CAPITAL_REGEX);
  if (firstCapitalMatch?.index !== undefined && firstCapitalMatch.index > 0) {
    const removedPrefix = trimmedText
      .substring(0, firstCapitalMatch.index)
      .trim();
    const caption = trimmedText.substring(firstCapitalMatch.index).trim();
    return { caption, removedPrefix: removedPrefix || null };
  }

  // Capitalize first letter if no capital found
  if (trimmedText.length > 0) {
    return {
      caption: trimmedText.charAt(0).toUpperCase() + trimmedText.slice(1),
      removedPrefix: null,
    };
  }

  return { caption: trimmedText, removedPrefix: null };
}

/**
 * Sanitize AI-generated captions for display
 * - Removes generic AI prompts like "Describe this engineering image..."
 * - Ensures captions start with a full sentence
 * - Removes incomplete sentences at the end
 *
 * @param caption - The raw caption from the RAG backend
 * @returns Object with sanitized caption and any removed prefix
 */
export function sanitizeCaption(caption: string | null | undefined): {
  caption: string | null;
  removedPrefix: string | null;
} {
  if (!caption) {
    return { caption: null, removedPrefix: null };
  }

  const lower = caption.toLowerCase();

  // Filter out generic AI prompts
  if (
    lower.includes("describe this") ||
    lower.includes("engineering image") ||
    lower.includes("focus on visible")
  ) {
    return { caption: null, removedPrefix: null };
  }

  // Find first full sentence
  const { caption: startCaption, removedPrefix } =
    findFirstSentenceStart(caption);
  if (!startCaption) {
    return { caption: null, removedPrefix };
  }

  // Remove incomplete end
  const finalCaption = removeIncompleteEnd(startCaption);
  return { caption: finalCaption || null, removedPrefix };
}
