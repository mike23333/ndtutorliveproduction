import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { getMission } from '../services/firebase/missions';
import { getPronunciationCoachTemplate } from '../services/firebase/systemTemplates';
import { CustomLessonDocument } from '../types/firestore';
import { useAuth } from '../hooks/useAuth';
import { useCustomLessons } from '../hooks/useCustomLessons';
import { useStreak } from '../hooks/useStreak';
import { useHomepageData } from '../hooks/useHomepageData';
import { WeeklyReviewCard } from '../components/WeeklyReviewCard';
import { StreakAtRiskBanner } from '../components/streaks';
import { FirstTimeGuidance } from '../components/onboarding';
import {
  Header,
  UpNextCard,
  ToolsSection,
  CreateOwnModal,
  PronunciationModal,
  MyPracticeSection,
  AssignmentGrid,
  AllLessonsModal,
  LessonWithCompletion,
} from '../components/home';
import { LessonDetailModal, LessonDetailData } from '../components/roleplay';

/**
 * Request microphone permission before navigating to chat
 * iOS Safari requires getUserMedia to be called from a direct user gesture
 * @returns true if permission granted or non-blocking error, false if explicitly denied
 */
async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately stop tracks - we just needed to trigger the permission prompt
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    const err = error as Error;
    if (err.name === 'NotAllowedError') {
      alert('Microphone access is required for voice interaction. Please allow microphone permission and try again.');
      return false;
    }
    // For other errors (NotFoundError, etc.), continue to chat page and handle there
    console.warn('Pre-navigation microphone check failed:', err.message);
    return true;
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, userDocument } = useAuth();
  const { currentStreak, isAtRisk } = useStreak();

  // Use the new homepage data hook
  const {
    lessons,
    activeReview,
    smartDefaultLesson,
    isFirstTimeUser,
    userLevel,
    studentDisplayName,
    getFirstLesson,
  } = useHomepageData();

  // Custom lessons state
  const {
    lessons: customLessons,
    createLesson,
    updateLesson,
    deleteLesson,
  } = useCustomLessons(user?.uid, studentDisplayName);

  // Modal states
  const [showCreateOwnModal, setShowCreateOwnModal] = useState(false);
  const [showPronunciationModal, setShowPronunciationModal] = useState(false);
  const [showAllLessonsModal, setShowAllLessonsModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CustomLessonDocument | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetailData | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);

  // Check if student is suspended
  const isSuspended = userDocument?.role === 'student' && userDocument?.status === 'suspended';

  // Teacher name for display
  const teacherName =
    userDocument?.role === 'teacher' || userDocument?.role === 'admin'
      ? userDocument?.displayName || 'You'
      : userDocument?.teacherName || 'your teacher';

  // Redirect students without teacherId to join class page
  useEffect(() => {
    if (userDocument && userDocument.role === 'student') {
      if (!userDocument.teacherId) {
        navigate('/join-class');
        return;
      }
      if (!userDocument.level) {
        navigate('/select-level');
        return;
      }
    }
  }, [userDocument, navigate]);

  // Helper to map CEFR level to modal display label
  const getModalLevelLabel = (level: string | null): string => {
    if (!level) return 'Beginner';
    switch (level) {
      case 'A1':
      case 'A2':
        return 'Beginner';
      case 'B1':
        return 'Pre-Intermediate';
      case 'B2':
        return 'Intermediate';
      case 'C1':
      case 'C2':
        return 'Upper-Intermediate';
      default:
        return 'Beginner';
    }
  };

  // Fetch lesson detail from Firestore for modal display
  const fetchLessonDetail = async (lessonId: string): Promise<LessonDetailData | null> => {
    try {
      const mission = await getMission(lessonId);
      if (!mission) return null;

      // DEBUG: Log what we're getting from Firebase
      console.log('[fetchLessonDetail] Raw mission from Firebase:', {
        id: mission.id,
        systemPrompt: mission.systemPrompt?.slice(0, 150) + '...',
        scenario: mission.scenario?.slice(0, 150) + '...',
      });

      return {
        id: mission.id,
        title: mission.title,
        level: getModalLevelLabel(mission.targetLevel || null),
        imageUrl: mission.imageUrl || undefined,
        imageCropPosition: mission.imageCropPosition,
        description: mission.description || `Practice this ${mission.durationMinutes || 5}-minute lesson to improve your English skills.`,
        tasks: mission.tasks?.map((t, i) => ({
          id: String(i + 1),
          text: t.text,
          completed: false,
        })),
        systemPrompt: mission.systemPrompt || mission.scenario,
        durationMinutes: mission.durationMinutes,
        tone: mission.tone,
        functionCallingEnabled: mission.functionCallingEnabled,
        functionCallingInstructions: mission.functionCallingInstructions,
        teacherId: mission.teacherId,
        allowTranslation: mission.allowTranslation ?? true, // Default to true
      };
    } catch (error) {
      console.error('Error fetching lesson detail:', error);
      return null;
    }
  };

  // Handle lesson click - show modal for teacher-assigned lessons
  const handleLessonClick = async (lesson: LessonWithCompletion) => {
    if (lesson.teacherId && !lesson.id.startsWith('custom-')) {
      const lessonDetail = await fetchLessonDetail(lesson.id);
      if (lessonDetail) {
        setSelectedLesson(lessonDetail);
        setShowLessonModal(true);
        return;
      }
    }

    // Fallback or for custom lessons: navigate directly
    // Request microphone permission before navigating (for iOS Safari)
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

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
      allowTranslation: (lesson as any).allowTranslation ?? true, // Default to true
    };
    sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));
    navigate(`/chat/${lesson.id}`);
  };

  // Handle continue learning - prioritize in-progress, then newest lesson (matches group class rhythm)
  const handleContinueLearning = async () => {
    const currentLesson = userDocument?.currentLesson;
    if (currentLesson) {
      // Resume in-progress lesson (started but not finished)
      const fullLesson = lessons.find((l) => l.id === currentLesson.missionId);
      if (fullLesson) {
        handleLessonClick(fullLesson);
      } else {
        // Request microphone permission before navigating (for iOS Safari)
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) return;
        navigate(`/chat/${currentLesson.missionId}`);
      }
    } else if (smartDefaultLesson) {
      // Go to newest lesson (aligns with latest group class)
      handleLessonClick(smartDefaultLesson);
    }
  };

  // Handle review lesson click
  const handleReviewClick = async () => {
    if (!activeReview) return;

    // Request microphone permission before navigating (for iOS Safari)
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

    const roleConfig = {
      id: `review-${activeReview.id}`,
      name: 'Weekly Review',
      icon: '✨',
      scenario: `Practice conversation with your struggle words from this week`,
      systemPrompt: activeReview.generatedPrompt.replace(/\{\{studentName\}\}/g, studentDisplayName),
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
    if (editingLesson) {
      await updateLesson(editingLesson.id, data, userLevel);
    } else {
      await createLesson(data, userLevel);
    }
  };

  const handleCustomLessonClick = async (lesson: CustomLessonDocument) => {
    // Request microphone permission before navigating (for iOS Safari)
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

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
    // Request microphone permission before navigating (for iOS Safari)
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;

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
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* First Time User Guidance - only show if no assigned lessons */}
        {isFirstTimeUser && lessons.length === 0 ? (
          <FirstTimeGuidance
            teacherName={userDocument?.teacherName}
            firstLesson={getFirstLesson()}
            onStart={() => {
              const firstLesson = getFirstLesson();
              if (firstLesson) {
                sessionStorage.setItem('isFirstSession', 'true');
                handleLessonClick(firstLesson);
              }
            }}
          />
        ) : (
          <>
            {/* Header - Premium greeting with streak */}
            <Header
              userName={studentDisplayName}
              streakDays={currentStreak}
            />

            {/* Up Next Card - Shows newest teacher-assigned lesson (matches group class rhythm) */}
            <UpNextCard
              lesson={smartDefaultLesson}
              inProgressLesson={userDocument?.currentLesson}
              teacherName={teacherName}
              onContinue={handleContinueLearning}
              onLessonClick={handleLessonClick}
            />

            {/* Streak at risk banner - below hero */}
            {isAtRisk && (
              <div style={{ padding: '0 20px', marginBottom: '20px' }}>
                <StreakAtRiskBanner
                  currentStreak={currentStreak}
                  onQuickPractice={() => {
                    if (smartDefaultLesson) {
                      handleLessonClick(smartDefaultLesson);
                    }
                  }}
                />
              </div>
            )}

            {/* Weekly Review Card */}
            {activeReview && (activeReview.status === 'ready' || activeReview.status === 'in_progress') && (
              <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <WeeklyReviewCard review={activeReview} onClick={handleReviewClick} />
              </div>
            )}

            {/* Content sections with consistent gap */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {/* Assignment Grid - horizontal scrollable lessons */}
              <AssignmentGrid
                teacherName={teacherName}
                lessons={lessons}
                onLessonClick={handleLessonClick}
                onSeeAll={() => setShowAllLessonsModal(true)}
              />

              {/* Quick Practice Section */}
              <ToolsSection
                onCreateOwn={handleCreateOwnClick}
                onPronunciationCoach={handlePronunciationClick}
              />

              {/* My Practice Section - custom lessons */}
              <MyPracticeSection
                lessons={customLessons}
                onLessonClick={handleCustomLessonClick}
                onEditLesson={handleEditLesson}
                onDeleteLesson={handleDeleteLesson}
              />
            </div>
          </>
        )}
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

      {/* Lesson Detail Modal for teacher-assigned lessons */}
      <LessonDetailModal
        isOpen={showLessonModal}
        onClose={() => {
          setShowLessonModal(false);
          setSelectedLesson(null);
        }}
        onStartChat={(lessonId) => {
          setShowLessonModal(false);
          setShowAllLessonsModal(false); // Close "See All" modal too if open
          navigate(`/chat/${lessonId}`);
        }}
        lesson={selectedLesson}
      />

      {/* All Lessons Modal - shows all teacher lessons */}
      <AllLessonsModal
        isOpen={showAllLessonsModal}
        onClose={() => setShowAllLessonsModal(false)}
        lessons={lessons}
        teacherName={teacherName}
        onLessonClick={handleLessonClick}
      />
    </div>
  );
}
