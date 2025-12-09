import { AppColors } from '../../theme/colors';
import { ClockIcon, CheckCircleIcon } from '../../theme/icons';

interface CompactLessonCardProps {
  title: string;
  level: string;
  duration: string;
  completed: boolean;
  image?: string;
  onClick: () => void;
}

/**
 * Compact lesson card for the assignment grid.
 * Shows image thumbnail, title, level, duration, and completion status.
 * Supports replay for completed lessons.
 */
export const CompactLessonCard = ({
  title,
  level,
  duration,
  completed,
  image,
  onClick,
}: CompactLessonCardProps) => {
  // Level color mapping
  const levelColors: Record<string, { bg: string; text: string }> = {
    'A1': { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80' },
    'A2': { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80' },
    'B1': { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' },
    'B2': { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' },
    'C1': { bg: 'rgba(248, 113, 113, 0.2)', text: '#f87171' },
    'C2': { bg: 'rgba(248, 113, 113, 0.2)', text: '#f87171' },
  };

  const levelColor = levelColors[level] || levelColors['A2'];

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: '12px',
        backgroundColor: completed
          ? 'rgba(74, 222, 128, 0.08)'
          : AppColors.surfaceMedium,
        border: `1px solid ${
          completed ? 'rgba(74, 222, 128, 0.25)' : AppColors.borderColor
        }`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Image */}
      {image && (
        <div
          style={{
            width: '100%',
            height: 'clamp(80px, 22vw, 110px)',
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          {/* Completion badge overlay on image */}
          {completed && (
            <div
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                backgroundColor: AppColors.successGreen,
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircleIcon size={14} />
            </div>
          )}
          {/* Level badge overlay on image */}
          <span
            style={{
              position: 'absolute',
              bottom: '6px',
              left: '6px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '700',
              backgroundColor: levelColor.bg,
              color: levelColor.text,
              backdropFilter: 'blur(4px)',
            }}
          >
            {level}
          </span>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          padding: 'clamp(8px, 2vw, 12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          flex: 1,
        }}
      >
        {/* Completion indicator + Level (only show if no image) */}
        {!image && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {completed ? (
                <span style={{ color: AppColors.successGreen }}>
                  <CheckCircleIcon size={18} />
                </span>
              ) : (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `2px solid ${AppColors.borderColor}`,
                  }}
                />
              )}
            </div>

            {/* Level badge */}
            <span
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '700',
                backgroundColor: levelColor.bg,
                color: levelColor.text,
              }}
            >
              {level}
            </span>
          </div>
        )}

        {/* Title */}
        <div
          style={{
            flex: 1,
            fontSize: 'clamp(12px, 3vw, 14px)',
            fontWeight: 600,
            color: AppColors.textPrimary,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </div>

        {/* Footer: Duration + Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: AppColors.textSecondary,
            }}
          >
            <ClockIcon size={12} />
            {duration}
          </div>

          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: completed ? AppColors.successGreen : AppColors.accentPurple,
            }}
          >
            {completed ? 'Redo' : 'Start'}
          </span>
        </div>
      </div>
    </div>
  );
};
