import React from 'react';
import { AppColors } from '../../theme/colors';
import { MicIcon } from '../../theme/icons';

interface PronunciationCardProps {
  onClick: () => void;
}

/**
 * Pronunciation Card - Premium glass-morphic action card
 * Matches Progress page design language
 */
export const PronunciationCard: React.FC<PronunciationCardProps> = ({ onClick }) => {
  return (
    <button
      className="pronunciation-card"
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
        .pronunciation-card {
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pronunciation-card:hover {
          transform: translateY(-4px);
          background-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 16px 40px rgba(96, 165, 250, 0.15), 0 0 0 1px rgba(96, 165, 250, 0.2);
        }
        .pronunciation-card:hover .icon-container-blue {
          transform: scale(1.1);
          box-shadow: 0 8px 24px rgba(96, 165, 250, 0.35);
        }
        .pronunciation-card:active {
          transform: translateY(-2px);
        }
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(96, 165, 250, 0); }
        }
        .pronunciation-card:hover .icon-container-blue {
          animation: mic-pulse 1.5s ease-in-out infinite;
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
          background: `linear-gradient(90deg, transparent 0%, rgba(96, 165, 250, 0.4) 50%, transparent 100%)`,
        }}
      />

      {/* Decorative gradient orb */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          left: '-20%',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Icon container with pulse effect */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          className="icon-container-blue"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(96, 165, 250, 0.1) 100%)',
            border: '1px solid rgba(96, 165, 250, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa',
            transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <MicIcon size={26} />
        </div>
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
          Pronunciation
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
          Quick practice
        </span>
      </div>
    </button>
  );
};
