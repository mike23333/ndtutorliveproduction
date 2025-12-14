/**
 * Weekly Review Card Component
 * Premium design with gradient background and hover effects
 */

import React from 'react';
import { AppColors } from '../theme/colors';
import { PlayIcon } from '../theme/icons';
import type { ReviewLessonDocument } from '../types/firestore';

interface WeeklyReviewCardProps {
  review: ReviewLessonDocument;
  onClick: () => void;
}

// Star icon for review
const StarIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const WeeklyReviewCard: React.FC<WeeklyReviewCardProps> = ({
  review,
  onClick,
}) => {
  const isReady = review.status === 'ready';

  return (
    <div
      className="weekly-review-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        padding: '16px 18px',
        borderRadius: '20px',
        background: `linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .weekly-review-card {
          transition: all 250ms ease;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
        }
        .weekly-review-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.4) !important;
        }
        .weekly-review-card:hover .review-arrow {
          transform: translateX(3px);
        }
        .weekly-review-card:hover .icon-glow {
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
        }
      `}</style>

      {/* Decorative gradient orb */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Left side: Icon + Text */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        {/* Star icon with glow */}
        <div
          className="icon-glow"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa',
            transition: 'all 250ms ease',
          }}
        >
          <StarIcon size={22} />
        </div>

        {/* Text content - Title on top, Ready badge below */}
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: '700',
              color: AppColors.textPrimary,
              letterSpacing: '-0.2px',
            }}
          >
            Weekly Review
          </h3>
          <span
            style={{
              display: 'inline-block',
              marginTop: '5px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              fontSize: '10px',
              fontWeight: '700',
              color: '#a78bfa',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Ready
          </span>
        </div>
      </div>

      {/* Right side: Play button */}
      <div
        className="review-arrow"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          transition: 'all 200ms ease',
        }}
      >
        <PlayIcon size={16} />
      </div>
    </div>
  );
};

export default WeeklyReviewCard;
