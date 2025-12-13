import { useState, useEffect, useCallback } from 'react';
import {
  getLessonsForCollection,
  reorderCollectionLessons,
  toggleLessonHomepage,
  addLessonToCollection,
  removeLessonFromCollection,
} from '../services/firebase/missions';
import type { MissionDocument } from '../types/firestore';

/**
 * Lesson data for collection display
 */
export interface CollectionLesson {
  id: string;
  title: string;
  targetLevel: string | null;
  durationMinutes: number;
  imageUrl: string | null;
  showOnHomepage: boolean;
  order: number;
}

interface UseCollectionLessonsResult {
  lessons: CollectionLesson[];
  loading: boolean;
  error: string | null;
  moveLessonUp: (lessonId: string) => Promise<void>;
  moveLessonDown: (lessonId: string) => Promise<void>;
  toggleHomepage: (lessonId: string, show: boolean) => Promise<void>;
  addLesson: (lessonId: string) => Promise<void>;
  removeLesson: (lessonId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

function mapMissionToCollectionLesson(mission: MissionDocument): CollectionLesson {
  return {
    id: mission.id,
    title: mission.title,
    targetLevel: mission.targetLevel || null,
    durationMinutes: mission.durationMinutes || 5,
    imageUrl: mission.imageUrl || null,
    showOnHomepage: mission.showOnHomepage ?? true,
    order: mission.collectionOrder ?? 0,
  };
}

export function useCollectionLessons(collectionId: string | undefined, teacherId: string | undefined): UseCollectionLessonsResult {
  const [lessons, setLessons] = useState<CollectionLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!collectionId || !teacherId) {
      setLessons([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchedLessons = await getLessonsForCollection(collectionId, teacherId);
      setLessons(fetchedLessons.map(mapMissionToCollectionLesson));
    } catch (err) {
      console.error('Error fetching collection lessons:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  }, [collectionId, teacherId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const moveLessonUp = useCallback(async (lessonId: string): Promise<void> => {
    if (!collectionId) return;

    const currentIndex = lessons.findIndex(l => l.id === lessonId);
    if (currentIndex <= 0) return; // Already at top

    // Swap with previous lesson
    const newOrder = [...lessons];
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];

    // Update local state immediately (optimistic update)
    const reorderedLessons = newOrder.map((l, i) => ({ ...l, order: i }));
    setLessons(reorderedLessons);

    // Persist to Firestore
    try {
      await reorderCollectionLessons(collectionId, reorderedLessons.map(l => l.id));
    } catch (err) {
      console.error('Error reordering lessons:', err);
      // Revert on error
      await fetchLessons();
    }
  }, [collectionId, lessons, fetchLessons]);

  const moveLessonDown = useCallback(async (lessonId: string): Promise<void> => {
    if (!collectionId) return;

    const currentIndex = lessons.findIndex(l => l.id === lessonId);
    if (currentIndex < 0 || currentIndex >= lessons.length - 1) return; // Already at bottom

    // Swap with next lesson
    const newOrder = [...lessons];
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];

    // Update local state immediately (optimistic update)
    const reorderedLessons = newOrder.map((l, i) => ({ ...l, order: i }));
    setLessons(reorderedLessons);

    // Persist to Firestore
    try {
      await reorderCollectionLessons(collectionId, reorderedLessons.map(l => l.id));
    } catch (err) {
      console.error('Error reordering lessons:', err);
      // Revert on error
      await fetchLessons();
    }
  }, [collectionId, lessons, fetchLessons]);

  const toggleHomepageHandler = useCallback(async (lessonId: string, show: boolean): Promise<void> => {
    // Optimistic update
    setLessons(prev => prev.map(l =>
      l.id === lessonId ? { ...l, showOnHomepage: show } : l
    ));

    try {
      await toggleLessonHomepage(lessonId, show);
    } catch (err) {
      console.error('Error toggling homepage visibility:', err);
      // Revert on error
      setLessons(prev => prev.map(l =>
        l.id === lessonId ? { ...l, showOnHomepage: !show } : l
      ));
    }
  }, []);

  const addLessonHandler = useCallback(async (lessonId: string): Promise<void> => {
    if (!collectionId || !teacherId) return;

    try {
      await addLessonToCollection(lessonId, collectionId, teacherId);
      await fetchLessons();
    } catch (err) {
      console.error('Error adding lesson to collection:', err);
      throw err;
    }
  }, [collectionId, teacherId, fetchLessons]);

  const removeLessonHandler = useCallback(async (lessonId: string): Promise<void> => {
    try {
      await removeLessonFromCollection(lessonId);
      setLessons(prev => prev.filter(l => l.id !== lessonId));
    } catch (err) {
      console.error('Error removing lesson from collection:', err);
      throw err;
    }
  }, []);

  return {
    lessons,
    loading,
    error,
    moveLessonUp,
    moveLessonDown,
    toggleHomepage: toggleHomepageHandler,
    addLesson: addLessonHandler,
    removeLesson: removeLessonHandler,
    refetch: fetchLessons,
  };
}
