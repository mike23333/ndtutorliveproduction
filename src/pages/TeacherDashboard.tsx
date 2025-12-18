import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import {
  PlusIcon,
  SparklesIcon,
  ArrowLeftIcon,
  SettingsIcon,
  UserIcon,
  BookOpenIcon,
  HomeIcon,
  LanguagesIcon,
} from '../theme/icons';
import { updateUserProfile } from '../services/firebase/auth';

// Hooks
import { useTeacherLessons } from '../hooks/useTeacherLessons';
import { useLessonForm } from '../hooks/useLessonForm';
import { useClassPulse } from '../hooks/useClassPulse';
import { useTeacherAnalytics } from '../hooks/useTeacherAnalytics';
import { usePromptTemplates } from '../hooks/usePromptTemplates';
import { useCollections } from '../hooks/useCollections';
import { useRecentActivity } from '../hooks/useRecentActivity';

// Components
import {
  TabButton,
  LessonFormModal,
  SaveTemplateModal,
  LessonsTab,
  StudentsTab,
  TemplatesTab,
  InsightsTab,
  BillingTab,
  RolePlayTab,
  FloatingActionButton,
  DashboardHome,
} from '../components/dashboard';
import type { AttentionStudent } from '../components/dashboard';
import { getStudentsForTeacher } from '../services/firebase/students';
import { updateMission } from '../services/firebase/missions';
import type { UserDocument } from '../types/firestore';

// Types
import type { TabType, LessonData } from '../types/dashboard';

