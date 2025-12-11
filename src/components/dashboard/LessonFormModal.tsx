import React from 'react';
import { AppColors } from '../../theme/colors';
import { XIcon } from '../../theme/icons';
import { InputField, SelectField, ImageUpload } from '../forms';
import type { LessonFormData } from '../../types/dashboard';
import type { PromptTemplateDocument, ProficiencyLevel, UserDocument } from '../../types/firestore';

interface LessonFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: LessonFormData;
  onClose: () => void;
  onSave: () => Promise<void>;
  onTitleChange: (title: string) => void;
  onSystemPromptChange: (prompt: string) => void;
  onDurationChange: (duration: number) => void;
  onTargetLevelChange: (level: ProficiencyLevel | null) => void;
  onFirstLessonChange: (isFirst: boolean) => void;
  onImageUpload: (url: string, path: string) => void;
  onImageRemove: () => void;
  teacherId: string;
  saving: boolean;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  promptTemplates: PromptTemplateDocument[];
  selectedTemplateId: string;
  onTemplateSelect: (id: string) => void;
  onSaveAsTemplate: () => void;
  // Private student assignment
  privateStudents?: UserDocument[];
  onAssignedStudentsChange?: (studentIds: string[]) => void;
}

const LEVEL_OPTIONS = [
  { value: '', label: 'All Levels (no filter)' },
  { value: 'A1', label: 'A1 - Beginner' },
  { value: 'A2', label: 'A2 - Elementary' },
  { value: 'B1', label: 'B1 - Intermediate' },
  { value: 'B2', label: 'B2 - Upper Intermediate' },
  { value: 'C1', label: 'C1 - Advanced' },
  { value: 'C2', label: 'C2 - Proficient' },
];

