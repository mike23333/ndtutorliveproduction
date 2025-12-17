/**
 * Subscription Usage Tracking Service
 *
 * Tracks weekly Gemini usage time per student for subscription limits.
 *
 * Design:
 * - Usage stored directly on UserDocument.weeklyUsage
 * - Lazy week reset (resets when user is active, not via cron)
 * - Week boundary = Monday (ISO standard)
 */

import {
  doc,
  updateDoc,
  increment,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  SUBSCRIPTION_PLANS,
  DEFAULT_PLAN,
  WARNING_THRESHOLD_PERCENT,
  type SubscriptionPlanConfig,
} from '../../constants/subscriptionPlans';
import type { UserDocument, SubscriptionPlan } from '../../types/firestore';

/**
 * Usage statistics returned by getUsageStats
 */
export interface UsageStats {
  usedSeconds: number;
  limitSeconds: number;
  remainingSeconds: number;
  percentUsed: number;
  percentRemaining: number;
  isUnlimited: boolean;
  isAtLimit: boolean;
  showWarning: boolean;
  plan: SubscriptionPlanConfig;
}

/**
 * Result of canStartSession check
 */
export interface SessionCheckResult {
  canStart: boolean;
  reason?: string;
  usageStats: UsageStats;
}

/**
 * Get Monday of the week for a given date (ISO standard week start)
 * Returns date string in YYYY-MM-DD format
 */
export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // Sunday = 0, Monday = 1, etc.
  // If Sunday (0), go back 6 days. Otherwise go back (day - 1) days
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Check if user needs their weekly usage reset (it's a new week)
 */
export function needsWeekReset(userDocument: UserDocument | null): boolean {
  if (!userDocument?.weeklyUsage?.weekStartDate) return true;
  const currentWeekStart = getWeekStartDate();
  return userDocument.weeklyUsage.weekStartDate !== currentWeekStart;
}

/**
 * Get current usage stats with auto-reset logic built in
 * If week has changed, returns 0 usage (reset will happen on next write)
 */
export function getUsageStats(userDocument: UserDocument | null): UsageStats {
  const planId = userDocument?.subscriptionPlan || DEFAULT_PLAN;
  const plan = SUBSCRIPTION_PLANS[planId];
  const isUnlimited = planId === 'unlimited';

  // If needs reset, treat as 0 usage (actual reset happens on recordSessionUsage)
  const usedSeconds = needsWeekReset(userDocument)
    ? 0
    : (userDocument?.weeklyUsage?.usedSeconds || 0);

  const limitSeconds = plan.weeklyLimitSeconds;
  const remainingSeconds = isUnlimited
    ? Infinity
    : Math.max(0, limitSeconds - usedSeconds);

  const percentUsed = isUnlimited ? 0 : usedSeconds / limitSeconds;
  const percentRemaining = isUnlimited ? 1 : remainingSeconds / limitSeconds;

  return {
    usedSeconds,
    limitSeconds,
    remainingSeconds,
    percentUsed,
    percentRemaining,
    isUnlimited,
    isAtLimit: !isUnlimited && remainingSeconds <= 0,
    showWarning: !isUnlimited && percentRemaining <= WARNING_THRESHOLD_PERCENT && percentRemaining > 0,
    plan,
  };
}

/**
 * Check if user can start a new Gemini session
 * Returns canStart = false if:
 * - Account is suspended
 * - Weekly limit is reached
 */
export function canStartSession(userDocument: UserDocument | null): SessionCheckResult {
  const usageStats = getUsageStats(userDocument);

  // Suspended users cannot start sessions
  if (userDocument?.status === 'suspended') {
    return {
      canStart: false,
      reason: 'Your account is suspended. Please contact your teacher.',
      usageStats,
    };
  }

  // Check weekly limit
  if (usageStats.isAtLimit) {
    return {
      canStart: false,
      reason: 'You\'ve used your weekly practice time. Your quota resets on Monday.',
      usageStats,
    };
  }

  return {
    canStart: true,
    usageStats,
  };
}

/**
 * Reset week usage if needed (called before recording new usage)
 * Returns true if reset was performed
 */
export async function resetWeekIfNeeded(
  userId: string,
  userDocument: UserDocument | null
): Promise<boolean> {
  if (!needsWeekReset(userDocument)) return false;
  if (!db) return false;

  const userRef = doc(db, 'users', userId);
  const currentWeekStart = getWeekStartDate();

  await updateDoc(userRef, {
    weeklyUsage: {
      weekStartDate: currentWeekStart,
      usedSeconds: 0,
    },
    updatedAt: Timestamp.now(),
  });

  return true;
}

/**
 * Record session usage time
 * Called when a Gemini session ends
 *
 * @param userId - User's UID
 * @param sessionDurationSeconds - Duration of the session in seconds
 */
export async function recordSessionUsage(
  userId: string,
  sessionDurationSeconds: number
): Promise<void> {
  if (!db || sessionDurationSeconds <= 0) return;

  // First, ensure we have fresh user data to check if reset is needed
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() as UserDocument : null;

  const currentWeekStart = getWeekStartDate();

  // Check if we need to reset for a new week
  if (needsWeekReset(userData)) {
    // Start fresh for new week, adding this session's time
    await updateDoc(userRef, {
      weeklyUsage: {
        weekStartDate: currentWeekStart,
        usedSeconds: sessionDurationSeconds,
        lastSessionEndedAt: Timestamp.now(),
      },
      updatedAt: Timestamp.now(),
    });
  } else {
    // Increment existing week's usage
    await updateDoc(userRef, {
      'weeklyUsage.usedSeconds': increment(sessionDurationSeconds),
      'weeklyUsage.lastSessionEndedAt': Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

/**
 * Update student's subscription plan (teacher action)
 *
 * @param studentId - Student's UID
 * @param plan - New subscription plan
 */
export async function updateStudentPlan(
  studentId: string,
  plan: SubscriptionPlan
): Promise<void> {
  if (!db) throw new Error('Firebase not configured');

  const studentRef = doc(db, 'users', studentId);
  await updateDoc(studentRef, {
    subscriptionPlan: plan,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get user document with fresh data (for real-time usage checks)
 */
export async function getUserDocument(userId: string): Promise<UserDocument | null> {
  if (!db) return null;

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return null;
  return userSnap.data() as UserDocument;
}
