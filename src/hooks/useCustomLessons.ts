/**
 * Custom Lessons Hook
 * Manages student-created personalized practice lessons
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCustomLessons,
  createCustomLesson,
  updateCustomLesson,
  deleteCustomLesson,
  updateCustomLessonPracticed,
} from '../services/firebase/customLessons';
import { getCustomLessonTemplate } from '../services/firebase/systemTemplates';
import type { CustomLessonDocument, ProficiencyLevel } from '../types/firestore';

interface CreateLessonData {
  title: string;
  description: string;
  imageUrl?: string;
  imageStoragePath?: string;
}

interface UpdateLessonData {
  title?: string;
  description?: string;
  imageUrl?: string;
  imageStoragePath?: string;
}

export interface UseCustomLessonsResult {
  lessons: CustomLessonDocument[];
  loading: boolean;
  error: string | null;
  createLesson: (data: CreateLessonData, userLevel?: ProficiencyLevel) => Promise<CustomLessonDocument>;
  updateLesson: (lessonId: string, data: UpdateLessonData, userLevel?: ProficiencyLevel) => Promise<void>;
  deleteLesson: (lessonId: string) => Promise<void>;
  updateLastPracticed: (lessonId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Fill placeholders in a template string
 */
const fillTemplate = (template: string, values: Record<string, string>): string => {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
};

/**
 * Hook for managing custom lessons
 */
export function useCustomLessons(userId: string | undefined): UseCustomLessonsResult {
  const [lessons, setLessons] = useState<CustomLessonDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch lessons on mount or userId change
  const fetchLessons = useCallback(async () => {
    if (!userId) {
      setLessons([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedLessons = await getCustomLessons(userId);
      setLessons(fetchedLessons);
    } catch (err) {
      console.error('[useCustomLessons] Error fetching lessons:', err);
      setError('Failed to load custom lessons');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  /**
   * Create a new custom lesson
   * Fetches the template and fills in placeholders
   */
  const createLessonHandler = useCallback(async (
    data: CreateLessonData,
    userLevel: ProficiencyLevel = 'B1'
  ): Promise<CustomLessonDocument> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get the custom lesson template
    const templateDoc = await getCustomLessonTemplate();

    // Fill in the template placeholders
    const systemPrompt = fillTemplate(templateDoc.template, {
      level: userLevel,
      practiceDescription: data.description,
    });

    // Create the lesson
    const newLesson = await createCustomLesson(userId, {
      title: data.title,
      description: data.description,
      systemPrompt,
      imageUrl: data.imageUrl,
      imageStoragePath: data.imageStoragePath,
      durationMinutes: 5,
    });

    // Update local state
    setLessons(prev => [newLesson, ...prev]);

    return newLesson;
  }, [userId]);

  /**
   * Update an existing custom lesson
   * If description changes, regenerate the system prompt
   */
  const updateLessonHandler = useCallback(async (
    lessonId: string,
    data: UpdateLessonData,
    userLevel: ProficiencyLevel = 'B1'
  ): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const updates: Record<string, unknown> = {};

    // Copy direct updates
    if (data.title !== undefined) updates.title = data.title;
    if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
    if (data.imageStoragePath !== undefined) updates.imageStoragePath = data.imageStoragePath;

    // If description changed, regenerate system prompt
    if (data.description !== undefined) {
      updates.description = data.description;

      const templateDoc = await getCustomLessonTemplate();
      updates.systemPrompt = fillTemplate(templateDoc.template, {
        level: userLevel,
        practiceDescription: data.description,
      });
    }

    await updateCustomLesson(userId, lessonId, updates);

    // Update local state
    setLessons(prev => prev.map(lesson =>
      lesson.id === lessonId
        ? { ...lesson, ...updates } as CustomLessonDocument
        : lesson
    ));
  }, [userId]);

  /**
   * Delete a custom lesson
   */
  const deleteLessonHandler = useCallback(async (lessonId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    await deleteCustomLesson(userId, lessonId);

    // Update local state
    setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
  }, [userId]);

  /**
   * Update the lastPracticedAt timestamp and increment practiceCount
   */
  const updateLastPracticedHandler = useCallback(async (lessonId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    await updateCustomLessonPracticed(userId, lessonId);

    // Update local state
    setLessons(prev => prev.map(lesson =>
      lesson.id === lessonId
        ? {
            ...lesson,
            practiceCount: lesson.practiceCount + 1,
            lastPracticedAt: { toDate: () => new Date() } as CustomLessonDocument['lastPracticedAt'],
          }
        : lesson
    ));
  }, [userId]);

  return {
    lessons,
    loading,
    error,
    createLesson: createLessonHandler,
    updateLesson: updateLessonHandler,
    deleteLesson: deleteLessonHandler,
    updateLastPracticed: updateLastPracticedHandler,
    refetch: fetchLessons,
  };
}
