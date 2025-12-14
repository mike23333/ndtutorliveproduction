import React, { useState, useEffect } from 'react';
import { AppColors } from '../../theme/colors';
import { XIcon, ClockIcon } from '../../theme/icons';
import { ImageUpload } from '../forms/ImageUpload';
import type { CustomLessonDocument } from '../../types/firestore';

interface CreateOwnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    imageUrl?: string;
    imageStoragePath?: string;
  }) => Promise<void>;
  userId: string;
  editingLesson?: CustomLessonDocument | null;
}

export const CreateOwnModal: React.FC<CreateOwnModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userId,
  editingLesson,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStoragePath, setImageStoragePath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editingLesson;

  // Populate form when editing
  useEffect(() => {
    if (editingLesson) {
      setTitle(editingLesson.title);
      setDescription(editingLesson.description);
      setImageUrl(editingLesson.imageUrl || null);
      setImageStoragePath(editingLesson.imageStoragePath || null);
    } else {
      setTitle('');
      setDescription('');
      setImageUrl(null);
      setImageStoragePath(null);
    }
  }, [editingLesson, isOpen]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl || undefined,
        imageStoragePath: imageStoragePath || undefined,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setImageUrl(null);
      setImageStoragePath(null);
      onClose();
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Failed to save lesson. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (url: string, path: string) => {
    setImageUrl(url);
    setImageStoragePath(path);
  };

  const handleImageRemove = () => {
    setImageUrl(null);
    setImageStoragePath(null);
  };

  const isValid = title.trim().length > 0 && description.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 'clamp(16px, 4vw, 24px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: AppColors.surfaceDark,
          borderRadius: '20px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 'clamp(20px, 5vw, 28px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'clamp(16px, 4vw, 24px)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(18px, 4.5vw, 22px)',
              fontWeight: 700,
              color: AppColors.textPrimary,
            }}
          >
            {isEditing ? 'Edit Lesson' : 'Create My Own'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: AppColors.textSecondary,
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 3.5vw, 18px)' }}>
          {/* Title */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontWeight: 500,
                color: AppColors.textSecondary,
                marginBottom: 'clamp(4px, 1vw, 6px)',
              }}
            >
              Lesson Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., At the Doctor's Office"
              style={{
                width: '100%',
                padding: 'clamp(10px, 2.5vw, 14px)',
                borderRadius: '12px',
                border: `1px solid ${AppColors.borderColor}`,
                backgroundColor: AppColors.surfaceMedium,
                color: AppColors.textPrimary,
                fontSize: 'clamp(14px, 3vw, 16px)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontWeight: 500,
                color: AppColors.textSecondary,
                marginBottom: 'clamp(4px, 1vw, 6px)',
              }}
            >
              What do you want to practice? *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scenario or situation you want to practice..."
              rows={4}
              style={{
                width: '100%',
                padding: 'clamp(10px, 2.5vw, 14px)',
                borderRadius: '12px',
                border: `1px solid ${AppColors.borderColor}`,
                backgroundColor: AppColors.surfaceMedium,
                color: AppColors.textPrimary,
                fontSize: 'clamp(14px, 3vw, 16px)',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Image Upload */}
          <ImageUpload
            imageUrl={imageUrl}
            storagePath={imageStoragePath}
            onUpload={handleImageUpload}
            onRemove={handleImageRemove}
            teacherId={userId}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
          />

          {/* Duration Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: 'clamp(10px, 2.5vw, 14px)',
              borderRadius: '12px',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
            }}
          >
            <ClockIcon size={18} />
            <span
              style={{
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                color: AppColors.textSecondary,
              }}
            >
              All custom lessons are <strong style={{ color: AppColors.textPrimary }}>5 minutes</strong>
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(10px, 2.5vw, 14px)',
            marginTop: 'clamp(20px, 5vw, 28px)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 'clamp(12px, 3vw, 16px)',
              borderRadius: '12px',
              border: `1px solid ${AppColors.borderColor}`,
              backgroundColor: 'transparent',
              color: AppColors.textSecondary,
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting || isUploading}
            style={{
              flex: 1,
              padding: 'clamp(12px, 3vw, 16px)',
              borderRadius: '12px',
              border: 'none',
              background: isValid && !isSubmitting && !isUploading
                ? `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`
                : AppColors.surfaceMedium,
              color: isValid && !isSubmitting && !isUploading
                ? AppColors.textDark
                : AppColors.textSecondary,
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              cursor: isValid && !isSubmitting && !isUploading ? 'pointer' : 'not-allowed',
              opacity: isValid && !isSubmitting && !isUploading ? 1 : 0.6,
            }}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
};
