import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import {
  PlusIcon,
  BarChartIcon,
  SparklesIcon,
  ArrowLeftIcon,
  SettingsIcon,
  UserIcon,
  BookOpenIcon,
} from '../theme/icons';

// Hooks
import { useTeacherLessons } from '../hooks/useTeacherLessons';
import { useLessonForm } from '../hooks/useLessonForm';
import { useClassPulse } from '../hooks/useClassPulse';
import { useTeacherAnalytics } from '../hooks/useTeacherAnalytics';
import { usePromptTemplates } from '../hooks/usePromptTemplates';
import { useCollections } from '../hooks/useCollections';

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
} from '../components/dashboard';
import { getStudentsForTeacher } from '../services/firebase/students';
import type { UserDocument } from '../types/firestore';

// Types
import type { TabType, LessonData } from '../types/dashboard';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userDocument } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('lessons');

  // Class code state (can be updated when regenerated)
  const [classCode, setClassCode] = useState<string | undefined>(undefined);

  // Initialize classCode from userDocument
  React.useEffect(() => {
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
  } = useClassPulse(user?.uid);

  // Analytics data for billing tab
  const {
    data: analyticsData,
    loading: analyticsLoading,
    period: analyticsPeriod,
    setPeriod: setAnalyticsPeriod,
  } = useTeacherAnalytics(user?.uid, activeTab === 'billing');

  // Students list for insights tab and private student assignment
  const [students, setStudents] = React.useState<UserDocument[]>([]);

  // Fetch students on mount (needed for private student assignment in lesson modal)
  React.useEffect(() => {
    if (user?.uid && students.length === 0) {
      getStudentsForTeacher(user.uid)
        .then(setStudents)
        .catch(console.error);
    }
  }, [user?.uid, students.length]);

  // Filter private students for lesson assignment
  const privateStudents = React.useMemo(() =>
    students.filter(s => s.isPrivateStudent),
    [students]
  );

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
  } = usePromptTemplates(user?.uid, activeTab === 'templates');

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
          user?.displayName || 'Teacher'
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
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: 'clamp(16px, 4vw, 24px)',
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
              style={{
                background: AppColors.surfaceLight,
                border: 'none',
                borderRadius: 'clamp(8px, 2vw, 10px)',
                padding: 'clamp(8px, 2vw, 10px)',
                color: AppColors.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
            onClick={() => setShowCreateModal(true)}
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
            }}
          >
            <PlusIcon size={18} />
            <span style={{ display: 'none' }} className="hide-mobile">New Lesson</span>
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(6px, 1.5vw, 8px)',
            marginBottom: 'clamp(20px, 5vw, 28px)',
            background: AppColors.surfaceLight,
            padding: 'clamp(4px, 1vw, 6px)',
            borderRadius: 'clamp(20px, 5vw, 24px)',
            overflowX: 'auto',
          }}
        >
          <TabButton
            label="Lessons"
            isActive={activeTab === 'lessons'}
            onClick={() => setActiveTab('lessons')}
            icon={<SparklesIcon size={16} />}
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
            icon={<BarChartIcon size={16} />}
          />
          <TabButton
            label="Billing"
            isActive={activeTab === 'billing'}
            onClick={() => setActiveTab('billing')}
            icon={<BarChartIcon size={16} />}
          />
          <TabButton
            label="Templates"
            isActive={activeTab === 'templates'}
            onClick={() => setActiveTab('templates')}
            icon={<SettingsIcon size={16} />}
          />
          <TabButton
            label="Collections"
            isActive={activeTab === 'roleplay'}
            onClick={() => setActiveTab('roleplay')}
            icon={<BookOpenIcon size={16} />}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'lessons' && (
          <LessonsTab
            lessons={lessons}
            onEdit={handleEditLesson}
            onDelete={handleDeleteLesson}
            onDuplicate={handleDuplicateLesson}
          />
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
          />
        )}

        {activeTab === 'billing' && (
          <BillingTab
            data={analyticsData}
            loading={analyticsLoading}
            period={analyticsPeriod}
            onPeriodChange={setAnalyticsPeriod}
          />
        )}

        {activeTab === 'roleplay' && (
          <RolePlayTab />
        )}

        {activeTab === 'templates' && (
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
        )}
      </div>

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

export default TeacherDashboard;