export const LessonFormModal: React.FC<LessonFormModalProps> = ({
  isOpen,
  isEditing,
  formData,
  onClose,
  onSave,
  onTitleChange,
  onSystemPromptChange,
  onDurationChange,
  onTargetLevelChange,
  onFirstLessonChange,
  onImageUpload,
  onImageRemove,
  teacherId,
  saving,
  isUploading,
  setIsUploading,
  promptTemplates,
  selectedTemplateId,
  onTemplateSelect,
  onSaveAsTemplate,
  privateStudents = [],
  onAssignedStudentsChange,
}) => {
  const hasAssignedStudents = (formData.assignedStudentIds?.length || 0) > 0;

  const handleStudentToggle = (studentId: string) => {
    if (!onAssignedStudentsChange) return;
    const current = formData.assignedStudentIds || [];
    const updated = current.includes(studentId)
      ? current.filter(id => id !== studentId)
      : [...current, studentId];
    onAssignedStudentsChange(updated);
  };

  const handleClearAssignments = () => {
    if (onAssignedStudentsChange) {
      onAssignedStudentsChange([]);
    }
  };
  if (!isOpen) return null;

  const handleDurationChange = (value: string) => {
    const num = parseInt(value) || 15;
    onDurationChange(Math.min(60, Math.max(1, num)));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          background: AppColors.surfaceDark,
          borderRadius: 'clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px) 0 0',
          padding: 'clamp(20px, 5vw, 28px)',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(20px, 5vw, 28px)',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(18px, 4vw, 22px)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            {isEditing ? 'Edit Lesson' : 'Create New Lesson'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: AppColors.surfaceLight,
              border: 'none',
              borderRadius: '50%',
              width: 'clamp(32px, 7vw, 38px)',
              height: 'clamp(32px, 7vw, 38px)',
              color: AppColors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Form */}
        <InputField
          label="Lesson Title"
          placeholder="e.g., Ordering at a Restaurant"
          value={formData.title}
          onChange={onTitleChange}
        />

        {/* Target Level Selector */}
        <SelectField
          label="Target Student Level"
          options={LEVEL_OPTIONS}
          value={formData.targetLevel || ''}
          onChange={(value) => onTargetLevelChange(value ? value as ProficiencyLevel : null)}
        />

        {/* Prompt Template Selector */}
        {promptTemplates.length > 0 && (
          <SelectField
            label="Load from Template"
            options={[
              { value: '', label: 'Start from scratch' },
              ...promptTemplates.map(t => ({ value: t.id, label: t.name })),
            ]}
            value={selectedTemplateId}
            onChange={onTemplateSelect}
          />
        )}

        {/* System Prompt */}
        <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(4px, 1vw, 6px)' }}>
            <label
              style={{
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontWeight: 500,
                color: AppColors.textSecondary,
              }}
            >
              System Prompt
            </label>
            <button
              onClick={onSaveAsTemplate}
              style={{
                background: 'transparent',
                border: 'none',
                color: AppColors.accentPurple,
                fontSize: 'clamp(11px, 2.2vw, 12px)',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Save as Template
            </button>
          </div>
          <textarea
            placeholder="Enter the complete system prompt for Gemini. This defines how the AI will behave during the lesson..."
            value={formData.systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            style={{
              width: '100%',
              minHeight: 'clamp(150px, 30vw, 200px)',
              background: AppColors.surfaceLight,
              border: `1px solid ${AppColors.borderColor}`,
              borderRadius: 'clamp(8px, 2vw, 12px)',
              padding: 'clamp(10px, 2.5vw, 14px)',
              color: AppColors.textPrimary,
              fontSize: 'clamp(14px, 3vw, 16px)',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'monospace',
            }}
          />
          <p style={{
            fontSize: 'clamp(11px, 2.2vw, 12px)',
            color: AppColors.textSecondary,
            margin: 'clamp(4px, 1vw, 6px) 0 0 0',
          }}>
            This is the full instruction set for the AI tutor. Include personality, scenario, and teaching style.
          </p>
        </div>

        {/* Duration */}
        <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
          <label
            style={{
              display: 'block',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontWeight: 500,
              color: AppColors.textSecondary,
              marginBottom: 'clamp(4px, 1vw, 6px)',
            }}
          >
            Session Duration (minutes)
          </label>
          <input
            type="number"
            min={1}
            max={60}
            value={formData.durationMinutes}
            onChange={(e) => handleDurationChange(e.target.value)}
            style={{
              width: '120px',
              height: 'clamp(40px, 8vw, 48px)',
              background: AppColors.surfaceLight,
              border: `1px solid ${AppColors.borderColor}`,
              borderRadius: 'clamp(8px, 2vw, 12px)',
              padding: '0 clamp(10px, 2.5vw, 14px)',
              color: AppColors.textPrimary,
              fontSize: 'clamp(14px, 3vw, 16px)',
              textAlign: 'center',
            }}
          />
        </div>

        {/* First Lesson Toggle */}
        <div
          style={{
            marginBottom: 'clamp(12px, 3vw, 16px)',
            padding: 'clamp(12px, 3vw, 16px)',
            background: formData.isFirstLesson ? 'rgba(139, 92, 246, 0.1)' : AppColors.surfaceLight,
            border: `1px solid ${formData.isFirstLesson ? AppColors.accentPurple : AppColors.borderColor}`,
            borderRadius: 'clamp(8px, 2vw, 12px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'clamp(13px, 2.8vw, 15px)',
                  fontWeight: 600,
                  color: AppColors.textPrimary,
                  marginBottom: '4px',
                }}
              >
                ⭐ First Lesson for New Students
              </label>
              <p
                style={{
                  margin: 0,
                  fontSize: 'clamp(11px, 2.2vw, 12px)',
                  color: AppColors.textSecondary,
                }}
              >
                This lesson will be shown first to students who haven&apos;t practiced yet
              </p>
            </div>
            <button
              type="button"
              onClick={() => onFirstLessonChange(!formData.isFirstLesson)}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                background: formData.isFirstLesson
                  ? `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`
                  : AppColors.surfaceMedium,
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: formData.isFirstLesson ? '27px' : '3px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        </div>

        {/* Private Student Assignment - Refined Design */}
        {privateStudents.length > 0 && onAssignedStudentsChange && (
          <div
            style={{
              marginBottom: 'clamp(16px, 4vw, 20px)',
              padding: '20px',
              background: hasAssignedStudents
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)'
                : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${hasAssignedStudents ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '16px',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px' }}>👤</span>
                <label
                  style={{
                    fontSize: 'clamp(14px, 3vw, 15px)',
                    fontWeight: 600,
                    color: AppColors.textPrimary,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Assign to Students
                </label>
                {hasAssignedStudents && (
                  <span style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '10px',
                  }}>
                    {formData.assignedStudentIds?.length}
                  </span>
                )}
              </div>
              <p style={{
                margin: 0,
                fontSize: 'clamp(12px, 2.5vw, 13px)',
                color: AppColors.textSecondary,
                lineHeight: 1.4,
              }}>
                Select students for personalized access
              </p>
            </div>

            {/* Student Chips */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
            }}>
              {privateStudents.map(student => {
                const isSelected = formData.assignedStudentIds?.includes(student.uid) || false;
                return (
                  <button
                    key={student.uid}
                    type="button"
                    onClick={() => handleStudentToggle(student.uid)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.15)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: isSelected
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isSelected ? 'white' : AppColors.textPrimary,
                        flexShrink: 0,
                      }}
                    >
                      {isSelected ? '✓' : student.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span style={{
                      color: isSelected ? 'white' : AppColors.textPrimary,
                      fontSize: 'clamp(13px, 2.8vw, 14px)',
                      fontWeight: 500,
                    }}>
                      {student.displayName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Clear All - subtle link */}
            {hasAssignedStudents && (
              <div style={{
                marginTop: '14px',
                paddingTop: '14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: 'clamp(12px, 2.5vw, 13px)',
                  color: AppColors.textSecondary,
                }}>
                  Only these students will see this lesson
                </span>
                <button
                  type="button"
                  onClick={handleClearAssignments}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 8px',
                    color: AppColors.textSecondary,
                    fontSize: 'clamp(12px, 2.5vw, 13px)',
                    cursor: 'pointer',
                    opacity: 0.7,
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {/* Image Upload */}
        <ImageUpload
          imageUrl={formData.imageUrl}
          storagePath={formData.imageStoragePath}
          onUpload={onImageUpload}
          onRemove={onImageRemove}
          teacherId={teacherId}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'clamp(10px, 2.5vw, 12px)', marginTop: 'clamp(20px, 5vw, 28px)' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 'clamp(12px, 3vw, 16px)',
              background: AppColors.surfaceLight,
              border: `1px solid ${AppColors.borderColor}`,
              borderRadius: 'clamp(10px, 2.5vw, 14px)',
              color: AppColors.textPrimary,
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || isUploading}
            style={{
              flex: 1,
              padding: 'clamp(12px, 3vw, 16px)',
              background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
              border: 'none',
              borderRadius: 'clamp(10px, 2.5vw, 14px)',
              color: AppColors.textDark,
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              cursor: saving || isUploading ? 'not-allowed' : 'pointer',
              opacity: saving || isUploading ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : isEditing ? 'Update Lesson' : 'Create Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
};
