// Dashboard-specific types

import type { ProficiencyLevel } from './firestore';

export type TabType = 'lessons' | 'students' | 'analytics' | 'templates';

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
}

export interface LessonFormData {
  title: string;
  systemPrompt: string;
  durationMinutes: number;
  imageUrl: string | null;
  imageStoragePath: string | null;
  targetLevel: ProficiencyLevel | null;
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

export interface StruggleItem {
  text: string;
  type: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
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
