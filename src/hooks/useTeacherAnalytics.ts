import { useState, useEffect, useCallback } from 'react';
import type { AnalyticsData, AnalyticsPeriod, AnalyticsLevel } from '../types/dashboard';

interface UseTeacherAnalyticsResult {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  period: AnalyticsPeriod;
  level: AnalyticsLevel;
  setPeriod: (period: AnalyticsPeriod) => void;
  setLevel: (level: AnalyticsLevel) => void;
  refresh: () => Promise<void>;
}

export function useTeacherAnalytics(
  teacherId: string | undefined,
  isActive: boolean
): UseTeacherAnalyticsResult {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>('week');
  const [level, setLevel] = useState<AnalyticsLevel>('all');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const fetchAnalytics = useCallback(async () => {
    if (!isActive || !teacherId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/teacher/${teacherId}?period=${period}&level=${level}`
      );
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        setError('Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [isActive, teacherId, period, level, API_BASE_URL]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    period,
    level,
    setPeriod,
    setLevel,
    refresh: fetchAnalytics,
  };
}
