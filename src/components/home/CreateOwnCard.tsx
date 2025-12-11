import React from 'react';
import { AppColors } from '../../theme/colors';
import { PlusIcon } from '../../theme/icons';

interface CreateOwnCardProps {
  onClick: () => void;
}

/**
 * Create Own Card - Clean, minimal tool card
 */
export const CreateOwnCard: React.FC<CreateOwnCardProps> = ({ onClick }) => {
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
          color: AppColors.accentPurple,
        }}
      >
        <PlusIcon size={20} />
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
        Create Your Own
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
        Practice any scenario
      </p>

      {/* Action hint */}
      <span
        style={{
          marginTop: 'auto',
          fontSize: '13px',
          fontWeight: '500',
          color: AppColors.accentPurple,
        }}
      >
        Create →
      </span>
    </div>
  );
};
