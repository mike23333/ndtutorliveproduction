import { useState, useEffect, useCallback } from 'react';
import type { ClassPulseInsight } from '../types/dashboard';

interface UseClassPulseResult {
  insights: ClassPulseInsight[];
  loading: boolean;
  generating: boolean;
  lastGenerated: string | null;
  generateInsights: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useClassPulse(teacherId: string | undefined): UseClassPulseResult {
  const [insights, setInsights] = useState<ClassPulseInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const fetchInsights = useCallback(async () => {
    if (!teacherId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pulse/teacher/${teacherId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
          setLastGenerated(data.generatedAt);
        }
      }
    } catch (error) {
      console.error('Error fetching Class Pulse:', error);
    } finally {
      setLoading(false);
    }
  }, [teacherId, API_BASE_URL]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const generateInsights = useCallback(async (force: boolean = false) => {
    if (!teacherId) return;

    setGenerating(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pulse/teacher/${teacherId}?force=${force}`,
        { method: 'POST' }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
          setLastGenerated(data.generatedAt);
        }
      }
    } catch (error) {
      console.error('Error generating Class Pulse:', error);
    } finally {
      setGenerating(false);
    }
  }, [teacherId, API_BASE_URL]);

  return {
    insights,
    loading,
    generating,
    lastGenerated,
    generateInsights,
    refresh: fetchInsights,
  };
}
