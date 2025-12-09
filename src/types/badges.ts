/**
 * Badge System Type Definitions
 *
 * Implements a purposeful badge system that celebrates genuine learning milestones.
 */

import { Timestamp } from 'firebase/firestore';
import type { ProficiencyLevel } from './firestore';

// ==================== BADGE CATEGORIES ====================

export type BadgeCategory =
  | 'consistency'  // Building habits (sessions, streaks)
  | 'excellence'   // Quality of practice (stars)
  | 'time'         // Practice duration
  | 'explorer'     // Variety & curiosity
  | 'level';       // CEFR advancement

// ==================== BADGE CRITERIA ====================

/**
 * Numeric criteria types - threshold is a number
 */
export type NumericCriteriaType =
  | 'sessions_completed'
  | 'current_streak'        // Checks max(currentStreak, longestStreak)
  | 'total_stars'
  | 'consecutive_five_stars'
  | 'practice_minutes'      // Note: userData stores seconds, convert in check
  | 'unique_scenarios'
  | 'custom_lessons_created';

/**
 * Level criteria type - threshold is a ProficiencyLevel
 */
export type LevelCriteriaType = 'level_reached';

/**
 * All criteria types
 */
export type CriteriaType = NumericCriteriaType | LevelCriteriaType;

/**
 * Numeric badge criteria (most badges)
 */
export interface NumericBadgeCriteria {
  type: NumericCriteriaType;
  threshold: number;
}

/**
 * Level badge criteria (for CEFR advancement)
 */
export interface LevelBadgeCriteria {
  type: LevelCriteriaType;
  threshold: ProficiencyLevel;
}

/**
 * Discriminated union for badge criteria
 */
export type BadgeCriteria = NumericBadgeCriteria | LevelBadgeCriteria;

// ==================== BADGE DEFINITIONS ====================

/**
 * Badge definition stored in badgeDefinitions collection
 */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  iconName: string;           // Lucide icon name
  sortOrder: number;          // Display order within category
  criteria: BadgeCriteria;
}

/**
 * User's earned badge stored in users/{userId}/badges/{badgeId}
 */
export interface UserBadge {
  badgeId: string;
  earnedAt: Timestamp;
  // Denormalized for display without extra reads
  name: string;
  description: string;
  category: BadgeCategory;
  iconName: string;
}

// ==================== USER BADGE TRACKING ====================

/**
 * Latest badge info for quick display
 */
export interface LatestBadgeInfo {
  id: string;
  name: string;
  iconName: string;
  earnedAt: Timestamp;
}

/**
 * Badge-related fields to add to UserDocument
 */
export interface UserBadgeFields {
  badgeIds?: string[];                    // Array of earned badge IDs
  badgeCount?: number;                    // Total badges earned
  latestBadge?: LatestBadgeInfo | null;   // Most recent badge for display
  uniqueScenariosCompleted?: string[];    // Array of unique missionIds
  consecutiveFiveStarSessions?: number;   // Resets on non-5-star
  customLessonsCreated?: number;          // Count of custom lessons
}

// ==================== BADGE CHECK RESULTS ====================

/**
 * Result of checking badges after an event
 */
export interface BadgeCheckResult {
  newlyEarned: BadgeDefinition[];
  alreadyEarned: string[];
}

/**
 * Trigger events that can award badges
 */
export type BadgeTriggerEvent =
  | 'session_completed'
  | 'custom_lesson_created'
  | 'level_changed';

// ==================== BADGE PROGRESS ====================

/**
 * Progress toward a badge for UI display
 */
export interface BadgeProgress {
  badge: BadgeDefinition;
  earned: boolean;
  earnedAt?: Date;
  progress?: number;          // Current value (e.g., 45 stars)
  target?: number;            // Target value (e.g., 50 stars)
  progressPercent?: number;   // 0-100
}

// ==================== CONSTANTS ====================

/**
 * CEFR level order for comparison
 */
export const LEVEL_ORDER: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Check if user has reached a target level
 */
export const hasReachedLevel = (
  currentLevel: ProficiencyLevel | undefined,
  targetLevel: ProficiencyLevel
): boolean => {
  if (!currentLevel) return false;
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
  const targetIndex = LEVEL_ORDER.indexOf(targetLevel);
  return currentIndex >= targetIndex;
};
