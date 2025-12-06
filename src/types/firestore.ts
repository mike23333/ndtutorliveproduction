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
 * User Document
 * Collection: users
 */
export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  level?: ProficiencyLevel;
  classCode?: string;
  groupIds?: string[];
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
  groupId?: string;
  targetLevel?: ProficiencyLevel;
  isActive: boolean;
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

/**
 * Group Document
 * Collection: groups
 */
export interface GroupDocument {
  id: string;
  teacherId: string;
  teacherName: string;
  name: string;
  description?: string;
  studentIds: string[];
  missionIds?: string[];
  classCode: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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

export type CreateGroupInput = Omit<GroupDocument, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

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

export type UpdateGroupInput = Partial<Omit<GroupDocument, 'id' | 'createdAt'>> & {
  id: string;
};
