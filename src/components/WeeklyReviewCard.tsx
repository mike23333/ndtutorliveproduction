/**
 * Weekly Review Card Component
 * Vibrant purple/indigo design for review lessons
 */

import React from 'react';
import { AppColors } from '../theme/colors';
import { PlayIcon } from '../theme/icons';
import type { ReviewLessonDocument } from '../types/firestore';

interface WeeklyReviewCardProps {
  review: ReviewLessonDocument;
  onClick: () => void;
}

export const WeeklyReviewCard: React.FC<WeeklyReviewCardProps> = ({
  review,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        margin: '0 20px 20px',
        padding: '20px',
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${AppColors.accentPurple}15 0%, ${AppColors.accentBlue}15 100%)`,
        border: `1px solid ${AppColors.accentPurple}33`,
        cursor: 'pointer',
        transition: 'all 200ms ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              color: AppColors.accentPurple,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}
          >
            Weekly Review
          </span>
          <h3
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: '700',
              color: AppColors.textPrimary,
            }}
          >
            Practice Your Tricky Words
          </h3>
        </div>

        {/* Duration */}
        <span
          style={{
            fontSize: '13px',
            color: AppColors.textSecondary,
          }}
        >
          ~{review.estimatedMinutes} min
        </span>
      </div>

      {/* Words preview - compact chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        {review.struggleWords.slice(0, 4).map((word, index) => (
          <span
            key={index}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: AppColors.surfaceMedium,
              color: AppColors.textPrimary,
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            {word}
          </span>
        ))}
        {review.struggleWords.length > 4 && (
          <span
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              color: AppColors.textMuted,
            }}
          >
            +{review.struggleWords.length - 4} more
          </span>
        )}
      </div>

      {/* Start button */}
      <button
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: AppColors.accentPurple,
          color: AppColors.textDark,
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
      >
        <PlayIcon size={16} />
        Start Review
      </button>
    </div>
  );
};

export default WeeklyReviewCard;
