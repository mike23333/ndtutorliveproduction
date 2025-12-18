/**
 * Hook to compute streak calendar data for the current week
 * Shows which days the user practiced
 */

import { useMemo } from 'react';
import { UserDocument } from '../types/firestore';

export interface DayData {
  date: string; // YYYY-MM-DD
  dayLabel: string; // M, T, W, etc.
  practiced: boolean;
  isToday: boolean;
  secondsPracticed: number;
}

interface UseStreakCalendarResult {
  weekDays: DayData[];
  currentStreak: number;
  longestStreak: number;
}

/**
 * Get the Monday of the current week
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Calculate actual current streak from completionHistory
 * Only counts days with completed sessions (not just practice time)
 * This matches industry standard (Duolingo, Headspace, etc.)
 */
function calculateStreakFromCompletions(completionHistory: Record<string, number>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  // Check if completed a session today first
  const todayStr = formatDate(checkDate);
  const completedToday = (completionHistory[todayStr] || 0) > 0;

  // If not completed today, start checking from yesterday
  if (!completedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive days backwards with completions
  while (true) {
    const dateStr = formatDate(checkDate);
    if ((completionHistory[dateStr] || 0) > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function useStreakCalendar(userDocument: UserDocument | null): UseStreakCalendarResult {
  const result = useMemo(() => {
    const today = new Date();
    const todayStr = formatDate(today);
    const monday = getMonday(today);
    const practiceHistory = userDocument?.practiceHistory || {};
    const completionHistory = userDocument?.completionHistory || {};

    // Calculate streak from completions only (not just practice time)
    const calculatedStreak = calculateStreakFromCompletions(completionHistory);

    // Build array of 7 days (Mon-Sun)
    // Show checkmark only for days with completed sessions
    const weekDays: DayData[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateStr = formatDate(day);
      const secondsPracticed = practiceHistory[dateStr] || 0;
      const completedSessions = completionHistory[dateStr] || 0;

      weekDays.push({
        date: dateStr,
        dayLabel: DAY_LABELS[i],
        // Only mark as practiced if a session was COMPLETED that day
        practiced: completedSessions > 0,
        isToday: dateStr === todayStr,
        secondsPracticed,
      });
    }

    return {
      weekDays,
      // Use calculated streak from completions for accuracy
      currentStreak: calculatedStreak,
      longestStreak: Math.max(userDocument?.longestStreak || 0, calculatedStreak),
    };
  }, [userDocument]);

  return result;
}

/**
 * Calculate if the streak is at risk (hasn't practiced today but streak is still valid)
 * A streak is only "at risk" if:
 * 1. User has an active streak
 * 2. User hasn't practiced TODAY
 * 3. User practiced YESTERDAY (so streak is still valid, not already broken)
 */
export function useStreakAtRisk(userDocument: UserDocument | null): boolean {
  return useMemo(() => {
    if (!userDocument) return false;

    const rawStreak = userDocument.currentStreak || 0;
    if (rawStreak === 0) return false;

    const lastPractice = userDocument.lastPracticeDate;
    if (!lastPractice) return false;

    const today = new Date();
    const todayStr = formatDate(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    // Already practiced today - not at risk
    if (lastPractice === todayStr) return false;

    // Practiced yesterday - streak is at risk (could break at midnight)
    if (lastPractice === yesterdayStr) return true;

    // Last practice was 2+ days ago - streak is already broken, not "at risk"
    return false;
  }, [userDocument]);
}
