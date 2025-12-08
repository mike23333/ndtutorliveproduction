/**
 * Weekly Review Card Component
 * Displays a prominent card when a weekly review lesson is available
 * Shows this week's struggle words and invites user to practice
 */

import React from 'react';
import { AppColors } from '../theme/colors';
import { PlayIcon, ClockIcon, SparklesIcon } from '../theme/icons';
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
      style={{
        margin: '0 clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px)',
        padding: 'clamp(16px, 4vw, 24px)',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(79, 70, 229, 0.15) 100%)',
        border: '2px solid rgba(139, 92, 246, 0.4)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Decorative background sparkle */}
      <div style={{
        position: 'absolute',
        top: '-30px',
        right: '-30px',
        width: '120px',
        height: '120px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 'clamp(12px, 3vw, 16px)',
      }}>
        <div>
          {/* Badge and label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'rgba(139, 92, 246, 0.3)',
            }}>
              <SparklesIcon size={16} />
            </div>
            <span style={{
              fontSize: 'clamp(10px, 2.5vw, 12px)',
              fontWeight: '700',
              color: '#a78bfa', // violet-400
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Weekly Practice
            </span>
          </div>

          {/* Title */}
          <h3 style={{
            margin: 0,
            fontSize: 'clamp(18px, 4.5vw, 22px)',
            fontWeight: '700',
            color: AppColors.textPrimary,
          }}>
            Your Week in English
          </h3>
        </div>

        {/* Duration badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 10px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: AppColors.textSecondary,
          fontSize: 'clamp(11px, 2.5vw, 13px)',
          fontWeight: '500',
        }}>
          <ClockIcon size={14} />
          ~{review.estimatedMinutes} min
        </div>
      </div>

      {/* Description */}
      <p style={{
        margin: '0 0 clamp(12px, 3vw, 16px) 0',
        fontSize: 'clamp(13px, 3vw, 15px)',
        color: AppColors.textSecondary,
        lineHeight: 1.5,
      }}>
        A quick conversation to revisit this week's tricky words
      </p>

      {/* Struggle words preview */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: 'clamp(16px, 4vw, 20px)',
      }}>
        {review.struggleWords.slice(0, 5).map((word, index) => (
          <span
            key={index}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: AppColors.textPrimary,
              fontSize: 'clamp(12px, 3vw, 14px)',
              fontWeight: '500',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            "{word}"
          </span>
        ))}
        {review.struggleWords.length > 5 && (
          <span style={{
            padding: '6px 12px',
            fontSize: 'clamp(12px, 3vw, 14px)',
            color: AppColors.textSecondary,
            fontStyle: 'italic',
          }}>
            +{review.struggleWords.length - 5} more
          </span>
        )}
      </div>

      {/* CTA Button */}
      <button
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: 'clamp(12px, 3vw, 16px)',
          borderRadius: '14px',
          border: 'none',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          color: '#ffffff',
          fontSize: 'clamp(14px, 3.5vw, 16px)',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
        }}
      >
        <PlayIcon size={18} />
        Practice Now
      </button>
    </div>
  );
};

export default WeeklyReviewCard;
