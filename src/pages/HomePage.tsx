import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { UserIcon } from '../theme/icons';
import { getMissionsForStudent } from '../services/firebase/students';
import { getMissionsForTeacher } from '../services/firebase/missions';
import { getUserStarStats, getActiveReviewLesson } from '../services/firebase/sessionData';
import { getPronunciationCoachTemplate, getDefaultIntroLessonTemplate } from '../services/firebase/systemTemplates';
import { MissionDocument, ReviewLessonDocument, CustomLessonDocument } from '../types/firestore';
import { useAuth } from '../hooks/useAuth';
import { useCustomLessons } from '../hooks/useCustomLessons';
import { useStreak } from '../hooks/useStreak';
import { WeeklyReviewCard } from '../components/WeeklyReviewCard';
import { StreakAtRiskBanner } from '../components/streaks';
import { FirstTimeGuidance } from '../components/onboarding';
import {
  ToolsSection,
  CreateOwnModal,
  PronunciationModal,
  MyPracticeSection,
  AssignmentGrid,
  PrimaryActionCard,
  LessonWithCompletion,
} from '../components/home';

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

// Header component - Vibrant purple/indigo style
const Header = ({
  userName,
  streakDays,
  onProfileClick,
}: {
  userName: string;
  streakDays: number;
  onProfileClick: () => void;
}) => (
  <header
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
    }}
  >
    {/* Greeting */}
    <div>
      <p
        style={{
          margin: '0 0 4px 0',
          fontSize: '14px',
          color: AppColors.textSecondary,
        }}
      >
        Welcome back,
      </p>
      <h1
        style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '700',
          color: AppColors.textPrimary,
        }}
      >
        {userName} 👋
      </h1>
    </div>

    {/* Right side: Streak + Profile */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Streak badge */}
      {streakDays > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '20px',
            backgroundColor: 'rgba(251, 191, 36, 0.15)',
            color: AppColors.whisperAmber,
          }}
        >
          <span style={{ fontSize: '16px' }}>🔥</span>
          <span style={{ fontSize: '14px', fontWeight: '700' }}>{streakDays}</span>
        </div>
      )}

      {/* Profile button */}
      <button
        onClick={onProfileClick}
        aria-label="View profile"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: `2px solid ${AppColors.borderColor}`,
          backgroundColor: AppColors.surfaceLight,
          color: AppColors.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms ease',
        }}
      >
        <UserIcon size={20} />
      </button>
    </div>
  </header>
);

