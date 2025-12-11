import React, { useState } from 'react';
import { AppColors } from '../../theme/colors';
import type { SystemTemplateDocument } from '../../types/firestore';

interface TemplateSection {
  id: string;
  title: string;
  description: string;
  placeholders: Array<{ code: string; description: string }>;
  template: SystemTemplateDocument | null;
  editedTemplate: string;
  onTemplateChange: (template: string) => void;
  onSave: () => Promise<void>;
  onDiscardChanges: () => void;
  onResetToDefault: () => void;
  loading: boolean;
  saving: boolean;
  hasChanges: boolean;
}

interface TemplatesTabProps {
  // Weekly Review Template
  reviewTemplate: SystemTemplateDocument | null;
  editedReviewTemplate: string;
  onReviewTemplateChange: (template: string) => void;
  onSaveReview: () => Promise<void>;
  onDiscardReviewChanges: () => void;
  onResetReviewToDefault: () => void;
  reviewLoading: boolean;
  reviewSaving: boolean;
  reviewHasChanges: boolean;

  // Custom Lesson Template
  customLessonTemplate: SystemTemplateDocument | null;
  editedCustomLessonTemplate: string;
  onCustomLessonTemplateChange: (template: string) => void;
  onSaveCustomLesson: () => Promise<void>;
  onDiscardCustomLessonChanges: () => void;
  onResetCustomLessonToDefault: () => void;
  customLessonLoading: boolean;
  customLessonSaving: boolean;
  customLessonHasChanges: boolean;

  // Pronunciation Coach Template
  pronunciationTemplate: SystemTemplateDocument | null;
  editedPronunciationTemplate: string;
  onPronunciationTemplateChange: (template: string) => void;
  onSavePronunciation: () => Promise<void>;
  onDiscardPronunciationChanges: () => void;
  onResetPronunciationToDefault: () => void;
  pronunciationLoading: boolean;
  pronunciationSaving: boolean;
  pronunciationHasChanges: boolean;

  // Default Intro Lesson Template
  introLessonTemplate: SystemTemplateDocument | null;
  editedIntroLessonTemplate: string;
  onIntroLessonTemplateChange: (template: string) => void;
  onSaveIntroLesson: () => Promise<void>;
  onDiscardIntroLessonChanges: () => void;
  onResetIntroLessonToDefault: () => void;
  introLessonLoading: boolean;
  introLessonSaving: boolean;
  introLessonHasChanges: boolean;
}

