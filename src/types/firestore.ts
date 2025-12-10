/**
 * Firestore Document Type Definitions
 *
 * These types represent the structure of documents stored in Firestore collections.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * User role types
 */
export type UserRole = 'student' | 'teacher' | 'admin';

/**
 * User proficiency levels (CEFR scale)
 * A1, A2 = Beginner
 * B1, B2 = Intermediate
 * C1, C2 = Advanced
 */
export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * AI conversation tone
 */
export type ConversationTone = 'friendly' | 'formal' | 'encouraging' | 'challenging';

/**
 * Latest badge info for quick display on profile
 */
export interface LatestBadgeInfo {
  id: string;
  name: string;
  iconName: string;
  earnedAt: Timestamp;
}

/**
 * User Document
 * Collection: users
 */
export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;           // Profile photo URL
  role: UserRole;
  level?: ProficiencyLevel;
  // Student fields - teacher assignment
  teacherId?: string;        // Teacher's UID who owns this student
  teacherName?: string;      // Denormalized for display
  joinedClassAt?: Timestamp; // When student joined the class
  // Teacher fields
  classCode?: string;        // Unique 6-char code for students to join (teachers only)
  // Aggregate stats for fast UI reads (denormalized)
  totalStars?: number;
  totalSessions?: number;
  totalPracticeTime?: number; // in seconds
  lastSessionAt?: Timestamp;
  // Streak tracking
  currentStreak?: number;
  lastPracticeDate?: string; // YYYY-MM-DD format for easy comparison
  longestStreak?: number;
  // Badge tracking
  badgeIds?: string[];                    // Array of earned badge IDs
  badgeCount?: number;                    // Total badges earned
  latestBadge?: LatestBadgeInfo | null;   // Most recent badge for display
  uniqueScenariosCompleted?: string[];    // Array of unique missionIds completed
  consecutiveFiveStarSessions?: number;   // Current consecutive 5-star streak (resets on non-5-star)
  customLessonsCreated?: number;          // Count of custom lessons created
  // Continue Learning - tracks incomplete sessions
  currentLesson?: {
    missionId: string;
    title: string;
    imageUrl?: string;
    startedAt: Timestamp;
  } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Vocabulary item for missions
 */
export interface VocabularyItem {
  word: string;
  definition?: string;
  example?: string;
}

/**
 * Mission Document
 * Collection: missions
 */
export interface MissionDocument {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  scenario: string;
  tone: ConversationTone;
  vocabList: VocabularyItem[];
  imageUrl?: string;
  imageStoragePath?: string; // Firebase Storage path for cleanup
  groupId?: string;
  targetLevel?: ProficiencyLevel;
  isActive: boolean;
  // New fields for enhanced lesson creation
  systemPrompt?: string; // Full system prompt (replaces scenario usage)
  durationMinutes?: number; // Session time limit
  functionCallingEnabled?: boolean; // Whether to enable function calling
  functionCallingInstructions?: string; // Custom instructions for function calling
  isFirstLesson?: boolean; // Teacher-designated first lesson for new students
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Chat message in a session
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
  vocabUsed?: string[];
}

/**
 * Feedback from AI on session performance
 */
export interface SessionFeedback {
  vocabMastery: {
    [word: string]: {
      timesUsed: number;
      usedCorrectly: boolean;
      examples: string[];
    };
  };
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  generatedAt: Timestamp;
}

/**
 * Session Document
 * Collection: sessions
 */
