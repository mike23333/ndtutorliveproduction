import React from 'react';
import { AppColors } from '../../../theme/colors';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  mode: 'create' | 'edit';
}

const STEP_TITLES = {
  1: 'The Essence',
  2: 'The Intelligence',
  3: 'The Audience',
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, mode }) => {
  if (mode === 'edit') return null;

  return (
    <div
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'clamp(16px, 4vw, 20px)',
      }}
    >
      <span
        style={{
          fontSize: 'clamp(12px, 2.5vw, 13px)',
          color: AppColors.textSecondary,
          fontWeight: 500,
        }}
      >
        Step {currentStep} of 3
      </span>
      <span
        style={{
          fontSize: 'clamp(12px, 2.5vw, 13px)',
          color: AppColors.textMuted,
        }}
      >
        {STEP_TITLES[currentStep]}
      </span>
    </div>
  );
};