// Collapsible section component
const CollapsibleSection: React.FC<{
  section: TemplateSection;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ section, isExpanded, onToggle }) => {
  const handleSave = async () => {
    try {
      await section.onSave();
      alert('Template saved successfully!');
    } catch {
      alert('Failed to save template. Please try again.');
    }
  };

  return (
    <div
      style={{
        background: AppColors.surfaceLight,
        borderRadius: 'clamp(12px, 3vw, 16px)',
        marginBottom: 'clamp(12px, 3vw, 16px)',
        overflow: 'hidden',
      }}
    >
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: 'clamp(14px, 3.5vw, 20px)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              margin: '0 0 clamp(2px, 0.5vw, 4px) 0',
              color: AppColors.textPrimary,
            }}
          >
            {section.title}
          </h3>
          <p
            style={{
              fontSize: 'clamp(11px, 2.2vw, 12px)',
              color: AppColors.textSecondary,
              margin: 0,
            }}
          >
            {section.description}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {section.hasChanges && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: AppColors.accentPurple,
              }}
            />
          )}
          <span
            style={{
              fontSize: '20px',
              color: AppColors.textSecondary,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Content - expandable */}
      {isExpanded && (
        <div style={{ padding: '0 clamp(14px, 3.5vw, 20px) clamp(14px, 3.5vw, 20px)' }}>
          {/* Placeholder info */}
          <div
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: 'clamp(8px, 2vw, 10px)',
              padding: 'clamp(10px, 2.5vw, 14px)',
              marginBottom: 'clamp(12px, 3vw, 16px)',
            }}
          >
            <p
              style={{
                fontSize: 'clamp(11px, 2.2vw, 12px)',
                color: AppColors.accentPurple,
                margin: '0 0 clamp(6px, 1.5vw, 8px) 0',
                fontWeight: 600,
              }}
            >
              Available Placeholders:
            </p>
            {section.placeholders.map((placeholder, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: 'clamp(6px, 1.5vw, 10px)',
                  flexWrap: 'wrap',
                  marginTop: index > 0 ? '6px' : 0,
                }}
              >
                <code
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: 'clamp(11px, 2.2vw, 12px)',
                    color: AppColors.textPrimary,
                  }}
                >
                  {placeholder.code}
                </code>
                <span
                  style={{
                    fontSize: 'clamp(11px, 2.2vw, 12px)',
                    color: AppColors.textSecondary,
                  }}
                >
                  {placeholder.description}
                </span>
              </div>
            ))}
          </div>

          {section.loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'clamp(20px, 5vw, 40px)',
                color: AppColors.textSecondary,
              }}
            >
              Loading template...
            </div>
          ) : (
            <>
              <textarea
                value={section.editedTemplate}
                onChange={(e) => section.onTemplateChange(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 'clamp(200px, 30vh, 350px)',
                  background: AppColors.surfaceMedium,
                  border: `1px solid ${AppColors.borderColor}`,
                  borderRadius: 'clamp(8px, 2vw, 12px)',
                  padding: 'clamp(12px, 3vw, 16px)',
                  color: AppColors.textPrimary,
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'clamp(12px, 3vw, 16px)',
                  flexWrap: 'wrap',
                  gap: 'clamp(8px, 2vw, 12px)',
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(11px, 2.2vw, 12px)',
                    color: AppColors.textSecondary,
                  }}
                >
                  {section.template?.updatedBy && (
                    <>Last updated by: {section.template.updatedBy}</>
                  )}
                </span>

                <div style={{ display: 'flex', gap: 'clamp(6px, 1.5vw, 10px)', flexWrap: 'wrap' }}>
                  <button
                    onClick={section.onResetToDefault}
                    title="Restore the original default template (you must save after)"
                    style={{
                      padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)',
                      background: 'transparent',
                      border: `1px solid ${AppColors.borderColor}`,
                      borderRadius: 'clamp(8px, 2vw, 10px)',
                      color: AppColors.textSecondary,
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Reset to Default
                  </button>
                  <button
                    onClick={section.onDiscardChanges}
                    disabled={!section.hasChanges}
                    title="Discard unsaved changes"
                    style={{
                      padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)',
                      background: AppColors.surfaceMedium,
                      border: `1px solid ${AppColors.borderColor}`,
                      borderRadius: 'clamp(8px, 2vw, 10px)',
                      color: AppColors.textSecondary,
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      fontWeight: 500,
                      cursor: !section.hasChanges ? 'not-allowed' : 'pointer',
                      opacity: !section.hasChanges ? 0.5 : 1,
                    }}
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={section.saving || !section.hasChanges}
                    style={{
                      padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                      background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                      border: 'none',
                      borderRadius: 'clamp(8px, 2vw, 10px)',
                      color: AppColors.textDark,
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      fontWeight: 600,
                      cursor: section.saving || !section.hasChanges ? 'not-allowed' : 'pointer',
                      opacity: section.saving || !section.hasChanges ? 0.7 : 1,
                    }}
                  >
                    {section.saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  // Weekly Review
  reviewTemplate,
  editedReviewTemplate,
  onReviewTemplateChange,
  onSaveReview,
  onDiscardReviewChanges,
  onResetReviewToDefault,
  reviewLoading,
  reviewSaving,
  reviewHasChanges,
  // Custom Lesson
  customLessonTemplate,
  editedCustomLessonTemplate,
  onCustomLessonTemplateChange,
  onSaveCustomLesson,
  onDiscardCustomLessonChanges,
  onResetCustomLessonToDefault,
  customLessonLoading,
  customLessonSaving,
  customLessonHasChanges,
  // Pronunciation
  pronunciationTemplate,
  editedPronunciationTemplate,
  onPronunciationTemplateChange,
  onSavePronunciation,
  onDiscardPronunciationChanges,
  onResetPronunciationToDefault,
  pronunciationLoading,
  pronunciationSaving,
  pronunciationHasChanges,
  // Default Intro Lesson
  introLessonTemplate,
  editedIntroLessonTemplate,
  onIntroLessonTemplateChange,
  onSaveIntroLesson,
  onDiscardIntroLessonChanges,
  onResetIntroLessonToDefault,
  introLessonLoading,
  introLessonSaving,
  introLessonHasChanges,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('review');

  const sections: TemplateSection[] = [
    {
      id: 'review',
      title: 'Weekly Review Session Prompt',
      description: 'Direct system prompt for weekly review sessions. Placeholders are replaced automatically.',
      placeholders: [
        { code: '{{studentName}}', description: "Student's display name (replaced at runtime)" },
        { code: '{{level}}', description: "Student's CEFR level (A1-C2)" },
        { code: '{{struggles}}', description: "Formatted list of review items with IDs, audio status, and corrections" },
        { code: '{{itemReference}}', description: "Quick reference table of item IDs for play_student_audio and mark_item_mastered" },
      ],
      template: reviewTemplate,
      editedTemplate: editedReviewTemplate,
      onTemplateChange: onReviewTemplateChange,
      onSave: onSaveReview,
      onDiscardChanges: onDiscardReviewChanges,
      onResetToDefault: onResetReviewToDefault,
      loading: reviewLoading,
      saving: reviewSaving,
      hasChanges: reviewHasChanges,
    },
    {
      id: 'customLesson',
      title: 'Custom Lesson Prompt',
      description: 'Template for student-created personalized practice lessons',
      placeholders: [
        { code: '{{level}}', description: "Student's CEFR level (A1-C2)" },
        { code: '{{practiceDescription}}', description: 'What the student wants to practice' },
        { code: '{{studentName}}', description: "Student's display name" },
      ],
      template: customLessonTemplate,
      editedTemplate: editedCustomLessonTemplate,
      onTemplateChange: onCustomLessonTemplateChange,
      onSave: onSaveCustomLesson,
      onDiscardChanges: onDiscardCustomLessonChanges,
      onResetToDefault: onResetCustomLessonToDefault,
      loading: customLessonLoading,
      saving: customLessonSaving,
      hasChanges: customLessonHasChanges,
    },
    {
      id: 'pronunciation',
      title: 'Pronunciation Coach Prompt',
      description: 'Template for quick 2-minute pronunciation practice sessions',
      placeholders: [
        { code: '{{level}}', description: "Student's CEFR level (A1-C2)" },
        { code: '{{words}}', description: 'Comma-separated words to practice' },
        { code: '{{studentName}}', description: "Student's display name" },
      ],
      template: pronunciationTemplate,
      editedTemplate: editedPronunciationTemplate,
      onTemplateChange: onPronunciationTemplateChange,
      onSave: onSavePronunciation,
      onDiscardChanges: onDiscardPronunciationChanges,
      onResetToDefault: onResetPronunciationToDefault,
      loading: pronunciationLoading,
      saving: pronunciationSaving,
      hasChanges: pronunciationHasChanges,
    },
    {
      id: 'introLesson',
      title: 'Default Intro Lesson',
      description: 'First lesson shown to new students with no assigned lessons (3-min intro conversation)',
      placeholders: [
        { code: '{{level}}', description: "Student's CEFR level (A1-C2)" },
        { code: '{{studentName}}', description: "Student's display name" },
      ],
      template: introLessonTemplate,
      editedTemplate: editedIntroLessonTemplate,
      onTemplateChange: onIntroLessonTemplateChange,
      onSave: onSaveIntroLesson,
      onDiscardChanges: onDiscardIntroLessonChanges,
      onResetToDefault: onResetIntroLessonToDefault,
      loading: introLessonLoading,
      saving: introLessonSaving,
      hasChanges: introLessonHasChanges,
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(prev => (prev === sectionId ? null : sectionId));
  };

  return (
    <div>
      <h2
        style={{
          fontSize: 'clamp(16px, 3.5vw, 18px)',
          fontWeight: 600,
          marginBottom: 'clamp(12px, 3vw, 16px)',
        }}
      >
        System Templates
      </h2>

      <p
        style={{
          fontSize: 'clamp(12px, 2.5vw, 13px)',
          color: AppColors.textSecondary,
          marginBottom: 'clamp(16px, 4vw, 20px)',
        }}
      >
        Configure the AI prompts used for different lesson types. Click a section to expand and edit.
      </p>

      {sections.map((section) => (
        <CollapsibleSection
          key={section.id}
          section={section}
          isExpanded={expandedSection === section.id}
          onToggle={() => toggleSection(section.id)}
        />
      ))}
    </div>
  );
};
