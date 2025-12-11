import { AppColors } from '../../theme/colors';
import { CheckCircleIcon, ClockIcon } from '../../theme/icons';

interface CompactLessonCardProps {
  title: string;
  level: string;
  duration: string;
  completed: boolean;
  image?: string;
  onClick: () => void;
}

/**
 * Get level badge colors based on CEFR level
 */
const getLevelColors = (level: string) => {
  const l = level.toUpperCase();
  if (l === 'A1' || l === 'A2') {
    return { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80' }; // green
  }
  if (l === 'B1' || l === 'B2') {
    return { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' }; // amber
  }
  if (l === 'C1' || l === 'C2') {
    return { bg: 'rgba(248, 113, 113, 0.2)', text: '#f87171' }; // red
  }
  return { bg: 'rgba(216, 180, 254, 0.2)', text: '#d8b4fe' }; // purple fallback
};

/**
 * Lesson card - Matching template design
 * Uses surfaceDark background with 24px border radius
 */
export const CompactLessonCard = ({
  title,
  level,
  duration,
  completed,
  image,
  onClick,
}: CompactLessonCardProps) => {
  const levelColors = getLevelColors(level);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        borderRadius: '24px',
        backgroundColor: AppColors.surfaceDark,
        border: `1px solid ${AppColors.borderColor}`,
        cursor: 'pointer',
        transition: 'all 300ms ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        opacity: completed ? 0.6 : 1,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Image */}
      {image && (
        <div
          style={{
            width: '100%',
            height: '100px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <img
            src={image}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: completed ? 'grayscale(50%)' : 'none',
            }}
          />

          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(to top, rgba(30, 27, 75, 1) 0%, transparent 100%)',
            }}
          />

          {/* Level badge */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
            }}
          >
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                backgroundColor: levelColors.bg,
                color: levelColors.text,
              }}
            >
              {level}
            </span>
          </div>

          {/* Completion indicator */}
          {completed && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                color: AppColors.success,
              }}
            >
              <CheckCircleIcon size={20} />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div
        style={{
          padding: '12px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flex: 1,
        }}
      >
        {/* Title */}
        <h4
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: AppColors.textPrimary,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </h4>

        {/* Duration with icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: AppColors.textSecondary,
          }}
        >
          <ClockIcon size={12} />
          <span>{duration}</span>
        </div>
      </div>
    </div>
  );
};
