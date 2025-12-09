import React from 'react';
import { AppColors } from '../../theme/colors';

interface CreateOwnCardProps {
  onClick: () => void;
}

export const CreateOwnCard: React.FC<CreateOwnCardProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: '140px',
        padding: 'clamp(16px, 4vw, 24px)',
        borderRadius: '20px',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(8px, 2vw, 12px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 'clamp(24px, 6vw, 32px)' }}>
        ✨
      </span>

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontSize: 'clamp(14px, 3.5vw, 18px)',
          fontWeight: 700,
          color: AppColors.textPrimary,
        }}
      >
        Create My Own
      </h3>

      {/* Subtitle */}
      <p
        style={{
          margin: 0,
          fontSize: 'clamp(11px, 2.5vw, 13px)',
          color: AppColors.textSecondary,
          lineHeight: 1.4,
        }}
      >
        Practice any scenario you can imagine
      </p>

      {/* Button */}
      <button
        style={{
          marginTop: 'auto',
          padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
          borderRadius: '12px',
          border: 'none',
          background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, #a855f7 100%)`,
          color: AppColors.textDark,
          fontSize: 'clamp(12px, 2.8vw, 14px)',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        Create
      </button>
    </div>
  );
};