// Extended tab type to include new dashboard tab
type ExtendedTabType = TabType | 'dashboard' | 'settings';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userDocument } = useAuth();

  // Tab state - now defaults to dashboard
  const [activeTab, setActiveTab] = useState<ExtendedTabType>('dashboard');

  // Class code state (can be updated when regenerated)
  const [classCode, setClassCode] = useState<string | undefined>(undefined);

  // Initialize classCode from userDocument
  useEffect(() => {
    if (userDocument?.classCode) {
      setClassCode(userDocument.classCode);
    }
  }, [userDocument?.classCode]);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Custom hooks
  const {
    lessons,
    createLesson,
    updateLesson,
    deleteLesson,
    duplicateLesson,
    refetch: refetchLessons,
  } = useTeacherLessons();

  const lessonForm = useLessonForm();

  // Collections for RolePlay tab and lesson form dropdown
  const { collections } = useCollections();

  const {
    insights: classPulseInsights,
    loading: pulseLoading,
    generating: pulseGenerating,
    lastGenerated: pulseLastGenerated,
    generateInsights: handleGeneratePulse,
    askQuestion: handleAskPulseQuestion,
    isAskingQuestion: pulseAskingQuestion,
    questionAnswer: pulseQuestionAnswer,
  } = useClassPulse(user?.uid);

  // Analytics data for billing tab
  const {
    data: analyticsData,
    loading: analyticsLoading,
    period: analyticsPeriod,
    setPeriod: setAnalyticsPeriod,
  } = useTeacherAnalytics(user?.uid, activeTab === 'billing' || activeTab === 'settings');

  // Students list for insights tab and private student assignment
  const [students, setStudents] = useState<UserDocument[]>([]);

  // Fetch students on mount (needed for private student assignment in lesson modal)
  useEffect(() => {
    if (user?.uid && students.length === 0) {
      getStudentsForTeacher(user.uid)
        .then(setStudents)
        .catch(console.error);
    }
  }, [user?.uid, students.length]);

  // Filter private students for lesson assignment
  const privateStudents = useMemo(() =>
    students.filter(s => s.isPrivateStudent),
    [students]
  );

  // Compute attention students (inactive 7+ days or struggling)
  const attentionStudents = useMemo((): AttentionStudent[] => {
    const now = new Date();
    const result: AttentionStudent[] = [];

    for (const student of students) {
      if (student.status === 'suspended') continue;

      const lastActive = student.lastSessionAt?.toDate?.() ||
        student.joinedClassAt?.toDate?.() ||
        new Date();
      const daysSinceActive = Math.floor(
        (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActive >= 7) {
        result.push({
          uid: student.uid,
          name: student.displayName,
          reason: 'inactive',
          details: `Inactive for ${daysSinceActive} days`,
        });
        continue;
      }

      // Check for struggling (low average stars)
      if (student.totalSessions && student.totalSessions > 2 && student.totalStars !== undefined) {
        const avgStars = student.totalStars / student.totalSessions;
        if (avgStars < 1.5) {
          result.push({
            uid: student.uid,
            name: student.displayName,
            reason: 'struggling',
            details: `Averaging ${avgStars.toFixed(1)} stars per lesson`,
          });
        }
      }
    }

    return result.slice(0, 5);
  }, [students]);

  // Compute active students today (based on lastSessionAt)
  const activeToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return students.filter(s => {
      const lastActive = s.lastSessionAt?.toDate?.();
      if (!lastActive) return false;
      return lastActive >= today;
    }).length;
  }, [students]);

  // Real-time activity feed from Firestore
  const {
    activities: recentActivity,
    loading: activityLoading,
  } = useRecentActivity(user?.uid, 10);

  // Handler to navigate to student in Students tab
  const handleNavigateToStudent = useCallback((_studentId: string) => {
    setActiveTab('students');
    // Note: Could add filtering logic here if StudentsTab supports it
  }, []);

  const {
    templates: promptTemplates,
    selectedTemplateId,
    selectTemplate,
    createTemplate,
    // Weekly review template
    reviewTemplate,
    editedReviewTemplate,
    setEditedReviewTemplate,
    saveReviewTemplate,
    discardReviewChanges,
    resetReviewToDefault,
    reviewTemplateLoading,
    reviewTemplateSaving,
    reviewTemplateChanged,
    // Custom lesson template
    customLessonTemplate,
    editedCustomLessonTemplate,
    setEditedCustomLessonTemplate,
    saveCustomLessonTemplate,
    discardCustomLessonChanges,
    resetCustomLessonToDefault,
    customLessonTemplateLoading,
    customLessonTemplateSaving,
    customLessonTemplateChanged,
    // Pronunciation coach template
    pronunciationTemplate,
    editedPronunciationTemplate,
    setEditedPronunciationTemplate,
    savePronunciationTemplate,
    discardPronunciationChanges,
    resetPronunciationToDefault,
    pronunciationTemplateLoading,
    pronunciationTemplateSaving,
    pronunciationTemplateChanged,
    // Default intro lesson template
    introLessonTemplate,
    editedIntroLessonTemplate,
    setEditedIntroLessonTemplate,
    saveIntroLessonTemplate,
    discardIntroLessonChanges,
    resetIntroLessonToDefault,
    introLessonTemplateLoading,
    introLessonTemplateSaving,
    introLessonTemplateChanged,
  } = usePromptTemplates(user?.uid, activeTab === 'templates' || activeTab === 'settings');

  // Handlers
  const handleEditLesson = useCallback((lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    lessonForm.loadFromLesson(lesson);
    setEditingLessonId(lessonId);
    setShowCreateModal(true);
  }, [lessons, lessonForm]);

  const handleDuplicateLesson = useCallback((lesson: LessonData) => {
    const duplicated = duplicateLesson(lesson);
    lessonForm.loadFromFormData(duplicated);
    setEditingLessonId(null);
    setShowCreateModal(true);
  }, [duplicateLesson, lessonForm]);

  const handleDeleteLesson = useCallback(async (lessonId: string) => {
    try {
      await deleteLesson(lessonId);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson');
    }
  }, [deleteLesson]);

  const handleSaveLesson = useCallback(async () => {
    if (!lessonForm.isValid) {
      alert('Please fill in title and system prompt');
      return;
    }

    lessonForm.setSaving(true);
    try {
      if (editingLessonId) {
        await updateLesson(editingLessonId, lessonForm.formData);
      } else {
        await createLesson(
          lessonForm.formData,
          user?.uid || 'anonymous',
          user?.displayName || 'Teacher',
          { allowTranslation: userDocument?.allowTranslation ?? true }
        );
      }
      setShowCreateModal(false);
      lessonForm.reset();
      setEditingLessonId(null);
    } catch (error: unknown) {
      console.error('Error saving lesson:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save lesson: ${errorMessage}`);
    } finally {
      lessonForm.setSaving(false);
    }
  }, [lessonForm, editingLessonId, updateLesson, createLesson, user]);

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
    lessonForm.reset();
    setEditingLessonId(null);
  }, [lessonForm]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = selectTemplate(templateId);
    if (template) {
      lessonForm.setSystemPrompt(template.systemPrompt);
      if (template.defaultDurationMinutes) {
        lessonForm.setDurationMinutes(template.defaultDurationMinutes);
      }
    }
  }, [selectTemplate, lessonForm]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!newTemplateName.trim() || !lessonForm.formData.systemPrompt.trim()) {
      alert('Please provide a template name and system prompt');
      return;
    }

    try {
      await createTemplate(
        newTemplateName,
        lessonForm.formData.systemPrompt,
        lessonForm.formData.durationMinutes
      );
      setShowSaveTemplateModal(false);
      setNewTemplateName('');
      alert('Template saved successfully!');
    } catch (error: unknown) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save template: ${errorMessage}`);
    }
  }, [newTemplateName, lessonForm.formData, createTemplate]);

  const handleOpenCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleNavigateToInsights = useCallback(() => {
    setActiveTab('insights');
    handleGeneratePulse(true);
  }, [handleGeneratePulse]);

  const handleToggleLessonStatus = useCallback(async (lessonId: string, newStatus: 'published' | 'draft') => {
    try {
      await updateMission({
        id: lessonId,
        isActive: newStatus === 'published',
      });
      await refetchLessons();
    } catch (error) {
      console.error('Error toggling lesson status:', error);
      alert('Failed to update lesson status');
    }
  }, [refetchLessons]);

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
        overflowY: 'auto',
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dashboard-content {
          animation: fadeInUp 0.4s ease-out;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }
        .tab-button:hover {
          background: rgba(139, 92, 246, 0.12);
        }
        .header-button:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        @media (max-width: 640px) {
          .new-lesson-desktop { display: none !important; }
        }
        @media (min-width: 641px) {
          .new-lesson-desktop { display: flex !important; }
        }
      `}</style>

      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: 'clamp(16px, 4vw, 24px)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'clamp(20px, 5vw, 28px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.5vw, 14px)' }}>
            <button
              onClick={() => navigate('/')}
              className="header-button"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                color: AppColors.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowLeftIcon size={20} />
            </button>
            <div>
              <h1
                style={{
                  fontSize: 'clamp(20px, 5vw, 26px)',
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Teacher Dashboard
              </h1>
              <p
                style={{
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  color: AppColors.textSecondary,
                  margin: 0,
                }}
              >
                Manage lessons and track progress
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="new-lesson-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1.5vw, 8px)',
              background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
              border: 'none',
              borderRadius: 'clamp(10px, 2.5vw, 14px)',
              padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
              color: AppColors.textDark,
              fontSize: 'clamp(13px, 2.8vw, 15px)',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <PlusIcon size={18} />
            <span>New Lesson</span>
          </button>
        </div>

        {/* Tabs - Consolidated to 4 + Settings */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(4px, 1vw, 6px)',
            marginBottom: 'clamp(20px, 5vw, 28px)',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: 'clamp(4px, 1vw, 6px)',
            borderRadius: 'clamp(16px, 4vw, 20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <TabButton
            label="Home"
            isActive={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            icon={<HomeIcon size={16} />}
          />
          <TabButton
            label="Lessons"
            isActive={activeTab === 'lessons' || activeTab === 'roleplay'}
            onClick={() => setActiveTab('lessons')}
            icon={<BookOpenIcon size={16} />}
          />
          <TabButton
            label="Students"
            isActive={activeTab === 'students'}
            onClick={() => setActiveTab('students')}
            icon={<UserIcon size={16} />}
          />
          <TabButton
            label="Insights"
            isActive={activeTab === 'insights'}
            onClick={() => setActiveTab('insights')}
            icon={<SparklesIcon size={16} />}
          />
          <TabButton
            label="Settings"
            isActive={activeTab === 'settings' || activeTab === 'billing' || activeTab === 'templates'}
            onClick={() => setActiveTab('settings')}
            icon={<SettingsIcon size={16} />}
            iconOnly
          />
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
            <DashboardHome
              teacherName={userDocument?.displayName || user?.displayName || 'Teacher'}
              lessonsCount={lessons.length}
              studentsCount={students.length}
              activeToday={activeToday}
              attentionStudents={attentionStudents}
              recentActivity={recentActivity}
              activityLoading={activityLoading}
              onCreateLesson={handleOpenCreateModal}
              onGenerateInsights={handleNavigateToInsights}
              onNavigateToStudent={handleNavigateToStudent}
              onNavigateToStudents={() => setActiveTab('students')}
            />
          )}

          {activeTab === 'lessons' && (
            <LessonsTab
              lessons={lessons}
              onEdit={handleEditLesson}
              onDelete={handleDeleteLesson}
              onDuplicate={handleDuplicateLesson}
              onToggleStatus={handleToggleLessonStatus}
            />
          )}

          {activeTab === 'roleplay' && (
            <RolePlayTab />
          )}

          {activeTab === 'students' && user && (
            <StudentsTab
              teacherId={user.uid}
              teacherName={userDocument?.displayName || user.email || 'Teacher'}
              classCode={classCode}
              onClassCodeRegenerated={setClassCode}
            />
          )}

          {activeTab === 'insights' && user && (
            <InsightsTab
              teacherId={user.uid}
              students={students}
              onNavigateToStudent={handleNavigateToStudent}
              classPulseInsights={classPulseInsights}
              classPulseLoading={pulseLoading}
              classPulseGenerating={pulseGenerating}
              classPulseLastGenerated={pulseLastGenerated}
              onGeneratePulse={() => handleGeneratePulse(true)}
              onAskQuestion={handleAskPulseQuestion}
              isAskingQuestion={pulseAskingQuestion}
              questionAnswer={pulseQuestionAnswer}
            />
          )}

          {/* Settings Tab - Combines Billing, Templates, Collections */}
          {activeTab === 'settings' && (
            <div>
              {/* Section Navigation */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                }}
              >
                <SettingsSubTab
                  label="Billing"
                  icon="💳"
                  isActive={false}
                  onClick={() => setActiveTab('billing')}
                />
                <SettingsSubTab
                  label="Templates"
                  icon="📝"
                  isActive={false}
                  onClick={() => setActiveTab('templates')}
                />
                <SettingsSubTab
                  label="Collections"
                  icon="📚"
                  isActive={false}
                  onClick={() => setActiveTab('roleplay')}
                />
              </div>

              {/* Default Settings Content */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px',
                  padding: 'clamp(24px, 6vw, 32px)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
                <h2
                  style={{
                    fontSize: 'clamp(18px, 4vw, 22px)',
                    fontWeight: 600,
                    margin: '0 0 8px 0',
                    color: AppColors.textPrimary,
                  }}
                >
                  Settings
                </h2>
                <p
                  style={{
                    fontSize: 'clamp(14px, 3vw, 15px)',
                    color: AppColors.textSecondary,
                    margin: '0 0 24px 0',
                  }}
                >
                  Manage billing, templates, and collections
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                  }}
                >
                  <SettingsCard
                    title="Billing"
                    description="Usage & payments"
                    icon="💳"
                    onClick={() => setActiveTab('billing')}
                  />
                  <SettingsCard
                    title="Templates"
                    description="Prompt templates"
                    icon="📝"
                    onClick={() => setActiveTab('templates')}
                  />
                  <SettingsCard
                    title="Collections"
                    description="Lesson groups"
                    icon="📚"
                    onClick={() => setActiveTab('roleplay')}
                  />
                </div>
              </div>

              {/* Class Settings Section */}
              <div
                style={{
                  marginTop: '24px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px',
                  padding: 'clamp(20px, 5vw, 28px)',
                }}
              >
                <h3
                  style={{
                    fontSize: 'clamp(16px, 3.5vw, 18px)',
                    fontWeight: 600,
                    margin: '0 0 16px 0',
                    color: AppColors.textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: AppColors.accentPurple }}><LanguagesIcon size={20} /></span>
                  Student Features
                </h3>

                {/* Translation Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        color: AppColors.textPrimary,
                        marginBottom: '4px',
                      }}
                    >
                      Allow Translation
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: AppColors.textSecondary,
                      }}
                    >
                      Students can translate AI messages to their native language
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!user?.uid) return;
                      const newValue = !(userDocument?.allowTranslation ?? true);
                      await updateUserProfile(user.uid, { allowTranslation: newValue });
                    }}
                    style={{
                      width: '52px',
                      height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      backgroundColor: (userDocument?.allowTranslation ?? true)
                        ? AppColors.accentPurple
                        : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        position: 'absolute',
                        top: '3px',
                        left: (userDocument?.allowTranslation ?? true) ? '27px' : '3px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div>
              <button
                onClick={() => setActiveTab('settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: AppColors.textSecondary,
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  padding: 0,
                }}
              >
                <ArrowLeftIcon size={16} />
                Back to Settings
              </button>
              <BillingTab
                data={analyticsData}
                loading={analyticsLoading}
                period={analyticsPeriod}
                onPeriodChange={setAnalyticsPeriod}
              />
            </div>
          )}

          {activeTab === 'templates' && (
            <div>
              <button
                onClick={() => setActiveTab('settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: AppColors.textSecondary,
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  padding: 0,
                }}
              >
                <ArrowLeftIcon size={16} />
                Back to Settings
              </button>
              <TemplatesTab
                // Weekly Review Template
                reviewTemplate={reviewTemplate}
                editedReviewTemplate={editedReviewTemplate}
                onReviewTemplateChange={setEditedReviewTemplate}
                onSaveReview={saveReviewTemplate}
                onDiscardReviewChanges={discardReviewChanges}
                onResetReviewToDefault={resetReviewToDefault}
                reviewLoading={reviewTemplateLoading}
                reviewSaving={reviewTemplateSaving}
                reviewHasChanges={reviewTemplateChanged}
                // Custom Lesson Template
                customLessonTemplate={customLessonTemplate}
                editedCustomLessonTemplate={editedCustomLessonTemplate}
                onCustomLessonTemplateChange={setEditedCustomLessonTemplate}
                onSaveCustomLesson={saveCustomLessonTemplate}
                onDiscardCustomLessonChanges={discardCustomLessonChanges}
                onResetCustomLessonToDefault={resetCustomLessonToDefault}
                customLessonLoading={customLessonTemplateLoading}
                customLessonSaving={customLessonTemplateSaving}
                customLessonHasChanges={customLessonTemplateChanged}
                // Pronunciation Coach Template
                pronunciationTemplate={pronunciationTemplate}
                editedPronunciationTemplate={editedPronunciationTemplate}
                onPronunciationTemplateChange={setEditedPronunciationTemplate}
                onSavePronunciation={savePronunciationTemplate}
                onDiscardPronunciationChanges={discardPronunciationChanges}
                onResetPronunciationToDefault={resetPronunciationToDefault}
                pronunciationLoading={pronunciationTemplateLoading}
                pronunciationSaving={pronunciationTemplateSaving}
                pronunciationHasChanges={pronunciationTemplateChanged}
                // Default Intro Lesson Template
                introLessonTemplate={introLessonTemplate}
                editedIntroLessonTemplate={editedIntroLessonTemplate}
                onIntroLessonTemplateChange={setEditedIntroLessonTemplate}
                onSaveIntroLesson={saveIntroLessonTemplate}
                onDiscardIntroLessonChanges={discardIntroLessonChanges}
                onResetIntroLessonToDefault={resetIntroLessonToDefault}
                introLessonLoading={introLessonTemplateLoading}
                introLessonSaving={introLessonTemplateSaving}
                introLessonHasChanges={introLessonTemplateChanged}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <FloatingActionButton onClick={handleOpenCreateModal} />

      {/* Lesson Form Modal */}
      <LessonFormModal
        isOpen={showCreateModal}
        isEditing={!!editingLessonId}
        formData={lessonForm.formData}
        onClose={handleCloseModal}
        onSave={handleSaveLesson}
        onTitleChange={lessonForm.setTitle}
        onDescriptionChange={lessonForm.setDescription}
        onSystemPromptChange={lessonForm.setSystemPrompt}
        onDurationChange={lessonForm.setDurationMinutes}
        onTargetLevelChange={lessonForm.setTargetLevel}
        onFirstLessonChange={lessonForm.setIsFirstLesson}
        onImageUpload={lessonForm.setImage}
        onImageRemove={lessonForm.clearImage}
        teacherId={user?.uid || 'anonymous'}
        saving={lessonForm.saving}
        isUploading={lessonForm.isUploading}
        setIsUploading={lessonForm.setIsUploading}
        promptTemplates={promptTemplates}
        selectedTemplateId={selectedTemplateId}
        onTemplateSelect={handleTemplateSelect}
        onSaveAsTemplate={() => setShowSaveTemplateModal(true)}
        privateStudents={privateStudents}
        onAssignedStudentsChange={lessonForm.setAssignedStudentIds}
        onTasksChange={lessonForm.setTasks}
        // RolePlay Collections
        collections={collections.map(c => ({ id: c.id, title: c.title }))}
        onCollectionChange={lessonForm.setCollectionId}
        onShowOnHomepageChange={lessonForm.setShowOnHomepage}
      />

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        templateName={newTemplateName}
        onClose={() => {
          setShowSaveTemplateModal(false);
          setNewTemplateName('');
        }}
        onSave={handleSaveAsTemplate}
        onNameChange={setNewTemplateName}
      />
    </div>
  );
};

// Settings Sub-Tab Button
interface SettingsSubTabProps {
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}

const SettingsSubTab: React.FC<SettingsSubTabProps> = ({
  label,
  icon,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      background: isActive
        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)'
        : 'rgba(255, 255, 255, 0.05)',
      border: isActive
        ? '1px solid rgba(139, 92, 246, 0.3)'
        : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      color: isActive ? AppColors.textPrimary : AppColors.textSecondary,
      fontSize: '14px',
      fontWeight: isActive ? 600 : 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    <span>{icon}</span>
    {label}
  </button>
);

// Settings Card
interface SettingsCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  icon,
  onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 16px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    <span style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</span>
    <span
      style={{
        fontSize: '15px',
        fontWeight: 600,
        color: AppColors.textPrimary,
        marginBottom: '2px',
      }}
    >
      {title}
    </span>
    <span
      style={{
        fontSize: '12px',
        color: AppColors.textSecondary,
      }}
    >
      {description}
    </span>
  </button>
);

export default TeacherDashboard;
