import React, { useEffect, useState } from 'react';
import { AppColors } from '../../theme/colors';
import { XIcon, ImageIcon, LoaderIcon } from '../../theme/icons';
import { useCollectionForm, CollectionFormData } from '../../hooks/useCollectionForm';
import { CATEGORY_PRESETS, CollectionDocument } from '../../types/firestore';
import { uploadCollectionImage } from '../../services/firebase/storage';
import { useAuth } from '../../hooks/useAuth';

interface CollectionFormModalProps {
  collection: CollectionDocument | null;
  onSave: (formData: CollectionFormData) => Promise<void>;
  onClose: () => void;
}

const COLOR_PRESETS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#F97316', // Orange
  '#EF4444', // Red
  '#6366F1', // Indigo
];

export const CollectionFormModal: React.FC<CollectionFormModalProps> = ({
  collection,
  onSave,
  onClose,
}) => {
  const { user } = useAuth();
  const {
    formData,
    setTitle,
    setDescription,
    setCategory,
    setImage,
    clearImage,
    setColor,
    isValid,
    saving,
    setSaving,
    isUploading,
    setIsUploading,
    reset,
    loadFromCollection,
  } = useCollectionForm();

  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  useEffect(() => {
    if (collection) {
      loadFromCollection(collection);
      // Check if category is a preset
      const isPreset = CATEGORY_PRESETS.includes(collection.category as typeof CATEGORY_PRESETS[number]);
      if (!isPreset) {
        setShowCustomCategory(true);
        setCustomCategory(collection.category);
      }
    } else {
      reset();
    }
  }, [collection, loadFromCollection, reset]);

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomCategory(true);
      setCategory(customCategory);
    } else {
      setShowCustomCategory(false);
      setCategory(value);
    }
  };

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value);
    setCategory(value);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsUploading(true);
    try {
      const { url, path } = await uploadCollectionImage(file, user.uid);
      setImage(url, path);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Failed to save collection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 'clamp(10px, 2.5vw, 12px)',
    fontSize: 'clamp(13px, 2.8vw, 14px)',
    background: AppColors.surfaceMedium,
    border: `1px solid ${AppColors.borderColor}`,
    borderRadius: 'clamp(8px, 2vw, 10px)',
    color: AppColors.textPrimary,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    fontWeight: 500,
    color: AppColors.textSecondary,
    marginBottom: 'clamp(4px, 1vw, 6px)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 24px)',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: AppColors.bgSecondary,
          borderRadius: 'clamp(16px, 4vw, 20px)',
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'clamp(16px, 4vw, 20px)',
            borderBottom: `1px solid ${AppColors.borderColor}`,
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(16px, 3.5vw, 18px)',
              fontWeight: 600,
              margin: 0,
              color: AppColors.textPrimary,
            }}
          >
            {collection ? 'Edit Collection' : 'New Collection'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: AppColors.textSecondary,
              padding: 4,
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 'clamp(16px, 4vw, 20px)' }}>
            {/* Title */}
            <div style={{ marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
              <label style={labelStyle}>
                Title <span style={{ color: AppColors.errorRose }}>*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Restaurant Conversations"
                style={inputStyle}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what students will practice"
                rows={2}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: 60,
                }}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
              <label style={labelStyle}>
                Category <span style={{ color: AppColors.errorRose }}>*</span>
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {CATEGORY_PRESETS.map((cat) => {
                  const isSelected = !showCustomCategory && formData.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      style={{
                        padding: '8px 14px',
                        fontSize: 'clamp(12px, 2.5vw, 13px)',
                        background: isSelected ? AppColors.accentPurple : AppColors.surfaceMedium,
                        color: isSelected ? '#1e1b4b' : AppColors.textPrimary,
                        border: `1px solid ${isSelected ? AppColors.accentPurple : AppColors.borderColor}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => handleCategoryChange('custom')}
                  style={{
                    padding: '8px 14px',
                    fontSize: 'clamp(12px, 2.5vw, 13px)',
                    background: showCustomCategory ? AppColors.accentPurple : AppColors.surfaceMedium,
                    color: showCustomCategory ? '#1e1b4b' : AppColors.textPrimary,
                    border: `1px solid ${showCustomCategory ? AppColors.accentPurple : AppColors.borderColor}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: showCustomCategory ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}
                >
                  + Custom
                </button>
              </div>
              {showCustomCategory && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => handleCustomCategoryChange(e.target.value)}
                  placeholder="Enter custom category"
                  style={{
                    ...inputStyle,
                    marginTop: 8,
                  }}
                />
              )}
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
              <label style={labelStyle}>
                Cover Image <span style={{ color: AppColors.errorRose }}>*</span>
              </label>
              {formData.imageUrl ? (
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 'clamp(8px, 2vw, 10px)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={formData.imageUrl}
                    alt="Collection cover"
                    style={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                    }}
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(0,0,0,0.5)',
                      border: 'none',
                      borderRadius: 6,
                      padding: 6,
                      cursor: 'pointer',
                      color: 'white',
                    }}
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 100,
                    background: AppColors.surfaceMedium,
                    border: `2px dashed ${AppColors.borderColor}`,
                    borderRadius: 'clamp(8px, 2vw, 10px)',
                    cursor: isUploading ? 'wait' : 'pointer',
                    transition: 'border-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = AppColors.accentPurple;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = AppColors.borderColor;
                  }}
                >
                  {isUploading ? (
                    <>
                      <LoaderIcon size={24} />
                      <span
                        style={{
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          marginTop: 8,
                        }}
                      >
                        Uploading...
                      </span>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={24} />
                      <span
                        style={{
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          marginTop: 8,
                        }}
                      >
                        Click to upload image
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            {/* Color picker */}
            <div style={{ marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
              <label style={labelStyle}>Accent Color</label>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColor(color)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: color,
                      border:
                        formData.color === color
                          ? '3px solid white'
                          : '3px solid transparent',
                      boxShadow:
                        formData.color === color
                          ? `0 0 0 2px ${color}`
                          : 'none',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              padding: 'clamp(16px, 4vw, 20px)',
              borderTop: `1px solid ${AppColors.borderColor}`,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 24px)',
                background: AppColors.surfaceMedium,
                color: AppColors.textPrimary,
                border: 'none',
                borderRadius: 'clamp(8px, 2vw, 10px)',
                fontSize: 'clamp(13px, 2.8vw, 14px)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || saving || isUploading}
              style={{
                padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 24px)',
                background:
                  !isValid || saving || isUploading
                    ? AppColors.surfaceMedium
                    : `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                color: !isValid || saving || isUploading ? AppColors.textSecondary : 'white',
                border: 'none',
                borderRadius: 'clamp(8px, 2vw, 10px)',
                fontSize: 'clamp(13px, 2.8vw, 14px)',
                fontWeight: 600,
                cursor: !isValid || saving || isUploading ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : collection ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
