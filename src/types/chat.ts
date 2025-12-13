/**
 * Type definitions for the chat interface
 */

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    images?: ImageResult[];
    metadata?: MessageMetadata;
}

export interface ImageResult {
    web_path: string;
    page?: number;
    relevance?: number;
    context_summary?: string;
}

export interface MessageMetadata {
    matched_pieces?: string[];
    enhanced_query?: string;
    context_sources?: number;
    game_piece_context?: string;
    external_sources_section?: string;
    external_sources?: ExternalSource[];
    search_quota?: SearchQuota;
    images?: ImageResult[];
}

export interface ExternalSource {
    type: 'youtube' | 'web';
    title: string;
    link: string;
    channel?: string;
}

export interface SearchQuota {
    remaining: number;
    limit: number;
}

export interface OpenRouterQuota {
    remaining: number | null;
    limit: number | null;
}

export interface ModelOption {
    id: string;
    name: string;
    free: boolean;
}

export interface TeamInfo {
    team: string;
    year: string;
}

export interface TourStep {
    target: string;
    title: string;
    description: string;
    position: 'bottom-start' | 'top' | 'bottom';
}
