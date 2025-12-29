/**
 * RAG URL utilities
 * Resolves relative image URLs from the RAG backend
 */

// Top-level regex patterns for performance
const FRC_PATH_REGEX = /\/images\/frc\/(\d{1,5})\//i;
const IMAGE_ID_REGEX = /^(\d{1,5})_\d{4}_/;
const TEAM_PATTERN_REGEX = /(?:teams?[/_-]|team[/_-]|frc)(\d{1,5})/i;
const IMG_PLACEHOLDER_REGEX = /\[img:[^\]]+\]/i;
const IMG_PLACEHOLDER_ENCODED_REGEX = /%5Bimg(?::|%3A)/i;

/**
 * Get the full URL for a RAG image
 * @param path - The image path (relative or absolute)
 * @returns Full URL to the image, or null if path is invalid
 */
export function getRagImageUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  // Never treat inline placeholder markers as real image URLs.
  // If this happens, it usually means the model produced markdown image syntax
  // like ![]([img:...]) or some upstream metadata got corrupted.
  if (
    IMG_PLACEHOLDER_REGEX.test(path) ||
    IMG_PLACEHOLDER_ENCODED_REGEX.test(path)
  ) {
    return null;
  }

  // If it's already an absolute URL, return as is
  if (path.startsWith("http")) {
    return path;
  }

  // Use the public backend URL from env
  const baseUrl = process.env.NEXT_PUBLIC_RAG_BACKEND_URL || "";

  // Ensure path has a leading slash
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!baseUrl) {
    // If baseUrl is missing, return the path as-is
    // The browser will try to load from the frontend's domain
    return cleanPath;
  }

  // Ensure we don't double slash
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return `${cleanBase}${cleanPath}`;
}

/**
 * Extract team number from a RAG image URL or ID
 * Patterns supported:
 * - /images/frc/{TEAM}/{YEAR}/...
 * - {TEAM}_{YEAR}_p{N}_i{N}_hash.jpg
 * - frc{TEAM} or team-{TEAM} or team_{TEAM}
 *
 * @param url - The URL or image ID to parse
 * @returns Team citation string like "Team 254" or null if not found
 */
export function extractTeamFromUrl(
  url: string | null | undefined
): string | null {
  if (!url) {
    return null;
  }

  // Standard FRC path format: /images/frc/{TEAM}/{YEAR}/...
  const frcPathMatch = url.match(FRC_PATH_REGEX);
  if (frcPathMatch?.[1]) {
    return `Team ${frcPathMatch[1]}`;
  }

  // Image ID format: 166_2024_p4_i0_5ae3bfae
  const imageIdMatch = url.match(IMAGE_ID_REGEX);
  if (imageIdMatch?.[1]) {
    return `Team ${imageIdMatch[1]}`;
  }

  // Other patterns: teams/1234, team_1234, team-1234, frc1234
  const teamMatch = url.match(TEAM_PATTERN_REGEX);
  if (teamMatch?.[1]) {
    return `Team ${teamMatch[1]}`;
  }

  return null;
}

/**
 * Extract team from RAG image metadata
 * @param image - The RAG image object
 * @returns Team citation string or null
 */
export function extractTeamFromImage(
  image: {
    url?: string;
    image_id?: string;
    team?: string | number;
    team_number?: string | number;
    teamNumber?: string | number;
  } | null
): string | null {
  if (!image) {
    return null;
  }

  // Check direct metadata first
  const teamNum = image.team || image.team_number || image.teamNumber;
  if (teamNum) {
    return `Team ${teamNum}`;
  }

  // Try URL patterns
  const teamFromUrl = extractTeamFromUrl(image.url);
  if (teamFromUrl) {
    return teamFromUrl;
  }

  // Try image_id patterns
  const teamFromId = extractTeamFromUrl(image.image_id);
  if (teamFromId) {
    return teamFromId;
  }

  return null;
}