export default function HomePage() {
  const navigate = useNavigate();
  const { user, userDocument } = useAuth();
  const { currentStreak, isAtRisk } = useStreak();
  const [lessons, setLessons] = useState<LessonWithCompletion[]>([]);
  const [, setLoading] = useState(true);
  // userStats kept for potential future use but prefixed with underscore
  const [, setUserStats] = useState<UserStats>({
    totalSessions: 0,
    totalStars: 0,
    averageStars: 0,
    totalPracticeTime: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [activeReview, setActiveReview] = useState<ReviewLessonDocument | null>(null);
  const [introLessonTemplate, setIntroLessonTemplate] = useState<string | null>(null);

  // Single source of truth for student's display name (used in header and all prompts)
  const studentDisplayName = userDocument?.displayName || user?.displayName || 'Student';

  // Custom lessons state
  const {
    lessons: customLessons,
    createLesson,
    updateLesson,
    deleteLesson,
  } = useCustomLessons(user?.uid, studentDisplayName);
  const [showCreateOwnModal, setShowCreateOwnModal] = useState(false);
  const [showPronunciationModal, setShowPronunciationModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CustomLessonDocument | null>(null);

  // Get user's exact level for filtering (memoized to prevent infinite re-renders)
  const userLevelFilter = useMemo((): string[] => {
    const level = userDocument?.level;
    if (!level) return [];
    // Only show lessons at the student's exact level
    return [level];
  }, [userDocument?.level]);

  // Stable reference for completed scenarios (prevents infinite re-renders from array comparison)
  const completedScenariosKey = useMemo(
    () => JSON.stringify(userDocument?.uniqueScenariosCompleted || []),
    [userDocument?.uniqueScenariosCompleted]
  );

  // Check if student is suspended
  const isSuspended = userDocument?.role === 'student' && userDocument?.status === 'suspended';

  // Redirect students without teacherId to join class page
  useEffect(() => {
    if (userDocument && userDocument.role === 'student') {
      if (!userDocument.teacherId) {
        navigate('/join-class');
        return;
      }
      // All students (including private) need to select a level
      if (!userDocument.level) {
        navigate('/select-level');
        return;
      }
    }
  }, [userDocument, navigate]);

  // Fetch lessons from Firestore based on student's teacher
  useEffect(() => {
    const fetchLessons = async () => {
      if (userDocument?.role === 'student' && userDocument.teacherId) {
        console.log('[HomePage] Fetching lessons for student:', {
          teacherId: userDocument.teacherId,
          level: userDocument.level,
          isPrivateStudent: userDocument.isPrivateStudent,
        });
        try {
          const completedMissionIds = userDocument.uniqueScenariosCompleted || [];
          // Pass studentId and isPrivateStudent for proper filtering
          const missions = await getMissionsForStudent(
            userDocument.teacherId,
            userDocument.level,
            user?.uid,
            userDocument.isPrivateStudent
          );
          console.log('[HomePage] Fetched missions:', missions.length);

          if (missions.length > 0) {
            let fetchedLessons = missions.map((m) =>
              missionToLesson(m, completedMissionIds)
            );

            // Additional level filtering only for group students (private students see all assigned)
            if (!userDocument.isPrivateStudent && userDocument.level && userLevelFilter.length > 0) {
              const beforeFilter = fetchedLessons.length;
              fetchedLessons = fetchedLessons.filter((lesson) =>
                userLevelFilter.includes(lesson.level)
              );
              console.log('[HomePage] Level filter:', { before: beforeFilter, after: fetchedLessons.length, userLevelFilter });
            }

            setLessons(fetchedLessons);
          } else {
            console.log('[HomePage] No missions found');
            setLessons([]);
          }
        } catch (error) {
          console.error('Error fetching lessons:', error);
          setLessons([]);
        } finally {
          setLoading(false);
        }
      } else if ((userDocument?.role === 'teacher' || userDocument?.role === 'admin') && user?.uid) {
        // Teachers see all their own lessons (no level filtering)
        console.log('[HomePage] Fetching lessons for teacher:', user.uid);
        try {
          const missions = await getMissionsForTeacher(user.uid);
          console.log('[HomePage] Fetched teacher missions:', missions.length);

          if (missions.length > 0) {
            const fetchedLessons = missions.map((m) =>
              missionToLesson(m, []) // Teachers haven't "completed" their own lessons
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
  }, [userDocument?.teacherId, userDocument?.level, userDocument?.role, completedScenariosKey, userLevelFilter]);

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
        console.error('[HomePage] Error fetching active review:', error);
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
        console.error('[HomePage] Error fetching intro lesson template:', error);
      }
    };

    fetchIntroTemplate();
  }, []);

  // Get first incomplete lesson for smart CTA
  const firstIncompleteLesson = lessons.find((l) => !l.completed) || null;
  const smartDefaultLesson = lessons[0] || null;

  // Detect first-time user (no sessions completed)
  const isFirstTimeUser = !userDocument?.totalSessions || userDocument.totalSessions === 0;

  // Default intro lesson - used when no teacher-assigned lessons exist
  const userLevel = userDocument?.level || 'A2';
  const defaultIntroLesson: LessonWithCompletion = useMemo(() => {
    // Replace placeholders in the template
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
  // For first-time users, ALWAYS show the intro lesson first
  const getFirstLesson = (): LessonWithCompletion | null => {
    // For first-time users, always show the intro lesson
    if (isFirstTimeUser) {
      return defaultIntroLesson;
    }

    // If no teacher-assigned lessons, use the default intro
    if (lessons.length === 0) return defaultIntroLesson;

    // Priority 1: Teacher-designated first lesson
    const designatedFirst = lessons.find(l => l.isFirstLesson);
    if (designatedFirst) return designatedFirst;

    // Priority 2: Shortest lesson at user's level
    const levelLessons = lessons.filter(l => l.level === userLevel);
    const sortedLessons = levelLessons.length > 0 ? levelLessons : lessons;
    return sortedLessons.sort((a, b) => (a.durationMinutes || 5) - (b.durationMinutes || 5))[0];
  };

  // Handle lesson click - navigate to chat
  const handleLessonClick = (lesson: LessonWithCompletion) => {
    const roleConfig = {
      id: lesson.id,
      name: lesson.title,
      icon: '📚',
      scenario: lesson.title,
      systemPrompt: lesson.systemPrompt,
      persona: 'actor' as const,
      tone: lesson.tone || 'friendly',
      level: lesson.level,
      color: '#8B5CF6',
      durationMinutes: lesson.durationMinutes,
      functionCallingEnabled: lesson.functionCallingEnabled ?? true,
      functionCallingInstructions: lesson.functionCallingInstructions,
      imageUrl: lesson.image,
      teacherId: lesson.teacherId,
      tasks: lesson.tasks,
    };
    sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));
    navigate(`/chat/${lesson.id}`);
  };

  // Handle continue learning - use currentLesson from userDocument
  const handleContinueLearning = () => {
    const currentLesson = userDocument?.currentLesson;
    if (currentLesson) {
      // Find the full lesson data
      const fullLesson = lessons.find((l) => l.id === currentLesson.missionId);
      if (fullLesson) {
        handleLessonClick(fullLesson);
      } else {
        navigate(`/chat/${currentLesson.missionId}`);
      }
    }
  };

  // Handle review lesson click
  const handleReviewClick = () => {
    if (!activeReview) return;

    const roleConfig = {
      id: `review-${activeReview.id}`,
      name: 'Weekly Review',
      icon: '✨',
      scenario: `Practice conversation with your struggle words from this week`,
      systemPrompt: activeReview.generatedPrompt,
      persona: 'tutor' as const,
      tone: 'encouraging',
      level: activeReview.userLevel,
      color: '#8B5CF6',
      durationMinutes: activeReview.estimatedMinutes,
      functionCallingEnabled: true,
      isReviewLesson: true,
      reviewId: activeReview.id,
    };
    sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));
    navigate(`/chat/review-${activeReview.id}`);
  };

  // Handle "Create My Own" modal
  const handleCreateOwnClick = () => {
    setEditingLesson(null);
    setShowCreateOwnModal(true);
  };

  const handlePronunciationClick = () => {
    setShowPronunciationModal(true);
  };

  const handleCreateOrUpdateLesson = async (data: {
    title: string;
    description: string;
    imageUrl?: string;
    imageStoragePath?: string;
  }) => {
    const userLevel = userDocument?.level || 'B1';

    if (editingLesson) {
      await updateLesson(editingLesson.id, data, userLevel);
    } else {
      await createLesson(data, userLevel);
    }
  };

  const handleCustomLessonClick = (lesson: CustomLessonDocument) => {
    const roleConfig = {
      id: `custom-${lesson.id}`,
      name: lesson.title,
      icon: '✨',
      scenario: lesson.description,
      systemPrompt: lesson.systemPrompt,
      persona: 'tutor' as const,
      tone: 'friendly',
      level: userDocument?.level || 'B1',
      color: '#8B5CF6',
      durationMinutes: lesson.durationMinutes,
      functionCallingEnabled: true,
      isCustomLesson: true,
      customLessonId: lesson.id,
      imageUrl: lesson.imageUrl,
    };
    sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));
    navigate(`/chat/custom-${lesson.id}`);
  };

  const handleEditLesson = (lesson: CustomLessonDocument) => {
    setEditingLesson(lesson);
    setShowCreateOwnModal(true);
  };

  const handleDeleteLesson = async (lesson: CustomLessonDocument) => {
    if (window.confirm(`Delete "${lesson.title}"? This cannot be undone.`)) {
      await deleteLesson(lesson.id);
    }
  };

  const handlePronunciationSubmit = async (words: string) => {
    try {
      const templateDoc = await getPronunciationCoachTemplate();
      const level = userDocument?.level || 'B1';

      const systemPrompt = templateDoc.template
        .replace(/\{\{level\}\}/g, level)
        .replace(/\{\{words\}\}/g, words)
        .replace(/\{\{studentName\}\}/g, studentDisplayName);

      const roleConfig = {
        id: `pronunciation-${Date.now()}`,
        name: 'Pronunciation Coach',
        icon: '🎯',
        scenario: `Practice pronunciation for: ${words}`,
        systemPrompt,
        persona: 'tutor' as const,
        tone: 'encouraging',
        level: userLevel,
        color: '#3B82F6',
        durationMinutes: 2,
        functionCallingEnabled: true,
        isQuickPractice: true,
      };
      sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));
      navigate(`/chat/pronunciation-${Date.now()}`);
    } catch (error) {
      console.error('Error starting pronunciation session:', error);
      alert('Failed to start pronunciation session. Please try again.');
    }
  };

  // Show suspended state for blocked students
  if (isSuspended) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: AppColors.bgPrimary,
          color: AppColors.textPrimary,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '360px',
            textAlign: 'center',
            background: AppColors.bgTertiary,
            borderRadius: '20px',
            padding: '40px 32px',
            border: `1px solid ${AppColors.borderColor}`,
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 20px',
              borderRadius: '16px',
              background: AppColors.bgElevated,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            ⏸
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: AppColors.textPrimary,
              margin: '0 0 8px 0',
              letterSpacing: '-0.3px',
            }}
          >
            Account Paused
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: AppColors.textSecondary,
              margin: '0 0 28px 0',
              lineHeight: 1.6,
            }}
          >
            Your access has been temporarily paused. Contact your teacher
            {userDocument?.teacherName && ` (${userDocument.teacherName})`} to restore access.
          </p>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: AppColors.bgElevated,
              color: AppColors.textPrimary,
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            View Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: AppColors.bgPrimary,
        color: AppColors.textPrimary,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        .home-content::-webkit-scrollbar { width: 0; display: none; }
        .home-content { -ms-overflow-style: none; scrollbar-width: none; }
        @media (min-width: 640px) {
          .home-content { max-width: 540px; margin: 0 auto; }
        }
        @media (min-width: 1024px) {
          .home-content { max-width: 640px; }
        }
      `}</style>

      {/* Scrollable content */}
      <div
        className="home-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          paddingBottom: '40px',
        }}
      >
        {/* Header */}
        <Header
          userName={studentDisplayName}
          streakDays={currentStreak}
          onProfileClick={() => navigate('/profile')}
        />

        {/* Streak at risk banner */}
        {isAtRisk && (
          <StreakAtRiskBanner
            currentStreak={currentStreak}
            onQuickPractice={() => {
              // Start quick practice with first available lesson
              if (smartDefaultLesson) {
                handleLessonClick(smartDefaultLesson);
              }
            }}
          />
        )}

        {/* Primary Action Card - smart CTA (or FirstTimeGuidance for new users) */}
        {isFirstTimeUser ? (
          <FirstTimeGuidance
            teacherName={userDocument?.teacherName}
            firstLesson={getFirstLesson()}
            onStart={() => {
              const firstLesson = getFirstLesson();
              if (firstLesson) {
                // Set flag for ChatPage to show first session celebration
                sessionStorage.setItem('isFirstSession', 'true');
                handleLessonClick(firstLesson);
              }
            }}
          />
        ) : (
          <PrimaryActionCard
            inProgressLesson={userDocument?.currentLesson}
            weeklyReview={activeReview}
            nextAssignment={firstIncompleteLesson}
            smartDefault={smartDefaultLesson}
            userLevel={userDocument?.level}
            onContinue={userDocument?.currentLesson ? handleContinueLearning : undefined}
            onReview={activeReview?.status === 'ready' ? handleReviewClick : undefined}
            onStartAssignment={handleLessonClick}
            onStartDefault={handleLessonClick}
          />
        )}

        {/* Weekly Review Card - shown based on review status only */}
        {activeReview && (activeReview.status === 'ready' || activeReview.status === 'in_progress') && (
          <WeeklyReviewCard review={activeReview} onClick={handleReviewClick} />
        )}

        {/* Assignment Grid - replaces carousel */}
        <AssignmentGrid
          teacherName={
            userDocument?.role === 'teacher' || userDocument?.role === 'admin'
              ? userDocument?.displayName || 'You'
              : userDocument?.teacherName || 'your teacher'
          }
          lessons={lessons}
          maxVisible={6}
          onLessonClick={handleLessonClick}
          onSeeAll={() => {
            // Could navigate to a full lessons page in the future
            console.log('See all clicked');
          }}
        />

        {/* My Practice Section - custom lessons */}
        <MyPracticeSection
          lessons={customLessons}
          onLessonClick={handleCustomLessonClick}
          onEditLesson={handleEditLesson}
          onDeleteLesson={handleDeleteLesson}
        />

        {/* Quick Practice Section - Create My Own & Pronunciation Coach */}
        <ToolsSection
          onCreateOwn={handleCreateOwnClick}
          onPronunciationCoach={handlePronunciationClick}
        />
      </div>

      {/* Create My Own Modal */}
      <CreateOwnModal
        isOpen={showCreateOwnModal}
        onClose={() => {
          setShowCreateOwnModal(false);
          setEditingLesson(null);
        }}
        onSubmit={handleCreateOrUpdateLesson}
        userId={user?.uid || ''}
        editingLesson={editingLesson}
      />

      {/* Pronunciation Coach Modal */}
      <PronunciationModal
        isOpen={showPronunciationModal}
        onClose={() => setShowPronunciationModal(false)}
        onSubmit={handlePronunciationSubmit}
      />
    </div>
  );
}
