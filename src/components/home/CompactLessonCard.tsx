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
    return { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80', border: 'rgba(74, 222, 128, 0.25)' };
  }
  if (l === 'B1' || l === 'B2') {
    return { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.25)' };
  }
  if (l === 'C1' || l === 'C2') {
    return { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: 'rgba(248, 113, 113, 0.25)' };
  }
  return { bg: 'rgba(216, 180, 254, 0.15)', text: '#d8b4fe', border: 'rgba(216, 180, 254, 0.25)' };
};

// Generate unique ID for CSS scoping
let cardId = 0;

/**
 * CompactLessonCard - Premium glass-morphic lesson card
 * Matches Progress page design language
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
  const uniqueId = `lesson-card-${++cardId}`;

  return (
    <div
      className={uniqueId}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        borderRadius: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        border: `1px solid ${completed ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{`
        .${uniqueId} {
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .${uniqueId}:hover {
          transform: translateY(-4px);
          background-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(216, 180, 254, 0.15);
        }
        .${uniqueId}:active {
          transform: translateY(-2px);
        }
        .${uniqueId} .card-image {
          transition: transform 500ms ease;
        }
        .${uniqueId}:hover .card-image {
          transform: scale(1.08);
        }
      `}</style>

      {/* Image Container - 4:3 aspect ratio */}
      <div
        style={{
          width: '100%',
          paddingBottom: '70%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {image ? (
          <img
            className="card-image"
            src={image}
            alt={title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: completed ? 'grayscale(20%) brightness(0.85)' : 'none',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${AppColors.accent}20 0%, ${AppColors.accentBlue}20 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              {'\u{1F4DA}'}
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'linear-gradient(to top, rgba(30, 27, 75, 0.95) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Completion indicator - top left */}
        {completed && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(74, 222, 128, 0.2)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <CheckCircleIcon size={12} color={AppColors.success} />
            <span
              style={{
                fontSize: '10px',
                fontWeight: '600',
                color: AppColors.success,
              }}
            >
              Done
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          padding: '12px 14px 14px',
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
            color: completed ? AppColors.textSecondary : AppColors.textPrimary,
            lineHeight: 1.3,
            letterSpacing: '-0.2px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </h4>

        {/* Meta row - Duration + Level */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ClockIcon size={11} color={AppColors.textMuted} />
            <span
              style={{
                fontSize: '11px',
                color: AppColors.textMuted,
                fontWeight: '500',
              }}
            >
              {duration}
            </span>
          </div>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '700',
              backgroundColor: levelColors.bg,
              color: levelColors.text,
              letterSpacing: '0.3px',
            }}
          >
            {level}
          </span>
        </div>
      </div>
    </div>
  );
};
