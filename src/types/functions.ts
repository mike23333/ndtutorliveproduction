/**
 * Function Calling Type Definitions
 * Defines the three core functions for autonomous Gemini operations
 */

// ==================== MARK FOR REVIEW (Linguistic Errors) ====================
export type ErrorType = 'Grammar' | 'Pronunciation' | 'Vocabulary' | 'Cultural';

export interface MarkForReviewParams {
  error_type: ErrorType;
  severity: number; // 1-10 scale (1 = minor, 10 = critical)
  user_sentence: string;
  correction: string;
  explanation?: string;
}

// Legacy type alias for migration compatibility
export interface SaveStruggleItemParams {
  word: string;
  struggle_type: 'pronunciation' | 'meaning' | 'usage' | 'grammar';
  context: string;
  timestamp: string;
  severity?: 'minor' | 'moderate' | 'significant';
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

// ==================== MARK ITEM MASTERED (Review Lesson) ====================
export interface MarkItemMasteredParams {
  review_item_id: string;
  confidence: 'low' | 'medium' | 'high';
}

// ==================== PLAY STUDENT AUDIO (Review Lesson) ====================
export interface PlayStudentAudioParams {
  review_item_id: string;
}

// ==================== MARK TASK COMPLETE (Lesson Tasks) ====================
export interface MarkTaskCompleteParams {
  task_id: string;
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
    name: 'mark_for_review',
    description: 'Call this silently when the student makes a linguistic error. Do not interrupt the conversation flow.',
    parameters: {
      type: 'object',
      properties: {
        error_type: {
          type: 'string',
          description: 'The type of linguistic error',
          enum: ['Grammar', 'Pronunciation', 'Vocabulary', 'Cultural'],
        },
        severity: {
          type: 'number',
          description: 'Error severity from 1 (minor) to 10 (critical)',
        },
        user_sentence: {
          type: 'string',
          description: 'The approximate sentence the user just said',
        },
        correction: {
          type: 'string',
          description: 'The correct native way to say it',
        },
        explanation: {
          type: 'string',
          description: 'A very brief explanation of the rule',
        },
      },
      required: ['error_type', 'user_sentence', 'correction', 'severity'],
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
  {
    name: 'mark_item_mastered',
    description: 'Mark a review item as mastered when the student demonstrates clear understanding and correct usage. Do NOT call if student just parrots/repeats after you or seems unsure.',
    parameters: {
      type: 'object',
      properties: {
        review_item_id: {
          type: 'string',
          description: 'ID of the reviewItem to mark as mastered',
        },
        confidence: {
          type: 'string',
          description: "AI's confidence in the student's mastery of this item",
          enum: ['low', 'medium', 'high'],
        },
      },
      required: ['review_item_id', 'confidence'],
    },
  },
  {
    name: 'play_student_audio',
    description: 'Play a short audio clip of a mistake the student made previously. Use sparingly when hearing themselves would help the student understand and correct the error. Only works if the item has audio available.',
    parameters: {
      type: 'object',
      properties: {
        review_item_id: {
          type: 'string',
          description: 'ID of the reviewItem containing the audio to play',
        },
      },
      required: ['review_item_id'],
    },
  },
  {
    name: 'mark_task_complete',
    description: 'Call when student successfully accomplishes a lesson task/objective. Only call when the task is clearly completed, not when partially done or just discussed.',
    parameters: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the completed task (e.g., "task-1", "task-2")',
        },
      },
      required: ['task_id'],
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

1. **mark_for_review** - Call this SILENTLY when the student makes a linguistic error:
   - Grammar mistakes (wrong tense, word order, conjugation)
   - Pronunciation errors (incorrect sounds, stress, intonation)
   - Vocabulary misuse (wrong word choice, false friends)
   - Cultural/pragmatic errors (inappropriate formality, expressions)

   Include the severity (1-10), what they said, the correction, and brief explanation.
   Do NOT interrupt the conversation flow - just log it silently.

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

4. **mark_task_complete** - Call when student accomplishes a lesson task:
   - Only call when the student clearly completes the objective
   - Use the exact task_id provided in the system prompt
   - Don't mark tasks complete for partial completion or just discussing

Use these functions naturally during conversation without announcing them to the student.`;
