/**
 * Hook to compute practice time statistics from user's practice history
 */

import { useMemo } from 'react';
import { UserDocument } from '../types/firestore';
import { DEFAULT_DAILY_GOAL } from '../constants/languages';

interface PracticeStats {
  totalSeconds: number;
  dailyAverageMinutes: number;
  dailyGoalMinutes: number;
  todaySeconds: number;
  todayGoalPercent: number;
  weekData: WeekDayData[];
}

interface WeekDayData {
  date: string;
  dayLabel: string;
  minutes: number;
  percentOfGoal: number;
}

/**
 * Get the Monday of the current week (Monday-Sunday week)
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

  // Calculate days to subtract to get to Monday
  // Sunday (0) -> go back 6 days
  // Monday (1) -> go back 0 days
  // Tuesday (2) -> go back 1 day
  // etc.
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - daysToSubtract);

  return d;
}

/**
 * Format date as YYYY-MM-DD in LOCAL timezone (not UTC)
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function usePracticeHistory(userDocument: UserDocument | null): PracticeStats {
  return useMemo(() => {
    const practiceHistory = userDocument?.practiceHistory || {};
    const dailyGoalMinutes = userDocument?.dailyPracticeGoal || DEFAULT_DAILY_GOAL;
    const dailyGoalSeconds = dailyGoalMinutes * 60;

    // Calculate total practice time from totalPracticeTime field (more accurate)
    const totalSeconds = userDocument?.totalPracticeTime || 0;

    // Calculate daily average from history
    const historyDays = Object.keys(practiceHistory).length;
    const historyTotal = Object.values(practiceHistory).reduce((sum, s) => sum + s, 0);
    const dailyAverageMinutes = historyDays > 0
      ? Math.round(historyTotal / historyDays / 60)
      : 0;

    // Get today's practice
    const today = formatDate(new Date());
    const todaySeconds = practiceHistory[today] || 0;
    const todayGoalPercent = Math.min(100, Math.round((todaySeconds / dailyGoalSeconds) * 100));

    // Build week data for chart
    const monday = getMonday(new Date());
    const weekData: WeekDayData[] = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateStr = formatDate(day);
      const seconds = practiceHistory[dateStr] || 0;
      const minutes = Math.round(seconds / 60);

      weekData.push({
        date: dateStr,
        dayLabel: DAY_LABELS[i],
        minutes,
        percentOfGoal: Math.min(100, Math.round((seconds / dailyGoalSeconds) * 100)),
      });
    }

    return {
      totalSeconds,
      dailyAverageMinutes,
      dailyGoalMinutes,
      todaySeconds,
      todayGoalPercent,
      weekData,
    };
  }, [userDocument]);
}

/**
 * Format seconds as human-readable time
 */
export function formatPracticeTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
