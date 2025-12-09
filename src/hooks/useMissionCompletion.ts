import { useState, useEffect } from 'react';
import { getAllMissionCompletionStats, MissionCompletionStats } from '../services/firebase/students';

interface UseMissionCompletionResult {
  completionStats: Record<string, MissionCompletionStats>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage mission completion stats for a teacher
 * Returns completion data for all missions including who hasn't completed
 */
export function useMissionCompletion(teacherId: string | undefined): UseMissionCompletionResult {
  const [completionStats, setCompletionStats] = useState<Record<string, MissionCompletionStats>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    if (!teacherId) {
      setCompletionStats({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const stats = await getAllMissionCompletionStats(teacherId);
      setCompletionStats(stats);
    } catch (err) {
      console.error('Error fetching mission completion stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch completion stats'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [teacherId]);

  return {
    completionStats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Get completion percentage for a specific mission
 */
export function getCompletionPercentage(
  stats: Record<string, MissionCompletionStats>,
  missionId: string
): number {
  const missionStats = stats[missionId];
  if (!missionStats) return 0;
  return Math.round(missionStats.completionRate);
}

/**
 * Get completion display text (e.g., "3/5 completed")
 */
export function getCompletionText(
  stats: Record<string, MissionCompletionStats>,
  missionId: string
): string {
  const missionStats = stats[missionId];
  if (!missionStats) return '';
  return `${missionStats.completedCount}/${missionStats.totalEligible} completed`;
}
