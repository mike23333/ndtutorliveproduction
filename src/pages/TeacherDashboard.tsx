import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import {
  PlusIcon,
  BarChartIcon,
  SparklesIcon,
  ArrowLeftIcon,
  SettingsIcon,
} from '../theme/icons';

// Hooks
import { useTeacherLessons } from '../hooks/useTeacherLessons';
import { useLessonForm } from '../hooks/useLessonForm';
import { useClassPulse } from '../hooks/useClassPulse';
import { useTeacherAnalytics } from '../hooks/useTeacherAnalytics';
import { usePromptTemplates } from '../hooks/usePromptTemplates';

// Components
import {
  TabButton,
  ClassPulseSection,
  LessonFormModal,
  SaveTemplateModal,
  LessonsTab,
  AnalyticsTab,
  TemplatesTab,
} from '../components/dashboard';

// Types
import type { TabType, LessonData } from '../types/dashboard';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('lessons');

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

  const {
    insights: classPulseInsights,
    loading: pulseLoading,
    generating: pulseGenerating,
    lastGenerated: pulseLastGenerated,
    generateInsights: handleGeneratePulse,
  } = useClassPulse(user?.uid);

  const {
    data: analyticsData,
    loading: analyticsLoading,
    period: analyticsPeriod,
    level: analyticsLevel,
    setPeriod: setAnalyticsPeriod,
    setLevel: setAnalyticsLevel,
  } = useTeacherAnalytics(user?.uid, activeTab === 'analytics');

  const {
    templates: promptTemplates,
    selectedTemplateId,
    selectTemplate,
    createTemplate,
    reviewTemplate,
    editedReviewTemplate,
    setEditedReviewTemplate,
    saveReviewTemplate,
    resetReviewTemplate,
    reviewTemplateLoading,
    reviewTemplateSaving,
    reviewTemplateChanged,
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
        background: gradientBackground,
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
          }}
        >
          <TabButton
            label="Lessons"
            isActive={activeTab === 'lessons'}
            onClick={() => setActiveTab('lessons')}
            icon={<SparklesIcon size={16} />}
          />
          <TabButton
            label="Analytics"
            isActive={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            icon={<BarChartIcon size={16} />}
          />
          <TabButton
            label="Templates"
            isActive={activeTab === 'templates'}
            onClick={() => setActiveTab('templates')}
            icon={<SettingsIcon size={16} />}
          />
        </div>

        {/* Class Pulse Section */}
        <ClassPulseSection
          insights={classPulseInsights}
          loading={pulseLoading}
          generating={pulseGenerating}
          lastGenerated={pulseLastGenerated}
          onGenerate={() => handleGeneratePulse(false)}
        />

        {/* Tab Content */}
        {activeTab === 'lessons' && (
          <LessonsTab
            lessons={lessons}
            onEdit={handleEditLesson}
            onDelete={handleDeleteLesson}
            onDuplicate={handleDuplicateLesson}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            data={analyticsData}
            loading={analyticsLoading}
            period={analyticsPeriod}
            level={analyticsLevel}
            onPeriodChange={setAnalyticsPeriod}
            onLevelChange={setAnalyticsLevel}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesTab
            reviewTemplate={reviewTemplate}
            editedTemplate={editedReviewTemplate}
            onTemplateChange={setEditedReviewTemplate}
            onSave={saveReviewTemplate}
            onReset={resetReviewTemplate}
            loading={reviewTemplateLoading}
            saving={reviewTemplateSaving}
            hasChanges={reviewTemplateChanged}
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
        onSystemPromptChange={lessonForm.setSystemPrompt}
        onDurationChange={lessonForm.setDurationMinutes}
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
