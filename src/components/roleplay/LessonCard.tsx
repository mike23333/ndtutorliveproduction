/**
 * LessonCard - Unified Premium Lesson Card
 * Glass-morphic design with hover lift and level badges
 */

import { AppColors, radius } from '../../theme/colors';

// Level badge styling
const LEVEL_BADGE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  beginner: {
    bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
    border: 'rgba(59, 130, 246, 0.3)',
    text: '#60a5fa',
  },
  'pre-intermediate': {
    bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
    border: 'rgba(168, 85, 247, 0.3)',
    text: '#a855f7',
  },
  intermediate: {
    bg: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)',
    border: 'rgba(234, 179, 8, 0.3)',
    text: '#fbbf24',
  },
  'upper-intermediate': {
    bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)',
    border: 'rgba(34, 197, 94, 0.3)',
    text: '#4ade80',
  },
};

// Map CEFR levels to UI level keys
const mapCEFRToLevelKey = (level: string | null): string => {
  if (!level) return 'beginner';
  switch (level) {
    case 'A1':
    case 'A2':
      return 'beginner';
    case 'B1':
      return 'pre-intermediate';
    case 'B2':
      return 'intermediate';
    case 'C1':
    case 'C2':
      return 'upper-intermediate';
    default:
      return 'beginner';
  }
};

// Get display label for level
const getLevelLabel = (level: string | null): string => {
  const levelKey = mapCEFRToLevelKey(level);
  const labels: Record<string, string> = {
    beginner: 'Beginner',
    'pre-intermediate': 'Pre-Intermediate',
    intermediate: 'Intermediate',
    'upper-intermediate': 'Upper-Intermediate',
  };
  return labels[levelKey] || 'Beginner';
};

interface LessonCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  targetLevel: string | null;
  onClick: () => void;
  animationDelay?: number;
}

export const LessonCard = ({
  title,
  imageUrl,
  targetLevel,
  onClick,
  animationDelay = 0,
}: LessonCardProps) => {
  const levelKey = mapCEFRToLevelKey(targetLevel);
  const levelStyles = LEVEL_BADGE_STYLES[levelKey] || LEVEL_BADGE_STYLES.beginner;
  const levelLabel = getLevelLabel(targetLevel);

  return (
    <div
      className="lesson-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        backgroundColor: AppColors.bgTertiary,
        borderRadius: radius.xl,
        cursor: 'pointer',
        border: `1px solid ${AppColors.borderColor}`,
        animation: `fadeInUp 0.4s ease-out ${animationDelay}s backwards`,
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lesson-card {
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .lesson-card:hover {
          border-color: rgba(216, 180, 254, 0.3);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(216, 180, 254, 0.1);
        }
        .lesson-card:active {
          transform: translateY(-1px);
        }
        .lesson-card-image {
          transition: transform 300ms ease;
        }
        .lesson-card:hover .lesson-card-image {
          transform: scale(1.05);
        }
      `}</style>

      {/* Lesson Illustration */}
      <div
        style={{
          width: '88px',
          height: '88px',
          borderRadius: radius.lg,
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: AppColors.bgSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {imageUrl ? (
          <img
            className="lesson-card-image"
            src={imageUrl}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{ fontSize: '36px' }}>🎭</span>
        )}
      </div>

      {/* Lesson Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            margin: '0 0 10px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: AppColors.textPrimary,
            lineHeight: 1.35,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {title}
        </h3>

        {/* Type Label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '10px',
            color: AppColors.textMuted,
            fontSize: '13px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span>Task</span>
        </div>

        {/* Level Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '5px 12px',
            borderRadius: radius.full,
            background: levelStyles.bg,
            border: `1px solid ${levelStyles.border}`,
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: levelStyles.text,
            }}
          >
            {levelLabel}
          </span>
        </div>
      </div>

      {/* Chevron */}
      <div
        style={{
          color: AppColors.textMuted,
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </div>
  );
};

// Export utilities for use in other components
export { mapCEFRToLevelKey, getLevelLabel, LEVEL_BADGE_STYLES };
