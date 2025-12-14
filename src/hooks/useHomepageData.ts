import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { getMissionsForStudent } from '../services/firebase/students';
import { getMissionsForTeacher } from '../services/firebase/missions';
import { getUserStarStats, getActiveReviewLesson } from '../services/firebase/sessionData';
import { getDefaultIntroLessonTemplate } from '../services/firebase/systemTemplates';
import { MissionDocument, ReviewLessonDocument } from '../types/firestore';
import { LessonWithCompletion } from '../components/home/AssignmentGrid';

// User stats from Firestore
interface UserStats {
  totalSessions: number;
  totalStars: number;
  averageStars: number;
  totalPracticeTime: number;
  currentStreak: number;
  longestStreak: number;
}

// Convert MissionDocument to LessonWithCompletion
const missionToLesson = (
  mission: MissionDocument,
  completedMissionIds: string[]
): LessonWithCompletion => {
  const durationMinutes = mission.durationMinutes || 5;

  return {
    id: mission.id,
    title: mission.title,
    level: mission.targetLevel || 'A2',
    duration: `${durationMinutes} min`,
    durationMinutes,
    completed: completedMissionIds.includes(mission.id),
    systemPrompt: mission.systemPrompt || mission.scenario,
    functionCallingEnabled: mission.functionCallingEnabled,
    functionCallingInstructions: mission.functionCallingInstructions,
    tone: mission.tone,
    image: mission.imageUrl || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop`,
    teacherId: mission.teacherId,
    isFirstLesson: mission.isFirstLesson || false,
    tasks: mission.tasks,
  };
};

/**
 * Custom hook for homepage data fetching and management
 * Handles lessons, user stats, active reviews, and intro templates
 */
export function useHomepageData() {
  const { user, userDocument } = useAuth();
  const [lessons, setLessons] = useState<LessonWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalSessions: 0,
    totalStars: 0,
    averageStars: 0,
    totalPracticeTime: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [activeReview, setActiveReview] = useState<ReviewLessonDocument | null>(null);
  const [introLessonTemplate, setIntroLessonTemplate] = useState<string | null>(null);

  // Get user's exact level for filtering (memoized to prevent infinite re-renders)
  const userLevelFilter = useMemo((): string[] => {
    const level = userDocument?.level;
    if (!level) return [];
    return [level];
  }, [userDocument?.level]);

  // Stable reference for completed scenarios
  const completedScenariosKey = useMemo(
    () => JSON.stringify(userDocument?.uniqueScenariosCompleted || []),
    [userDocument?.uniqueScenariosCompleted]
  );

  // Single source of truth for student's display name
  const studentDisplayName = userDocument?.displayName || user?.displayName || 'Student';

  // Detect first-time user (no sessions completed)
  const isFirstTimeUser = !userDocument?.totalSessions || userDocument.totalSessions === 0;

  // User level
  const userLevel = userDocument?.level || 'A2';

  // Fetch lessons from Firestore based on student's teacher
  useEffect(() => {
    const fetchLessons = async () => {
      if (userDocument?.role === 'student' && userDocument.teacherId) {
        console.log('[useHomepageData] Fetching lessons for student:', {
          teacherId: userDocument.teacherId,
          level: userDocument.level,
          isPrivateStudent: userDocument.isPrivateStudent,
        });
        try {
          const completedMissionIds = userDocument.uniqueScenariosCompleted || [];
          const missions = await getMissionsForStudent(
            userDocument.teacherId,
            userDocument.level,
            user?.uid,
            userDocument.isPrivateStudent
          );
          console.log('[useHomepageData] Fetched missions:', missions.length);

          if (missions.length > 0) {
            let fetchedLessons = missions.map((m) =>
              missionToLesson(m, completedMissionIds)
            );

            // Additional level filtering only for group students
            if (!userDocument.isPrivateStudent && userDocument.level && userLevelFilter.length > 0) {
              fetchedLessons = fetchedLessons.filter((lesson) =>
                userLevelFilter.includes(lesson.level)
              );
            }

            setLessons(fetchedLessons);
          } else {
            setLessons([]);
          }
        } catch (error) {
          console.error('Error fetching lessons:', error);
          setLessons([]);
        } finally {
          setLoading(false);
        }
      } else if ((userDocument?.role === 'teacher' || userDocument?.role === 'admin') && user?.uid) {
        // Teachers see all their own lessons
        console.log('[useHomepageData] Fetching lessons for teacher:', user.uid);
        try {
          const missions = await getMissionsForTeacher(user.uid);
          console.log('[useHomepageData] Fetched teacher missions:', missions.length);

          if (missions.length > 0) {
            const fetchedLessons = missions.map((m) =>
              missionToLesson(m, [])
            );
            setLessons(fetchedLessons);
          } else {
            setLessons([]);
          }
        } catch (error) {
          console.error('Error fetching teacher lessons:', error);
          setLessons([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    if (userDocument) {
      fetchLessons();
    }
  }, [userDocument?.teacherId, userDocument?.level, userDocument?.role, completedScenariosKey, userLevelFilter, user?.uid, userDocument]);

  // Fetch user stats from Firestore
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.uid) return;

      try {
        const stats = await getUserStarStats(user.uid);
        setUserStats({
          totalSessions: stats.totalSessions,
          totalStars: stats.totalStars,
          averageStars: stats.averageStars,
          totalPracticeTime: stats.totalPracticeTime,
          currentStreak: stats.currentStreak,
          longestStreak: stats.longestStreak,
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchStats();
  }, [user?.uid]);

  // Fetch active weekly review
  useEffect(() => {
    const fetchReview = async () => {
      if (!user?.uid) return;

      try {
        const review = await getActiveReviewLesson(user.uid);
        setActiveReview(review);
      } catch (error) {
        console.error('[useHomepageData] Error fetching active review:', error);
      }
    };

    fetchReview();
  }, [user?.uid]);

  // Fetch default intro lesson template
  useEffect(() => {
    const fetchIntroTemplate = async () => {
      try {
        const template = await getDefaultIntroLessonTemplate();
        setIntroLessonTemplate(template.template);
      } catch (error) {
        console.error('[useHomepageData] Error fetching intro lesson template:', error);
      }
    };

    fetchIntroTemplate();
  }, []);

  // Get first incomplete lesson for smart CTA
  const firstIncompleteLesson = lessons.find((l) => !l.completed) || null;
  const smartDefaultLesson = lessons[0] || null;

  // Default intro lesson - used when no teacher-assigned lessons exist
  const defaultIntroLesson: LessonWithCompletion = useMemo(() => {
    const processedPrompt = introLessonTemplate
      ? introLessonTemplate
          .replace(/\{\{level\}\}/g, userLevel)
          .replace(/\{\{studentName\}\}/g, studentDisplayName)
      : `You are Alex, a friendly English conversation partner. Have a simple 3-minute intro chat with ${studentDisplayName} at ${userLevel} level. Ask their name, where they're from, and their hobbies. Be warm and encouraging.`;

    return {
      id: 'default-intro',
      title: 'Meet Your Tutor',
      level: userLevel,
      duration: '3 min',
      durationMinutes: 3,
      completed: false,
      isFirstLesson: true,
      tone: 'friendly',
      functionCallingEnabled: true,
      systemPrompt: processedPrompt,
    };
  }, [userLevel, studentDisplayName, introLessonTemplate]);

  // Get first lesson for first-time guidance
  const getFirstLesson = (): LessonWithCompletion | null => {
    if (isFirstTimeUser) {
      return defaultIntroLesson;
    }

    if (lessons.length === 0) return defaultIntroLesson;

    // Priority 1: Teacher-designated first lesson
    const designatedFirst = lessons.find(l => l.isFirstLesson);
    if (designatedFirst) return designatedFirst;

    // Priority 2: Shortest lesson at user's level
    const levelLessons = lessons.filter(l => l.level === userLevel);
    const sortedLessons = levelLessons.length > 0 ? levelLessons : lessons;
    return sortedLessons.sort((a, b) => (a.durationMinutes || 5) - (b.durationMinutes || 5))[0];
  };

  return {
    // Data
    lessons,
    loading,
    userStats,
    activeReview,
    introLessonTemplate,
    defaultIntroLesson,

    // Computed values
    firstIncompleteLesson,
    smartDefaultLesson,
    isFirstTimeUser,
    userLevel,
    studentDisplayName,

    // Functions
    getFirstLesson,
  };
}
