/**
 * Function Calling Type Definitions
 * Defines the three core functions for autonomous Gemini operations
 */

// ==================== SAVE STRUGGLE ITEM ====================
export interface SaveStruggleItemParams {
  word: string;
  struggle_type: 'pronunciation' | 'meaning' | 'usage' | 'grammar';
  context: string;
  timestamp: string; // ISO string
  severity?: 'minor' | 'moderate' | 'significant';
}

export interface StruggleItem extends SaveStruggleItemParams {
  id: string;
  sessionId: string;
  userId: string;
  createdAt: Date;
}

// ==================== UPDATE USER PROFILE ====================
export interface UpdateUserProfileParams {
  category: 'topic' | 'interest' | 'learning_style' | 'difficulty_preference';
  value: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence?: number; // 0-1
}

export interface UserProfilePreference {
  category: string;
  value: string;
  sentiment: string;
  confidence: number;
  updatedAt: Date;
}

// ==================== SHOW SESSION SUMMARY ====================
export interface ShowSessionSummaryParams {
  did_well: string[];
  work_on: string[];
  stars: 1 | 2 | 3 | 4 | 5;
  summary_text: string;
  encouragement?: string;
}

export interface SessionSummary extends ShowSessionSummaryParams {
  sessionId: string;
  userId: string;
  missionId: string;
  durationSeconds: number;
  createdAt: Date;
}

// ==================== FUNCTION DECLARATIONS ====================
export interface FunctionParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string };
}

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, FunctionParameter>;
    required: string[];
  };
}

/**
 * Core function declarations for the Gemini Live API
 * These enable autonomous tracking during tutoring sessions
 */
export const TUTOR_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'save_struggle_item',
    description: 'Call this function when you notice the student struggling with a word, phrase, or concept. This helps track areas that need more practice.',
    parameters: {
      type: 'object',
      properties: {
        word: {
          type: 'string',
          description: 'The word or phrase the student struggled with',
        },
        struggle_type: {
          type: 'string',
          description: 'The type of struggle observed',
          enum: ['pronunciation', 'meaning', 'usage', 'grammar'],
        },
        context: {
          type: 'string',
          description: 'Brief context about how the struggle manifested',
        },
        timestamp: {
          type: 'string',
          description: 'ISO timestamp of when the struggle occurred',
        },
        severity: {
          type: 'string',
          description: 'How significant the struggle was',
          enum: ['minor', 'moderate', 'significant'],
        },
      },
      required: ['word', 'struggle_type', 'context', 'timestamp'],
    },
  },
  {
    name: 'update_user_profile',
    description: "Call this function when you learn something about the student's preferences, interests, or learning style. This helps personalize future sessions.",
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'The type of preference being recorded',
          enum: ['topic', 'interest', 'learning_style', 'difficulty_preference'],
        },
        value: {
          type: 'string',
          description: 'The specific preference value (e.g., "travel", "visual learner")',
        },
        sentiment: {
          type: 'string',
          description: 'Whether the student has positive, negative, or neutral feelings about this',
          enum: ['positive', 'negative', 'neutral'],
        },
        confidence: {
          type: 'number',
          description: 'How confident you are about this preference (0-1)',
        },
      },
      required: ['category', 'value', 'sentiment'],
    },
  },
  {
    name: 'show_session_summary',
    description: 'Call this function at the end of a session to provide a summary. This triggers a visual summary display for the student.',
    parameters: {
      type: 'object',
      properties: {
        did_well: {
          type: 'array',
          description: 'List of things the student did well during the session',
          items: { type: 'string' },
        },
        work_on: {
          type: 'array',
          description: 'List of areas the student should practice more',
          items: { type: 'string' },
        },
        stars: {
          type: 'number',
          description: 'Overall performance rating from 1 to 5 stars',
          enum: ['1', '2', '3', '4', '5'],
        },
        summary_text: {
          type: 'string',
          description: 'A brief encouraging summary paragraph for the student',
        },
        encouragement: {
          type: 'string',
          description: 'Optional motivational message',
        },
      },
      required: ['did_well', 'work_on', 'stars', 'summary_text'],
    },
  },
];

// ==================== FUNCTION CALL/RESPONSE TYPES ====================
export interface FunctionCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface FunctionResponse {
  id: string;
  name: string;
  response: {
    result: string;
    error?: string;
  };
}

// ==================== DEFAULT FUNCTION CALLING INSTRUCTIONS ====================
export const DEFAULT_FUNCTION_CALLING_INSTRUCTIONS = `You have access to the following functions that you should use autonomously during the conversation:

1. **save_struggle_item** - Call this when you notice the student:
   - Mispronouncing a word or struggling to say it correctly
   - Misunderstanding the meaning of a word or phrase
   - Using incorrect grammar or sentence structure
   - Struggling to express themselves or find the right words

2. **update_user_profile** - Call this when you discover:
   - Topics the student enjoys talking about
   - Their preferred learning style (visual, auditory, hands-on)
   - Interests, hobbies, or things they mention positively
   - Difficulty preferences or pace they're comfortable with

3. **show_session_summary** - Call this ONLY when the session is ending to display:
   - 2-4 specific things the student did well
   - 2-3 areas they should work on
   - A 1-5 star rating based on their performance
   - An encouraging summary paragraph

Use these functions naturally during conversation without announcing them to the student.`;
