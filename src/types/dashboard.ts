// Dashboard-specific types

import type { ProficiencyLevel, LessonTask } from './firestore';

export type { LessonTask } from './firestore';

export type TabType = 'lessons' | 'students' | 'insights' | 'billing' | 'templates';

export interface LessonData {
  id: string;
  title: string;
  systemPrompt: string;
  durationMinutes: number;
  imageUrl: string | null;
  imageStoragePath?: string | null;
  functionCallingEnabled: boolean;
  assignedGroups: string[];
  status: 'draft' | 'published';
  completionRate: number;
  studentsCompleted: number;
  totalStudents: number;
  targetLevel?: ProficiencyLevel | null;
  isFirstLesson?: boolean;
  assignedStudentIds?: string[]; // For private student assignment
  tasks?: LessonTask[]; // Optional lesson objectives for task panel
  notCompletedStudents?: { uid: string; name: string; level?: ProficiencyLevel }[];
}

export interface LessonFormData {
  title: string;
  systemPrompt: string;
  durationMinutes: number;
  imageUrl: string | null;
  imageStoragePath: string | null;
  targetLevel: ProficiencyLevel | null;
  isFirstLesson?: boolean;
  assignedStudentIds?: string[]; // For private student assignment
  tasks?: LessonTask[]; // Optional lesson objectives
}

export interface ClassPulseInsight {
  type: 'warning' | 'info' | 'success';
  level: string | null;
  title: string;
  message: string;
}

export interface LevelAnalytics {
  studentCount: number;
  sessionCount: number;
  avgStars: number;
  totalPracticeMinutes: number;
  wordsMastered: number;
  trends: {
    sessions: string;
    avgStars: string;
  };
  lessons: LessonAnalytics[];
  students: StudentAnalytics[];
  topStruggles: StruggleItem[];
}

export interface LessonAnalytics {
  missionId: string;
  title: string;
  completions: number;
  avgStars: number;
  warning: boolean;
  struggleCount?: number;
  topStruggles?: { word: string; count: number }[];
}

export interface StudentAnalytics {
  userId: string;
  displayName: string;
  activityStatus: 'active' | 'warning' | 'inactive';
  sessionCount: number;
  avgStars: number;
}

/**
 * StruggleItem for teacher dashboard display
 * Updated to work with new reviewItems schema
 * - text: The correction (what they should say) or truncated userSentence
 * - type: Error type (Grammar, Pronunciation, Vocabulary, Cultural)
 */
export interface StruggleItem {
  text: string;  // Correction or userSentence (truncated)
  type: string;  // Error type: Grammar, Pronunciation, Vocabulary, Cultural
  count: number;
  severity: 'low' | 'medium' | 'high';  // Mapped from 1-10 scale
}

export interface CostData {
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  costPerStudent: number;
  dailyCost: number;
  monthlyCost: number;
}

export interface StudentCostData {
  userId: string;
  displayName: string;
  totalCost: number;
  sessionCount: number;
  avgCostPerSession: number;
  inputTokens: number;
  outputTokens: number;
}

export interface AnalyticsData {
  period: string;
  generatedAt: string;
  byLevel: Record<string, LevelAnalytics>;
  totals: {
    studentCount: number;
    sessionCount: number;
    avgStars: number;
    totalPracticeMinutes: number;
    wordsMastered: number;
  };
  // Cost tracking
  costs?: CostData;
  studentCosts?: StudentCostData[];
}

export type AnalyticsPeriod = 'week' | 'month' | 'all-time';
export type AnalyticsLevel = 'all' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Class Insights types
export type MistakeErrorType = 'Grammar' | 'Pronunciation' | 'Vocabulary' | 'Cultural';

export interface ClassMistake {
  id: string;
  studentId: string;
  studentName: string;
  errorType: MistakeErrorType;
  userSentence: string;
  correction: string;
  explanation?: string;
  audioUrl?: string;
  createdAt: string; // ISO string from Timestamp
}

export interface MistakesSummary {
  Grammar: number;
  Pronunciation: number;
  Vocabulary: number;
  Cultural: number;
}

export interface ClassMistakesData {
  mistakes: ClassMistake[];
  summary: MistakesSummary;
}

export interface StudentActivityInfo {
  id: string;
  name: string;
  reason: string; // e.g., "3 days inactive" or "low scores (2.1 avg)"
  daysInactive?: number;
  avgStars?: number;
}
