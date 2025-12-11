/**
 * AI Role Configuration Types
 * Defines the structure for AI tutor personas and behavior settings
 */

/**
 * CEFR language proficiency levels
 */
export type StudentLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * Persona types for AI role-playing
 */
export type PersonaType = 'actor' | 'tutor';

/**
 * Tone variations for AI responses
 */
export type ToneType = 'friendly' | 'strict' | 'fast' | 'confused';

/**
 * Level-specific configuration for adaptive learning
 */
export interface LevelConfig {
  /**
   * Speech speed multiplier (0.5 = slow, 1.0 = normal, 1.5 = fast)
   */
  speechSpeed: number;

  /**
   * Average sentence complexity (1-10 scale)
   */
  sentenceComplexity: number;

  /**
   * Wait time before AI responds (in milliseconds)
   */
  waitTime: number;

  /**
   * Vocabulary difficulty level
   */
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced';

  /**
   * Grammar correction frequency (0-100%)
   */
  correctionFrequency: number;
}

/**
 * Complete AI Role configuration
 */
export interface AIRole {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Mission ID for tracking (from Firestore mission document)
   */
  missionId?: string;

  /**
   * Teacher ID who created the mission (for cost tracking)
   */
  teacherId?: string;

  /**
   * Display name for the role
   */
  name: string;

  /**
   * Persona type (actor in scenario vs tutor mode)
   */
  persona: PersonaType;

  /**
   * Base system prompt for the AI
   */
  systemPrompt: string;

  /**
   * Current tone/behavior mode
   */
  tone: ToneType;

  /**
   * Student's CEFR level
   */
  level: StudentLevel;

  /**
   * Level-specific configuration
   */
  levelConfig: LevelConfig;

  /**
   * Scenario description (for actor persona)
   */
  scenario?: string;

  /**
   * Target vocabulary words for this session
   */
  targetVocabulary?: string[];

  /**
   * Whether this is a user-created custom role
   */
  isCustom: boolean;

  /**
   * Icon/emoji for visual representation
   */
  icon?: string;

  /**
   * Background color for the role card
   */
  color?: string;

  /**
   * Whether function calling is enabled for this role
   */
  functionCallingEnabled?: boolean;

  /**
   * Custom function calling instructions (uses default if not provided)
   */
  functionCallingInstructions?: string;

  /**
   * Session duration limit in minutes
   */
  durationMinutes?: number;

  /**
   * Whether this is a review lesson session
   */
  isReviewLesson?: boolean;

  /**
   * Review lesson ID (if isReviewLesson is true)
   */
  reviewId?: string;

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last modified timestamp
   */
  updatedAt: Date;
}

/**
 * Preset role template
 */
export interface RolePreset {
  name: string;
  persona: PersonaType;
  tone: ToneType;
  scenario: string;
  icon: string;
  color: string;
  systemPromptTemplate: string;
}

/**
 * Level configuration presets mapped by CEFR level
 */
export const LEVEL_CONFIGS: Record<StudentLevel, LevelConfig> = {
  A1: {
    speechSpeed: 0.7,
    sentenceComplexity: 2,
    waitTime: 2000,
    vocabularyLevel: 'basic',
    correctionFrequency: 20,
  },
  A2: {
    speechSpeed: 0.8,
    sentenceComplexity: 3,
    waitTime: 1500,
    vocabularyLevel: 'basic',
    correctionFrequency: 30,
  },
  B1: {
    speechSpeed: 0.9,
    sentenceComplexity: 5,
    waitTime: 1200,
    vocabularyLevel: 'intermediate',
    correctionFrequency: 40,
  },
  B2: {
    speechSpeed: 1.0,
    sentenceComplexity: 6,
    waitTime: 1000,
    vocabularyLevel: 'intermediate',
    correctionFrequency: 50,
  },
  C1: {
    speechSpeed: 1.1,
    sentenceComplexity: 8,
    waitTime: 800,
    vocabularyLevel: 'advanced',
    correctionFrequency: 60,
  },
  C2: {
    speechSpeed: 1.2,
    sentenceComplexity: 10,
    waitTime: 500,
    vocabularyLevel: 'advanced',
    correctionFrequency: 70,
  },
};

/**
 * Default role presets
 */
export const DEFAULT_PRESETS: RolePreset[] = [
  {
    name: 'Friendly Barista',
    persona: 'actor',
    tone: 'friendly',
    scenario: 'Ordering at a busy café',
    icon: '☕',
    color: '#8b5cf6', // purple
    systemPromptTemplate: 'You are a friendly barista at a busy café called "The Daily Grind".',
  },
  {
    name: 'Hotel Receptionist',
    persona: 'actor',
    tone: 'friendly',
    scenario: 'Checking into a hotel',
    icon: '🏨',
    color: '#3b82f6', // blue
    systemPromptTemplate: 'You are a professional hotel receptionist at a 4-star hotel.',
  },
  {
    name: 'Fast-Talking Shopkeeper',
    persona: 'actor',
    tone: 'fast',
    scenario: 'Shopping at a local market',
    icon: '🛍️',
    color: '#f59e0b', // amber
    systemPromptTemplate: 'You are a fast-talking, enthusiastic shopkeeper at a local market.',
  },
  {
    name: 'Patient Tutor',
    persona: 'tutor',
    tone: 'friendly',
    scenario: 'General English practice',
    icon: '👨‍🏫',
    color: '#10b981', // green
    systemPromptTemplate: 'You are a patient, encouraging English tutor focused on building confidence.',
  },
  {
    name: 'Strict Grammar Teacher',
    persona: 'tutor',
    tone: 'strict',
    scenario: 'Grammar and pronunciation practice',
    icon: '📚',
    color: '#ef4444', // red
    systemPromptTemplate: 'You are a strict but fair grammar teacher who focuses on accuracy.',
  },
  {
    name: 'Confused Tourist',
    persona: 'actor',
    tone: 'confused',
    scenario: 'Helping a lost tourist',
    icon: '🗺️',
    color: '#ec4899', // pink
    systemPromptTemplate: 'You are a confused tourist who needs help finding your way around the city.',
  },
];
