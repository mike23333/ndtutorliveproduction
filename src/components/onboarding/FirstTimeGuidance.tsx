import { AppColors } from '../../theme/colors';
import { PlayIcon, SparklesIcon } from '../../theme/icons';
import { LessonWithCompletion } from '../home/AssignmentGrid';

interface FirstTimeGuidanceProps {
  teacherName?: string;
  firstLesson?: LessonWithCompletion | null;
  onStart: () => void;
}

/**
 * Prominent guidance card for first-time users.
 * Replaces PrimaryActionCard for users with 0 sessions.
 */
export const FirstTimeGuidance = ({
  teacherName,
  firstLesson,
  onStart,
}: FirstTimeGuidanceProps) => {
  return (
    <div
      style={{
        margin: '0 clamp(16px, 4vw, 24px) clamp(16px, 4vw, 20px)',
        padding: 'clamp(20px, 5vw, 28px)',
        borderRadius: '20px',
        background: `linear-gradient(135deg, ${AppColors.accentPurple}22 0%, ${AppColors.accentBlue}22 100%)`,
        border: `2px solid ${AppColors.accentPurple}44`,
        textAlign: 'center',
      }}
    >
      {/* Welcome icon */}
      <div
        style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SparklesIcon size={28} />
      </div>

      {/* Welcome message */}
      <h2
        style={{
          margin: '0 0 8px 0',
          fontSize: 'clamp(18px, 5vw, 24px)',
          fontWeight: '700',
          color: AppColors.textPrimary,
        }}
      >
        Welcome! 👋
      </h2>

      {teacherName && (
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: 'clamp(13px, 3.5vw, 15px)',
            color: AppColors.textSecondary,
          }}
        >
          {teacherName} set up practice lessons for you
        </p>
      )}

      {/* Instructions */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          marginBottom: '20px',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(12px, 3vw, 14px)',
            color: AppColors.textSecondary,
            lineHeight: 1.6,
          }}
        >
          You'll have a conversation with an AI tutor. Speak naturally — it's okay to make mistakes!
        </p>
      </div>

      {/* First lesson info */}
      {firstLesson && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: AppColors.textSecondary,
            }}
          >
            First lesson:
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: AppColors.textPrimary,
            }}
          >
            {firstLesson.title}
          </span>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '700',
              backgroundColor: 'rgba(74, 222, 128, 0.2)',
              color: '#4ade80',
            }}
          >
            {firstLesson.level}
          </span>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={onStart}
        style={{
          width: '100%',
          maxWidth: '280px',
          padding: 'clamp(14px, 4vw, 18px)',
          borderRadius: '14px',
          border: 'none',
          background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
          color: AppColors.textDark,
          fontSize: 'clamp(15px, 4vw, 17px)',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          margin: '0 auto',
          transition: 'transform 0.2s ease',
        }}
      >
        <PlayIcon size={18} />
        Start Your First Practice
      </button>
    </div>
  );
};
