import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Streak milestone configuration
 */
export interface StreakMilestone {
  days: number;
  title: string;
  message: string;
  icon: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, title: 'Getting Started!', message: '3 days in a row. You\'re building a habit.', icon: '🌱' },
  { days: 7, title: 'One Week!', message: 'A full week of practice. Impressive.', icon: '🔥' },
  { days: 14, title: 'Two Weeks Strong!', message: '14 days. This is becoming routine.', icon: '💪' },
  { days: 21, title: 'Three Week Warrior!', message: '21 days. You\'ve formed a habit.', icon: '⭐' },
  { days: 30, title: 'Monthly Master!', message: '30 days of dedication. You\'re unstoppable.', icon: '🏆' },
  { days: 60, title: 'Two Month Champion!', message: '60 days. True commitment.', icon: '🥇' },
  { days: 90, title: 'Quarterly Hero!', message: '90 days of excellence.', icon: '👑' },
  { days: 180, title: 'Half Year Superstar!', message: '180 days. Absolutely incredible.', icon: '🚀' },
  { days: 365, title: 'Yearly Legend!', message: '365 days. You are legendary.', icon: '🎖️' },
];

interface UseStreakResult {
  /** Current active streak in days */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Date of last practice (YYYY-MM-DD) */
  lastPracticeDate: string | null;
  /** Whether user has practiced today */
  practicedToday: boolean;
  /** Whether streak is at risk (no practice today + after 5PM + has active streak) */
  isAtRisk: boolean;
  /** Check if a given streak value matches any milestone */
  getMilestone: (streak: number) => StreakMilestone | null;
  /** Get the next milestone to achieve */
  nextMilestone: StreakMilestone | null;
  /** Progress percentage toward next milestone (0-100) */
  progressToNextMilestone: number;
}

/**
 * Hook for managing and calculating streak information.
 * Uses data from userDocument via useAuth.
 */
export function useStreak(): UseStreakResult {
  const { userDocument } = useAuth();

  const currentStreak = userDocument?.currentStreak || 0;
  const longestStreak = userDocument?.longestStreak || 0;
  const lastPracticeDate = userDocument?.lastPracticeDate || null;

  // Check if user has practiced today
  const practicedToday = useMemo(() => {
    if (!lastPracticeDate) return false;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return lastPracticeDate === today;
  }, [lastPracticeDate]);

  // Check if streak is at risk
  // Conditions: hasn't practiced today AND it's after 5 PM AND has an active streak
  const isAtRisk = useMemo(() => {
    if (practicedToday || currentStreak === 0) return false;

    const currentHour = new Date().getHours();
    return currentHour >= 17; // 5 PM or later
  }, [practicedToday, currentStreak]);

  // Get milestone for a specific streak value
  const getMilestone = (streak: number): StreakMilestone | null => {
    return STREAK_MILESTONES.find((m) => m.days === streak) || null;
  };

  // Calculate next milestone
  const nextMilestone = useMemo(() => {
    return STREAK_MILESTONES.find((m) => m.days > currentStreak) || null;
  }, [currentStreak]);

  // Calculate progress toward next milestone
  const progressToNextMilestone = useMemo(() => {
    if (!nextMilestone) return 100; // All milestones achieved

    // Find previous milestone
    const prevMilestoneIndex = STREAK_MILESTONES.findIndex((m) => m.days === nextMilestone.days) - 1;
    const prevMilestone = prevMilestoneIndex >= 0 ? STREAK_MILESTONES[prevMilestoneIndex] : { days: 0 };

    const rangeStart = prevMilestone.days;
    const rangeEnd = nextMilestone.days;
    const progress = ((currentStreak - rangeStart) / (rangeEnd - rangeStart)) * 100;

    return Math.min(100, Math.max(0, progress));
  }, [currentStreak, nextMilestone]);

  return {
    currentStreak,
    longestStreak,
    lastPracticeDate,
    practicedToday,
    isAtRisk,
    getMilestone,
    nextMilestone,
    progressToNextMilestone,
  };
}

/**
 * Utility function to check if a new streak hits a milestone.
 * Use this after session completion to determine if celebration should show.
 */
export function checkStreakMilestone(
  previousStreak: number,
  newStreak: number
): StreakMilestone | null {
  // Only check for milestone if streak increased
  if (newStreak <= previousStreak) return null;

  // Check if newStreak exactly matches a milestone
  return STREAK_MILESTONES.find((m) => m.days === newStreak) || null;
}
