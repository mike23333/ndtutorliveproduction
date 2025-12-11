import React from 'react';
import { AppColors } from '../../theme/colors';
import { MicIcon } from '../../theme/icons';

interface PronunciationCardProps {
  onClick: () => void;
}

/**
 * Pronunciation Card - Clean, minimal tool card
 */
export const PronunciationCard: React.FC<PronunciationCardProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        flex: 1,
        minWidth: '140px',
        padding: '20px',
        borderRadius: '16px',
        backgroundColor: AppColors.bgTertiary,
        border: `1px solid ${AppColors.borderColor}`,
        cursor: 'pointer',
        transition: 'all 150ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          backgroundColor: AppColors.surfaceMedium,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: AppColors.accentBlue,
        }}
      >
        <MicIcon size={20} />
      </div>

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontSize: '15px',
          fontWeight: '600',
          color: AppColors.textPrimary,
        }}
      >
        Pronunciation
      </h3>

      {/* Subtitle */}
      <p
        style={{
          margin: 0,
          fontSize: '13px',
          color: AppColors.textSecondary,
          lineHeight: 1.4,
        }}
      >
        Perfect your accent
      </p>

      {/* Action hint */}
      <span
        style={{
          marginTop: 'auto',
          fontSize: '13px',
          fontWeight: '500',
          color: AppColors.accentBlue,
        }}
      >
        Practice →
      </span>
    </div>
  );
};
