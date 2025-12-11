import { AppColors } from '../../theme/colors';
import { PlayIcon } from '../../theme/icons';
import { LessonWithCompletion } from '../home/AssignmentGrid';

interface FirstTimeGuidanceProps {
  teacherName?: string;
  firstLesson?: LessonWithCompletion | null;
  onStart: () => void;
}

/**
 * Welcome card for first-time users
 * Vibrant purple/indigo design
 */
export const FirstTimeGuidance = ({
  teacherName,
  firstLesson,
  onStart,
}: FirstTimeGuidanceProps) => {
  return (
    <div
      style={{
        margin: '0 20px 24px',
        padding: '32px 24px',
        borderRadius: '20px',
        background: `linear-gradient(135deg, ${AppColors.accentPurple}15 0%, ${AppColors.accentBlue}15 100%)`,
        border: `1px solid ${AppColors.accentPurple}33`,
        textAlign: 'center',
      }}
    >
      {/* Welcome emoji */}
      <div
        style={{
          fontSize: '48px',
          marginBottom: '16px',
        }}
      >
        👋
      </div>

      {/* Welcome message */}
      <h2
        style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: AppColors.textPrimary,
        }}
      >
        Welcome!
      </h2>

      <p
        style={{
          margin: '0 0 24px 0',
          fontSize: '15px',
          color: AppColors.textSecondary,
          lineHeight: 1.6,
        }}
      >
        {teacherName ? (
          <>
            {teacherName} has set up lessons for you.
            <br />
            Let's start with a quick conversation.
          </>
        ) : (
          <>
            Practice speaking English with an AI tutor.
            <br />
            It's okay to make mistakes — that's how we learn.
          </>
        )}
      </p>

      {/* First lesson preview */}
      {firstLesson && (
        <div
          style={{
            padding: '16px',
            marginBottom: '24px',
            borderRadius: '12px',
            backgroundColor: AppColors.surfaceMedium,
            textAlign: 'left',
          }}
        >
          <p
            style={{
              margin: '0 0 4px 0',
              fontSize: '11px',
              color: AppColors.accentPurple,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '600',
            }}
          >
            Your first lesson
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: AppColors.textPrimary,
            }}
          >
            {firstLesson.title}
          </p>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: AppColors.textSecondary,
            }}
          >
            {firstLesson.duration} · {firstLesson.level}
          </p>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={onStart}
        style={{
          width: '100%',
          padding: '16px 24px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: AppColors.accentPurple,
          color: AppColors.textDark,
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 150ms ease',
        }}
      >
        <PlayIcon size={18} />
        Start Practice
      </button>
    </div>
  );
};
