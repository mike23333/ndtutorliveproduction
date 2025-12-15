import { useState, useEffect, useCallback } from 'react';
import { subscribeToActivities } from '../services/firebase/activities';
import type { ActivityDocument } from '../types/firestore';
import type { ActivityItem } from '../components/dashboard';

interface UseRecentActivityResult {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Convert Firestore ActivityDocument to dashboard ActivityItem
 */
function mapActivityToItem(activity: ActivityDocument): ActivityItem {
  return {
    id: activity.id,
    studentName: activity.studentName,
    action: activity.action,
    lessonTitle: activity.lessonTitle,
    timestamp: activity.timestamp.toDate(),
    stars: activity.stars,
  };
}

/**
 * Hook for real-time recent activity feed
 * Subscribes to Firestore activities collection with live updates
 */
export function useRecentActivity(
  teacherId: string | undefined,
  limitCount: number = 10
): UseRecentActivityResult {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleActivities = useCallback((docs: ActivityDocument[]) => {
    const items = docs.map(mapActivityToItem);
    setActivities(items);
    setLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((err: Error) => {
    console.error('[useRecentActivity] Error:', err);
    setError(err.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToActivities(
      teacherId,
      limitCount,
      handleActivities,
      handleError
    );

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [teacherId, limitCount, handleActivities, handleError]);

  return {
    activities,
    loading,
    error,
  };
}
