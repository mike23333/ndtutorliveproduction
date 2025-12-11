import { useState, useEffect, useCallback } from 'react';
import { getMissionsForTeacher, createMission, updateMission, deleteMission } from '../services/firebase/missions';
import { getAllMissionCompletionStats, MissionCompletionStats } from '../services/firebase/students';
import { useAuth } from './useAuth';
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

function mapMissionToLesson(
  mission: MissionDocument,
  completionStats?: MissionCompletionStats
): LessonData {
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
    completionRate: completionStats?.completionRate || 0,
    studentsCompleted: completionStats?.completedCount || 0,
    totalStudents: completionStats?.totalEligible || 0,
    targetLevel: mission.targetLevel || null,
    isFirstLesson: mission.isFirstLesson || false,
    assignedStudentIds: mission.assignedStudentIds || [],
    notCompletedStudents: completionStats?.notCompletedStudents || [],
  };
}

export function useTeacherLessons(): UseTeacherLessonsResult {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch missions and completion stats in parallel
      const [missions, completionStatsMap] = await Promise.all([
        getMissionsForTeacher(user.uid),
        getAllMissionCompletionStats(user.uid),
      ]);

      // Map missions with their completion stats
      const mappedLessons = missions.map(mission =>
        mapMissionToLesson(mission, completionStatsMap[mission.id])
      );
      setLessons(mappedLessons);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

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
      targetLevel: data.targetLevel || undefined,
      tone: 'friendly',
      vocabList: [],
      imageUrl: data.imageUrl || undefined,
      imageStoragePath: data.imageStoragePath || undefined,
      functionCallingEnabled: true,
      isActive: true,
      isFirstLesson: data.isFirstLesson || false,
      assignedStudentIds: data.assignedStudentIds?.length ? data.assignedStudentIds : undefined,
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
    if (data.targetLevel !== undefined) updateData.targetLevel = data.targetLevel;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imageStoragePath !== undefined) updateData.imageStoragePath = data.imageStoragePath;
    if (data.isFirstLesson !== undefined) updateData.isFirstLesson = data.isFirstLesson;
    if (data.assignedStudentIds !== undefined) updateData.assignedStudentIds = data.assignedStudentIds;

    updateData.functionCallingEnabled = true;

    await updateMission(updateData as Parameters<typeof updateMission>[0]);

    // If this lesson was set as first lesson, clear flag from others in local state
    const updatedIsFirstLesson = data.isFirstLesson;

    setLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        return {
          ...l,
          title: data.title?.trim() ?? l.title,
          systemPrompt: data.systemPrompt?.trim() ?? l.systemPrompt,
          durationMinutes: data.durationMinutes ?? l.durationMinutes,
          targetLevel: data.targetLevel !== undefined ? data.targetLevel : l.targetLevel,
          imageUrl: data.imageUrl ?? l.imageUrl,
          isFirstLesson: data.isFirstLesson ?? l.isFirstLesson,
        };
      }
      // If setting a new first lesson, clear flag from other lessons
      if (updatedIsFirstLesson === true) {
        return { ...l, isFirstLesson: false };
      }
      return l;
    }));
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
      targetLevel: lesson.targetLevel || null,
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
