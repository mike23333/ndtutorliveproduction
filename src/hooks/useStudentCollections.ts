import { useState, useEffect, useCallback } from 'react';
import { getCollectionsForTeacher } from '../services/firebase/collections';
import { getLessonsForCollection } from '../services/firebase/missions';
import { useAuth } from './useAuth';
import type { CollectionDocument, MissionDocument } from '../types/firestore';

/**
 * Collection with lessons for student display
 */
export interface StudentCollection {
  id: string;
  title: string;
  description?: string;
  category: string;
  imageUrl: string;
  color?: string;
  lessonCount: number;
  lessons: StudentLesson[];
}

/**
 * Lesson data for student display
 */
export interface StudentLesson {
  id: string;
  title: string;
  targetLevel: string | null;
  durationMinutes: number;
  imageUrl: string | null;
  imageCropPosition?: number;
  order: number;
}

interface UseStudentCollectionsResult {
  collections: StudentCollection[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function mapMissionToStudentLesson(mission: MissionDocument): StudentLesson {
  return {
    id: mission.id,
    title: mission.title,
    targetLevel: mission.targetLevel || null,
    durationMinutes: mission.durationMinutes || 5,
    imageUrl: mission.imageUrl || null,
    imageCropPosition: mission.imageCropPosition,
    order: mission.collectionOrder ?? 0,
  };
}

/**
 * Hook to fetch collections for the RolePlay page
 * - For students: fetches their teacher's visible collections
 * - For teachers: fetches their own collections (for preview/testing)
 */
export function useStudentCollections(): UseStudentCollectionsResult {
  const { user, userDocument } = useAuth();
  const [collections, setCollections] = useState<StudentCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine the teacher ID:
  // - If user is a teacher, use their own UID
  // - If user is a student, use their teacherId
  const isTeacher = userDocument?.role === 'teacher';
  const teacherId = isTeacher ? user?.uid : userDocument?.teacherId;

  const fetchCollections = useCallback(async () => {
    if (!teacherId) {
      setLoading(false);
      setCollections([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch only visible collections for the teacher
      const fetchedCollections = await getCollectionsForTeacher(teacherId, true);

      // Fetch lessons for each collection in parallel
      const collectionsWithLessons = await Promise.all(
        fetchedCollections.map(async (col: CollectionDocument) => {
          try {
            const lessons = await getLessonsForCollection(col.id, teacherId);

            // Filter lessons to only those with showOnHomepage = true
            const visibleLessons = lessons.filter(
              (lesson: MissionDocument) => lesson.showOnHomepage !== false && lesson.isActive
            );

            return {
              id: col.id,
              title: col.title,
              description: col.description,
              category: col.category,
              imageUrl: col.imageUrl,
              color: col.color,
              lessonCount: visibleLessons.length,
              lessons: visibleLessons.map(mapMissionToStudentLesson),
            };
          } catch {
            // If we can't fetch lessons, return collection with empty lessons
            return {
              id: col.id,
              title: col.title,
              description: col.description,
              category: col.category,
              imageUrl: col.imageUrl,
              color: col.color,
              lessonCount: 0,
              lessons: [],
            };
          }
        })
      );

      // Filter out collections with no visible lessons
      const nonEmptyCollections = collectionsWithLessons.filter(
        (col) => col.lessonCount > 0
      );

      setCollections(nonEmptyCollections);
    } catch (err) {
      console.error('Error fetching student collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
  };
}
