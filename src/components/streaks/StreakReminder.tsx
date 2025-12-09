import { AppColors } from '../../theme/colors';
import { PlayIcon } from '../../theme/icons';

interface StreakReminderProps {
  currentStreak: number;
  onDone: () => void;
  onPracticeMore: () => void;
}

/**
 * Post-session reminder shown after completing a practice session.
 * Encourages users to maintain their streak by returning tomorrow.
 */
export const StreakReminder = ({
  currentStreak,
  onDone,
  onPracticeMore,
}: StreakReminderProps) => {
  const nextStreakDay = currentStreak + 1;

  return (
    <div
      style={{
        padding: 'clamp(20px, 5vw, 28px)',
        borderRadius: '20px',
        background: `linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%)`,
        border: '1px solid rgba(251, 191, 36, 0.25)',
        textAlign: 'center',
      }}
    >
      {/* Streak icon and count */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontSize: 'clamp(32px, 10vw, 48px)',
          }}
        >
          🔥
        </span>
        <span
          style={{
            fontSize: 'clamp(36px, 12vw, 52px)',
            fontWeight: '700',
            color: AppColors.whisperAmber,
          }}
        >
          {currentStreak}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: 'clamp(16px, 4vw, 20px)',
          fontWeight: '600',
          color: AppColors.textPrimary,
        }}
      >
        {currentStreak === 1 ? 'Streak started!' : `${currentStreak} Day Streak!`}
      </h3>

      {/* Message */}
      <p
        style={{
          margin: '0 0 20px 0',
          fontSize: 'clamp(13px, 3.5vw, 15px)',
          color: AppColors.textSecondary,
          lineHeight: 1.5,
        }}
      >
        Come back tomorrow to make it {nextStreakDay}!
      </p>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={onDone}
          style={{
            flex: 1,
            maxWidth: '140px',
            padding: 'clamp(10px, 2.5vw, 14px)',
            borderRadius: '12px',
            border: `1px solid ${AppColors.borderColor}`,
            backgroundColor: 'transparent',
            color: AppColors.textSecondary,
            fontSize: 'clamp(13px, 3.5vw, 15px)',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Done
        </button>

        <button
          onClick={onPracticeMore}
          style={{
            flex: 1,
            maxWidth: '180px',
            padding: 'clamp(10px, 2.5vw, 14px)',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: AppColors.accentPurple,
            color: AppColors.textDark,
            fontSize: 'clamp(13px, 3.5vw, 15px)',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          Practice More
          <PlayIcon size={14} />
        </button>
      </div>
    </div>
  );
};
