import React from 'react';
import { AppColors } from '../../../theme/colors';

interface StepNavigationProps {
  currentStep: 1 | 2 | 3;
  mode: 'create' | 'edit';
  canProceed: boolean;
  saving: boolean;
  isUploading: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  mode,
  canProceed,
  saving,
  isUploading,
  onBack,
  onContinue,
  onSave,
  onCancel,
}) => {
  const isDisabled = saving || isUploading;
  const showBackButton = currentStep > 1 && mode === 'create';
  const isLastStep = currentStep === 3 || mode === 'edit';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(10px, 2.5vw, 12px)',
        marginTop: 'clamp(20px, 5vw, 28px)',
      }}
    >
      {/* Back button (text link style) */}
      {showBackButton && (
        <button
          type="button"
          onClick={onBack}
          disabled={isDisabled}
          style={{
            background: 'transparent',
            border: 'none',
            color: AppColors.textSecondary,
            fontSize: 'clamp(14px, 3vw, 15px)',
            fontWeight: 500,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            padding: 'clamp(10px, 2.5vw, 12px) clamp(14px, 3vw, 16px)',
            opacity: isDisabled ? 0.5 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          Back
        </button>
      )}

      {/* Cancel button (only on step 1 in create mode) */}
      {currentStep === 1 && mode === 'create' && (
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: showBackButton ? undefined : 1,
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
      )}

      {/* Main action button */}
      <button
        type="button"
        onClick={isLastStep ? onSave : onContinue}
        disabled={isDisabled || (!canProceed && !isLastStep)}
        style={{
          flex: 1,
          padding: 'clamp(12px, 3vw, 16px)',
          background:
            isDisabled || (!canProceed && !isLastStep)
              ? AppColors.surfaceMedium
              : `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
          border: 'none',
          borderRadius: 'clamp(10px, 2.5vw, 14px)',
          color: isDisabled || (!canProceed && !isLastStep) ? AppColors.textMuted : AppColors.textDark,
          fontSize: 'clamp(14px, 3vw, 16px)',
          fontWeight: 600,
          cursor: isDisabled || (!canProceed && !isLastStep) ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.7 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        {saving
          ? 'Saving...'
          : isLastStep
          ? mode === 'edit'
            ? 'Update Lesson'
            : 'Create Lesson'
          : 'Continue'}
      </button>
    </div>
  );
};
