import React from 'react';
import { AppColors } from '../../theme/colors';
import { PlusIcon } from '../../theme/icons';

interface CreateOwnCardProps {
  onClick: () => void;
}

/**
 * Create Own Card - Premium glass-morphic action card
 * Matches Progress page design language
 */
export const CreateOwnCard: React.FC<CreateOwnCardProps> = ({ onClick }) => {
  return (
    <button
      className="create-own-card"
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: '160px',
        padding: '24px 20px',
        borderRadius: '24px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .create-own-card {
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .create-own-card:hover {
          transform: translateY(-4px);
          background-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 16px 40px rgba(251, 191, 36, 0.15), 0 0 0 1px rgba(251, 191, 36, 0.2);
        }
        .create-own-card:hover .icon-container {
          transform: scale(1.1) rotate(90deg);
          box-shadow: 0 8px 24px rgba(251, 191, 36, 0.35);
        }
        .create-own-card:active {
          transform: translateY(-2px);
        }
        @keyframes float-icon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>

      {/* Subtle gradient accent at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.4) 50%, transparent 100%)`,
        }}
      />

      {/* Decorative gradient orb */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-20%',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Icon container */}
      <div
        className="icon-container"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fbbf24',
          transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <PlusIcon size={26} />
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span
          style={{
            fontSize: '15px',
            fontWeight: '700',
            color: AppColors.textPrimary,
            letterSpacing: '-0.3px',
            display: 'block',
          }}
        >
          Create My Own
        </span>
        <span
          style={{
            fontSize: '12px',
            color: AppColors.textMuted,
            marginTop: '4px',
            display: 'block',
            fontWeight: '500',
          }}
        >
          Custom practice
        </span>
      </div>
    </button>
  );
};
