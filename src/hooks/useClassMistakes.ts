import { useState, useEffect, useCallback } from 'react';
import type { ClassMistakesData, AnalyticsPeriod } from '../types/dashboard';

interface UseClassMistakesResult {
  data: ClassMistakesData | null;
  loading: boolean;
  error: string | null;
  period: AnalyticsPeriod;
  setPeriod: (period: AnalyticsPeriod) => void;
  refresh: () => Promise<void>;
}

export function useClassMistakes(
  teacherId: string | undefined,
  isActive: boolean = true
): UseClassMistakesResult {
  const [data, setData] = useState<ClassMistakesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>('week');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const fetchMistakes = useCallback(async () => {
    if (!teacherId || !isActive) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/mistakes/teacher/${teacherId}?period=${period}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch mistakes: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching class mistakes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch mistakes');
      // Set empty data on error so UI can still render
      setData({
        mistakes: [],
        summary: { Grammar: 0, Pronunciation: 0, Vocabulary: 0, Cultural: 0 }
      });
    } finally {
      setLoading(false);
    }
  }, [teacherId, period, isActive, API_BASE_URL]);

  useEffect(() => {
    fetchMistakes();
  }, [fetchMistakes]);

  return {
    data,
    loading,
    error,
    period,
    setPeriod,
    refresh: fetchMistakes,
  };
}
