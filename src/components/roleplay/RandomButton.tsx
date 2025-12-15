/**
 * RandomButton - Animated Random Selection Button
 * Premium glass-morphic styling with hover effects
 */

import { AppColors, radius } from '../../theme/colors';

interface RandomButtonProps {
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export const RandomButton = ({ onClick, disabled, compact }: RandomButtonProps) => {
  return (
    <>
      <style>{`
        .random-btn {
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .random-btn:not(:disabled):hover {
          border-color: rgba(216, 180, 254, 0.4);
          background: linear-gradient(135deg, rgba(216, 180, 254, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%);
          box-shadow: 0 4px 16px rgba(216, 180, 254, 0.15);
          transform: translateY(-1px);
        }
        .random-btn:not(:disabled):hover .random-icon {
          animation: diceRoll 0.6s ease-in-out;
        }
        .random-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        @keyframes diceRoll {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      <button
        className="random-btn"
        onClick={onClick}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: compact ? '8px 14px' : '10px 18px',
          borderRadius: radius.full,
          border: `1.5px solid ${AppColors.borderColor}`,
          background: AppColors.bgTertiary,
          fontSize: '14px',
          fontWeight: '600',
          color: AppColors.textPrimary,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span>Random</span>
        <span className="random-icon" style={{ fontSize: '16px', display: 'inline-block' }}>
          🎲
        </span>
      </button>
    </>
  );
};
