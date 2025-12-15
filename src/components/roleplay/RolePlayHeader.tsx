/**
 * RolePlayHeader - Minimal Premium Header
 * Clean design with glass-morphic back button and optional right action
 */

import { AppColors, radius } from '../../theme/colors';

interface RolePlayHeaderProps {
  onBack: () => void;
  rightAction?: React.ReactNode;
}

export const RolePlayHeader = ({ onBack, rightAction }: RolePlayHeaderProps) => {
  return (
    <header
      style={{
        position: 'relative',
        padding: '16px 20px',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .rp-back-btn {
          transition: all 200ms ease;
        }
        .rp-back-btn:hover {
          background-color: rgba(255, 255, 255, 0.15);
          border-color: rgba(216, 180, 254, 0.3);
          box-shadow: 0 0 16px rgba(216, 180, 254, 0.15);
        }
        .rp-back-btn:active {
          transform: scale(0.95);
        }
      `}</style>

      {/* Subtle gradient orb decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '140px',
          height: '140px',
          background: 'radial-gradient(circle, rgba(216, 180, 254, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Glass-morphic back button */}
        <button
          className="rp-back-btn"
          onClick={onBack}
          aria-label="Go back"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: radius.md,
            border: `1px solid ${AppColors.borderColor}`,
            backgroundColor: AppColors.surface10,
            color: AppColors.textPrimary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Optional right action (Random button, etc.) */}
        {rightAction}
      </div>
    </header>
  );
};
