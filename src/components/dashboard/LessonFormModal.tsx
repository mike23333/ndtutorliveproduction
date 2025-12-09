import React from 'react';
import { AppColors } from '../../theme/colors';
import { XIcon } from '../../theme/icons';
import { InputField, SelectField, ImageUpload } from '../forms';
import type { LessonFormData } from '../../types/dashboard';
import type { PromptTemplateDocument } from '../../types/firestore';

interface LessonFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: LessonFormData;
  onClose: () => void;
  onSave: () => Promise<void>;
  onTitleChange: (title: string) => void;
  onSystemPromptChange: (prompt: string) => void;
  onDurationChange: (duration: number) => void;
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
}

export const LessonFormModal: React.FC<LessonFormModalProps> = ({
  isOpen,
  isEditing,
  formData,
  onClose,
  onSave,
  onTitleChange,
  onSystemPromptChange,
  onDurationChange,
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
}) => {
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
