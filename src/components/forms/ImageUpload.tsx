import React from 'react';
import { AppColors } from '../../theme/colors';
import { ImageIcon, XIcon } from '../../theme/icons';
import { uploadLessonImage, validateImageFile, deleteLessonImage } from '../../services/firebase/storage';

interface ImageUploadProps {
  imageUrl: string | null;
  storagePath: string | null;
  onUpload: (url: string, storagePath: string) => void;
  onRemove: () => void;
  teacherId: string;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  imageUrl,
  storagePath,
  onUpload,
  onRemove,
  teacherId,
  isUploading,
  setIsUploading,
}) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      alert('Please select a valid image file (max 5MB, jpg/png/gif/webp)');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadLessonImage(file, teacherId);
      onUpload(result.downloadUrl, result.storagePath);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (storagePath) {
      try {
        await deleteLessonImage(storagePath);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
    onRemove();
  };

  return (
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
        Lesson Image
      </label>
      {imageUrl ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(120px, 25vw, 160px)',
            borderRadius: 'clamp(8px, 2vw, 12px)',
            overflow: 'hidden',
          }}
        >
          <img
            src={imageUrl}
            alt="Lesson"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button
            onClick={handleRemove}
            style={{
              position: 'absolute',
              top: 'clamp(6px, 1.5vw, 8px)',
              right: 'clamp(6px, 1.5vw, 8px)',
              width: 'clamp(28px, 6vw, 32px)',
              height: 'clamp(28px, 6vw, 32px)',
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              borderRadius: '50%',
              color: AppColors.textPrimary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XIcon size={16} />
          </button>
        </div>
      ) : (
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: 'clamp(120px, 25vw, 160px)',
            background: AppColors.surfaceLight,
            border: `2px dashed ${AppColors.borderColor}`,
            borderRadius: 'clamp(8px, 2vw, 12px)',
            cursor: isUploading ? 'wait' : 'pointer',
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          <div style={{ color: AppColors.textSecondary, marginBottom: 'clamp(6px, 1.5vw, 8px)' }}>
            <ImageIcon size={32} />
          </div>
          <span style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: AppColors.textSecondary }}>
            {isUploading ? 'Uploading...' : 'Click to upload image'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
};
