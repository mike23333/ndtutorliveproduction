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
 * Calculate actual current streak from practiceHistory
 * More reliable than stored currentStreak which can get out of sync
 */
function calculateStreakFromHistory(practiceHistory: Record<string, number>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  // Check if practiced today first
  const todayStr = formatDate(checkDate);
  const practicedToday = (practiceHistory[todayStr] || 0) > 0;

  // If not practiced today, start checking from yesterday
  if (!practicedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive days backwards
  while (true) {
    const dateStr = formatDate(checkDate);
    if ((practiceHistory[dateStr] || 0) > 0) {
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

    // Calculate actual streak from practice history (more reliable)
    const calculatedStreak = calculateStreakFromHistory(practiceHistory);

    // Build array of 7 days (Mon-Sun)
    const weekDays: DayData[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateStr = formatDate(day);
      const secondsPracticed = practiceHistory[dateStr] || 0;

      weekDays.push({
        date: dateStr,
        dayLabel: DAY_LABELS[i],
        practiced: secondsPracticed > 0,
        isToday: dateStr === todayStr,
        secondsPracticed,
      });
    }

    return {
      weekDays,
      // Use calculated streak from history for accuracy
      currentStreak: calculatedStreak,
      longestStreak: Math.max(userDocument?.longestStreak || 0, calculatedStreak),
    };
  }, [userDocument]);

  return result;
}

/**
 * Calculate if the streak is at risk (hasn't practiced today)
 */
export function useStreakAtRisk(userDocument: UserDocument | null): boolean {
  return useMemo(() => {
    if (!userDocument) return false;

    const today = formatDate(new Date());
    const lastPractice = userDocument.lastPracticeDate;

    // If they have a streak but haven't practiced today
    return (userDocument.currentStreak || 0) > 0 && lastPractice !== today;
  }, [userDocument]);
}
