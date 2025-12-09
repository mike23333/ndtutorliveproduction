import { useState, useEffect, useCallback } from 'react';
import { getAllMissions, createMission, updateMission, deleteMission } from '../services/firebase/missions';
import type { MissionDocument } from '../types/firestore';
import type { LessonData, LessonFormData } from '../types/dashboard';

interface UseTeacherLessonsResult {
  lessons: LessonData[];
  loading: boolean;
  error: string | null;
  createLesson: (data: LessonFormData, teacherId: string, teacherName: string) => Promise<LessonData>;
  updateLesson: (lessonId: string, data: Partial<LessonFormData>) => Promise<void>;
  deleteLesson: (lessonId: string) => Promise<void>;
  duplicateLesson: (lesson: LessonData) => LessonFormData;
  refetch: () => Promise<void>;
}

function mapMissionToLesson(mission: MissionDocument): LessonData {
  return {
    id: mission.id,
    title: mission.title,
    systemPrompt: mission.systemPrompt || mission.scenario || '',
    durationMinutes: mission.durationMinutes || 15,
    imageUrl: mission.imageUrl || null,
    imageStoragePath: mission.imageStoragePath || null,
    functionCallingEnabled: mission.functionCallingEnabled ?? true,
    assignedGroups: mission.groupId ? [mission.groupId] : [],
    status: mission.isActive ? 'published' : 'draft',
    completionRate: 0,
    studentsCompleted: 0,
    totalStudents: 0,
  };
}

export function useTeacherLessons(): UseTeacherLessonsResult {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const missions = await getAllMissions();
      const mappedLessons = missions.map(mapMissionToLesson);
      setLessons(mappedLessons);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const createLessonHandler = useCallback(async (
    data: LessonFormData,
    teacherId: string,
    teacherName: string
  ): Promise<LessonData> => {
    const newMission = await createMission({
      teacherId,
      teacherName,
      title: data.title.trim(),
      scenario: data.systemPrompt.trim(),
      systemPrompt: data.systemPrompt.trim(),
      durationMinutes: data.durationMinutes,
      tone: 'friendly',
      vocabList: [],
      imageUrl: data.imageUrl || undefined,
      imageStoragePath: data.imageStoragePath || undefined,
      functionCallingEnabled: true,
      isActive: true,
    });

    const newLesson = mapMissionToLesson(newMission);
    setLessons(prev => [newLesson, ...prev]);
    return newLesson;
  }, []);

  const updateLessonHandler = useCallback(async (
    lessonId: string,
    data: Partial<LessonFormData>
  ): Promise<void> => {
    const updateData: Record<string, unknown> = { id: lessonId };

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.systemPrompt !== undefined) {
      updateData.scenario = data.systemPrompt.trim();
      updateData.systemPrompt = data.systemPrompt.trim();
    }
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imageStoragePath !== undefined) updateData.imageStoragePath = data.imageStoragePath;

    updateData.functionCallingEnabled = true;

    await updateMission(updateData as Parameters<typeof updateMission>[0]);

    setLessons(prev => prev.map(l =>
      l.id === lessonId
        ? {
            ...l,
            title: data.title?.trim() ?? l.title,
            systemPrompt: data.systemPrompt?.trim() ?? l.systemPrompt,
            durationMinutes: data.durationMinutes ?? l.durationMinutes,
            imageUrl: data.imageUrl ?? l.imageUrl,
          }
        : l
    ));
  }, []);

  const deleteLessonHandler = useCallback(async (lessonId: string): Promise<void> => {
    await deleteMission(lessonId);
    setLessons(prev => prev.filter(l => l.id !== lessonId));
  }, []);

  const duplicateLesson = useCallback((lesson: LessonData): LessonFormData => {
    return {
      title: `${lesson.title} (Copy)`,
      systemPrompt: lesson.systemPrompt,
      durationMinutes: lesson.durationMinutes,
      imageUrl: lesson.imageUrl,
      imageStoragePath: null,
    };
  }, []);

  return {
    lessons,
    loading,
    error,
    createLesson: createLessonHandler,
    updateLesson: updateLessonHandler,
    deleteLesson: deleteLessonHandler,
    duplicateLesson,
    refetch: fetchLessons,
  };
}
