import { AppColors } from '../../theme/colors';
import { PlayIcon } from '../../theme/icons';

interface StreakAtRiskBannerProps {
  currentStreak: number;
  onQuickPractice: () => void;
}

/**
 * Warning banner shown when user's streak is at risk.
 * Displayed when user hasn't practiced today and it's after 5 PM.
 */
export const StreakAtRiskBanner = ({
  currentStreak,
  onQuickPractice,
}: StreakAtRiskBannerProps) => {
  return (
    <div
      style={{
        margin: '0 clamp(16px, 4vw, 24px) clamp(12px, 3vw, 16px)',
        padding: 'clamp(12px, 3vw, 16px)',
        borderRadius: '12px',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px',
          }}
        >
          <span style={{ fontSize: '16px' }}>⚠️</span>
          <span
            style={{
              fontSize: 'clamp(13px, 3.5vw, 15px)',
              fontWeight: '600',
              color: AppColors.whisperAmber,
            }}
          >
            Streak at risk!
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(11px, 3vw, 13px)',
            color: AppColors.textSecondary,
          }}
        >
          Your {currentStreak}-day streak ends at midnight
        </p>
      </div>

      <button
        onClick={onQuickPractice}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)',
          borderRadius: '20px',
          border: 'none',
          backgroundColor: AppColors.whisperAmber,
          color: AppColors.textDark,
          fontWeight: '600',
          fontSize: 'clamp(12px, 3vw, 14px)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'transform 0.2s ease',
        }}
      >
        <PlayIcon size={14} />
        Quick practice
      </button>
    </div>
  );
};