export interface SessionDocument {
  id: string;
  userId: string;
  userName: string;
  missionId: string;
  missionTitle: string;
  messages: ChatMessage[];
  startTime: Timestamp;
  endTime?: Timestamp;
  feedback?: SessionFeedback;
  status: 'in_progress' | 'completed' | 'abandoned';
  messageCount: number;
  duration?: number; // in seconds
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// GroupDocument removed - using direct teacherId on students instead

/**
 * Analytics aggregation for teacher dashboard
 */
export interface AnalyticsDocument {
  id: string;
  teacherId: string;
  groupId?: string;
  missionId?: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Timestamp;
  metrics: {
    totalSessions: number;
    completedSessions: number;
    avgSessionDuration: number;
    avgScore: number;
    activeStudents: number;
    vocabMasteryRate: number;
  };
  createdAt: Timestamp;
}

/**
 * Input types for creating documents (without auto-generated fields)
 */
export type CreateUserInput = Omit<UserDocument, 'uid' | 'createdAt' | 'updatedAt'> & {
  uid?: string;
};

export type CreateMissionInput = Omit<MissionDocument, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export type CreateSessionInput = Omit<SessionDocument, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

// CreateGroupInput removed - GroupDocument no longer exists

/**
 * Update types (all fields optional except id)
 */
export type UpdateUserInput = Partial<Omit<UserDocument, 'uid' | 'createdAt'>> & {
  uid: string;
};

export type UpdateMissionInput = Partial<Omit<MissionDocument, 'id' | 'createdAt'>> & {
  id: string;
};

export type UpdateSessionInput = Partial<Omit<SessionDocument, 'id' | 'createdAt'>> & {
  id: string;
};

// UpdateGroupInput removed - GroupDocument no longer exists

// ==================== NEW DOCUMENT TYPES ====================

/**
 * Prompt Template Document
 * Collection: promptTemplates
 * Allows teachers to save and reuse system prompts
 */
export interface PromptTemplateDocument {
  id: string;
  teacherId: string;
  name: string;
  systemPrompt: string;
  defaultDurationMinutes?: number;
  functionCallingInstructions?: string;
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreatePromptTemplateInput = Omit<PromptTemplateDocument, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'> & {
  id?: string;
  isDefault?: boolean;
};

export type UpdatePromptTemplateInput = Partial<Omit<PromptTemplateDocument, 'id' | 'createdAt'>> & {
  id: string;
};

/**
 * Review Item Document (NEW - replaces StruggleDocument)
 * Collection: users/{userId}/reviewItems
 * Tracks linguistic errors for review lessons with enhanced detail
 */
export type ReviewItemErrorType = 'Grammar' | 'Pronunciation' | 'Vocabulary' | 'Cultural';

export interface ReviewItemDocument {
  id: string;
  userId: string;
  sessionId: string;
  missionId: string | null;  // Lesson context
  errorType: ReviewItemErrorType;
  severity: number;  // 1-10 scale
  userSentence: string;  // What the user said
  correction: string;  // The correct way to say it
  explanation?: string;  // Brief rule explanation
  createdAt: Timestamp;
  // Review tracking for weekly review generation
  reviewCount: number;
  lastReviewedAt: Timestamp | null;
  mastered: boolean;
  includedInReviews: string[];  // Array of review IDs this item was included in
}

/**
 * @deprecated Use ReviewItemDocument instead
 * Struggle Item Document (LEGACY)
 * Collection: users/{userId}/struggles
 * Kept for migration compatibility
 */
export interface StruggleDocument {
  id: string;
  userId: string;
  sessionId: string;
  missionId: string | null;
  word: string;
  struggleType: 'pronunciation' | 'meaning' | 'usage' | 'grammar';
  context: string;
  severity: 'minor' | 'moderate' | 'significant';
  timestamp: string; // ISO timestamp from Gemini
  createdAt: Timestamp;
  // Review tracking for weekly review lessons
  reviewCount: number;
  lastReviewedAt: Timestamp | null;
  mastered: boolean;
  includedInReviews: string[]; // Array of review IDs this struggle was included in
}

/**
 * User Profile Preference
 * Single preference entry in user profile
 */
export interface UserProfilePreference {
  category: string;
  value: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  updatedAt: Timestamp;
}

/**
 * User Profile Document
 * Collection: users/{userId}/profile/preferences
 * Stores learned preferences about the user
 */
export interface UserProfileDocument {
  preferences: UserProfilePreference[];
  lastUpdated: Timestamp;
}

/**
 * Session Summary Document
 * Stores the final summary from show_session_summary function call
 */
export interface SessionSummaryDocument {
  sessionId: string;
  userId: string;
  missionId: string;
  didWell: string[];
  workOn: string[];
  stars: 1 | 2 | 3 | 4 | 5;
  summaryText: string;
  encouragement?: string;
  durationSeconds: number;
  createdAt: Timestamp;
}

/**
 * Review Lesson Document
 * Collection: users/{userId}/reviewLessons
 * Generated weekly for personalized review practice based on student struggles
 */
export interface ReviewLessonDocument {
  id: string;
  userId: string;
  weekStart: string; // ISO date (YYYY-MM-DD) for deduplication
  status: 'pending' | 'ready' | 'completed' | 'skipped';
  generatedPrompt: string; // Level-aware system prompt for Gemini Live API
  targetStruggles: string[]; // Array of struggle IDs included
  struggleWords: string[]; // Words/phrases for UI display
  userLevel: ProficiencyLevel; // Student's level when review was generated
  estimatedMinutes: number; // Usually 5
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  sessionId: string | null; // Session ID when completed
  stars: number | null; // Stars earned upon completion (1-5)
}

/**
 * System Template Document
 * Collection: systemTemplates
 * Stores editable system-wide templates (e.g., weekly review meta-prompt)
 */
export interface SystemTemplateDocument {
  id: string;
  name: string;
  description?: string;
  template: string; // Template with placeholders like {{level}}, {{struggles}}
  placeholders: string[]; // List of available placeholders for UI
  updatedAt: Timestamp;
  updatedBy: string; // User ID of last editor
}

/**
 * Custom Lesson Document
 * Collection: users/{userId}/customLessons
 * Student-created personalized practice lessons
 */
export interface CustomLessonDocument {
  id: string;
  userId: string;
  title: string;
  description: string; // What they want to practice
  imageUrl?: string;
  imageStoragePath?: string; // Firebase Storage path for cleanup
  systemPrompt: string; // Generated from template with placeholders filled
  durationMinutes: 5; // Fixed at 5 minutes
  createdAt: Timestamp;
  lastPracticedAt?: Timestamp;
  practiceCount: number;
}

export type CreateCustomLessonInput = Omit<CustomLessonDocument, 'id' | 'createdAt' | 'lastPracticedAt' | 'practiceCount'> & {
  id?: string;
};

export type UpdateCustomLessonInput = Partial<Pick<CustomLessonDocument, 'title' | 'description' | 'imageUrl' | 'imageStoragePath' | 'systemPrompt'>> & {
  id: string;
};
