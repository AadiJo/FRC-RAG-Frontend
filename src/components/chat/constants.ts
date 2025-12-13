/**
 * Constants for the chat interface
 */

// Scroll behavior
export const SCROLL_THRESHOLD = 100;

// Textarea sizing
export const DEFAULT_TEXTAREA_HEIGHT = 40;
export const MAX_TEXTAREA_HEIGHT = 200;

// Animation delays
export const UPLOAD_SUCCESS_DISPLAY_MS = 1200;

// Interactive tour step definitions
export const TOUR_STEPS = [
    {
        target: '#settingsToggle',
        title: 'Settings',
        description: 'Access your API keys, model selection, and custom instructions here. All API keys are free!',
        position: 'bottom-start' as const,
    },
    {
        target: '#helpToggle',
        title: 'Help & Tutorial',
        description: 'Click here anytime to view the welcome guide or restart this tour.',
        position: 'bottom-start' as const,
    },
    {
        target: '#chatInput',
        title: 'Ask Questions',
        description: 'Type your FRC questions here. Press Enter to send, or Shift+Enter for a new line.',
        position: 'top' as const,
    },
    {
        target: '#toolsToggle',
        title: 'Tools Menu',
        description: 'Enable reasoning mode, web search, and YouTube search to enhance your answers.',
        position: 'top' as const,
    },
    {
        target: 'button[title="Upload PDF"]',
        title: 'Upload PDFs',
        description: 'Add your own team technical binders to expand the knowledge base.',
        position: 'top' as const,
    },
] as const;

// localStorage keys
export const STORAGE_KEYS = {
    API_KEY: 'frc_rag_api_key',
    YOUTUBE_KEY: 'frc_rag_youtube_key',
    SERP_KEY: 'frc_rag_serp_key',
    TUTORIAL_SEEN_PREFIX: 'frc_rag_tutorial_seen_',
} as const;
