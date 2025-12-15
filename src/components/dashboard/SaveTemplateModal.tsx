import React from 'react';
import { AppColors } from '../../theme/colors';
import { InputField } from '../forms';

interface SaveTemplateModalProps {
  isOpen: boolean;
  templateName: string;
  onClose: () => void;
  onSave: () => void;
  onNameChange: (name: string) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  templateName,
  onClose,
  onSave,
  onNameChange,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom))',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '400px',
          background: AppColors.surfaceDark,
          borderRadius: 'clamp(12px, 3vw, 16px)',
          padding: 'clamp(20px, 5vw, 28px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: 'clamp(16px, 3.5vw, 18px)',
            fontWeight: 600,
            marginBottom: 'clamp(16px, 4vw, 20px)',
            margin: '0 0 clamp(16px, 4vw, 20px) 0',
          }}
        >
          Save as Template
        </h3>
        <InputField
          label="Template Name"
          placeholder="e.g., Coffee Shop Roleplay"
          value={templateName}
          onChange={onNameChange}
        />
        <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 10px)', marginTop: 'clamp(16px, 4vw, 20px)' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 'clamp(10px, 2.5vw, 12px)',
              background: AppColors.surfaceLight,
              border: `1px solid ${AppColors.borderColor}`,
              borderRadius: 'clamp(8px, 2vw, 10px)',
              color: AppColors.textPrimary,
              fontSize: 'clamp(14px, 3vw, 15px)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            style={{
              flex: 1,
              padding: 'clamp(10px, 2.5vw, 12px)',
              background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
              border: 'none',
              borderRadius: 'clamp(8px, 2vw, 10px)',
              color: AppColors.textDark,
              fontSize: 'clamp(14px, 3vw, 15px)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
