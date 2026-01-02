import React from 'react';
import { AppColors } from '../../../../theme/colors';
import { InputField, ImageUpload } from '../../../forms';
import type { LessonFormData } from '../../../../types/dashboard';

interface StepEssenceProps {
  formData: LessonFormData;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onImageUpload: (url: string, path: string) => void;
  onImageRemove: () => void;
  onImageCropPositionChange: (position: number) => void;
  teacherId: string;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

export const StepEssence: React.FC<StepEssenceProps> = ({
  formData,
  onTitleChange,
  onDescriptionChange,
  onImageUpload,
  onImageRemove,
  onImageCropPositionChange,
  teacherId,
  isUploading,
  setIsUploading,
}) => {
  return (
    <div>
      {/* Title */}
      <InputField
        label="Lesson Title"
        placeholder="e.g., Ordering at a Restaurant"
        value={formData.title}
        onChange={onTitleChange}
      />

      {/* Description */}
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
          Description <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <textarea
          placeholder="Describe what students will practice in this lesson..."
          value={formData.description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: '100px',
            background: AppColors.surfaceLight,
            border: `1px solid ${AppColors.borderColor}`,
            borderRadius: 'clamp(8px, 2vw, 12px)',
            padding: 'clamp(10px, 2.5vw, 14px)',
            color: AppColors.textPrimary,
            fontSize: 'clamp(14px, 3vw, 16px)',
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Cover Image */}
      <ImageUpload
        imageUrl={formData.imageUrl}
        storagePath={formData.imageStoragePath}
        onUpload={onImageUpload}
        onRemove={onImageRemove}
        teacherId={teacherId}
        isUploading={isUploading}
        setIsUploading={setIsUploading}
        cropPosition={formData.imageCropPosition}
        onCropPositionChange={onImageCropPositionChange}
      />
    </div>
  );
};

/**
 * Generate summary for collapsed edit mode
 */
export function getEssenceSummary(formData: LessonFormData): string {
  const parts: string[] = [];

  if (formData.title) {
    parts.push(`"${formData.title}"`);
  }

  const indicators: string[] = [];
  if (formData.description) indicators.push('Description');
  if (formData.imageUrl) indicators.push('Image uploaded');

  if (indicators.length > 0) {
    parts.push(indicators.join(', '));
  }

  return parts.join(' · ') || 'Not started';
}
