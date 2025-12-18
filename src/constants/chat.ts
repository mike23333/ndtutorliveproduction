// Chat Constants - Extracted magic numbers for maintainability

// Session and message limits
export const MAX_MESSAGES = 100;
export const MAX_MESSAGES_WITH_AUDIO = 20;

// Audio settings
export const AUDIO_SAMPLE_RATE_INPUT = 16000;  // User input (WAV)
export const AUDIO_SAMPLE_RATE_OUTPUT = 24000; // AI output (PCM)
export const AUDIO_EXTRACTION_SECONDS = 10;

// Timer thresholds (seconds)
export const TIMER_LOW_TIME_SECONDS = 60;
export const TIMER_CRITICAL_SECONDS = 30;
export const TIMER_RADIUS = 45; // SVG timer radius

// Session timeouts (milliseconds)
export const SESSION_END_TIMEOUT_MS = 30000;
export const SESSION_RESUME_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
export const RECONNECT_DELAY_MS = 2000;

// UI delays (milliseconds)
export const INITIAL_HI_DELAY_MS = 500;
export const SESSION_DISCONNECT_DELAY_MS = 500;
export const TOAST_NAVIGATION_DELAY_MS = 500;
export const AUDIO_PLAYBACK_TIMEOUT_MS = 30000;

// Deduplication windows (milliseconds)
export const REVIEW_ITEM_DEDUPE_WINDOW_MS = 30000;
export const MASTERY_RATE_LIMIT_MS = 10000;

// Progress thresholds (percentage as decimal)
export const TIMER_GREEN_THRESHOLD = 0.5;
export const TIMER_AMBER_THRESHOLD = 0.25;
export const TIMER_ORANGE_THRESHOLD = 0.1;

// Minimum session thresholds
export const MIN_SESSION_SECONDS = 5;
export const MIN_MESSAGES_FOR_CONFIRM = 2;

// Layout constants
export const CONTROL_BAR_HEIGHT = 240;
export const MESSAGE_PADDING = 16;
