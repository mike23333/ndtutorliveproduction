/**
 * Badge Earned Modal
 * Celebration modal displayed when user earns a new badge
 */

import { useEffect, useState } from 'react';
import { BadgeIcon } from './BadgeIcon';
import { AppColors } from '../../theme/colors';
import type { BadgeDefinition, BadgeCategory } from '../../types/badges';

interface BadgeEarnedModalProps {
  badges: BadgeDefinition[];
  onClose: () => void;
}

// Category glow colors
const CATEGORY_GLOW_COLORS: Record<BadgeCategory, string> = {
  consistency: 'rgba(249, 115, 22, 0.4)', // orange
  excellence: 'rgba(234, 179, 8, 0.4)', // yellow
  time: 'rgba(59, 130, 246, 0.4)', // blue
  explorer: 'rgba(34, 197, 94, 0.4)', // green
  level: 'rgba(168, 85, 247, 0.4)', // purple
};

export function BadgeEarnedModal({ badges, onClose }: BadgeEarnedModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Trigger animation on mount and when badge changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  if (badges.length === 0) return null;

  const currentBadge = badges[currentIndex];
  const hasMore = currentIndex < badges.length - 1;
  const glowColor = CATEGORY_GLOW_COLORS[currentBadge.category] || 'rgba(168, 85, 247, 0.4)';

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px',
    }}>
      <div
        style={{
          backgroundColor: AppColors.surfaceDark,
          borderRadius: '24px',
          maxWidth: '360px',
          width: '100%',
          padding: '32px 24px',
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${AppColors.borderColor}`,
          animation: isAnimating ? 'badge-pop 0.5s ease-out' : undefined,
        }}
      >
        {/* Glow effect behind badge */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            backgroundColor: glowColor,
            filter: 'blur(60px)',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative' }}>
          {/* Badge count indicator */}
          {badges.length > 1 && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: 0,
              fontSize: '14px',
              color: AppColors.textSecondary,
            }}>
              {currentIndex + 1} / {badges.length}
            </div>
          )}

          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            <p style={{
              margin: 0,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: AppColors.textSecondary,
              fontWeight: 500,
            }}>
              New Badge Earned!
            </p>
          </div>

          {/* Badge Icon */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px',
              animation: isAnimating ? 'badge-scale 0.6s ease-out' : undefined,
            }}
          >
            <BadgeIcon
              iconName={currentBadge.iconName}
              category={currentBadge.category}
              size="xl"
              earned={true}
            />
          </div>

          {/* Badge Info */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '24px',
              fontWeight: 700,
              color: AppColors.textPrimary,
            }}>
              {currentBadge.name}
            </h3>
            <p style={{
              margin: 0,
              fontSize: '15px',
              color: AppColors.textSecondary,
              lineHeight: 1.5,
            }}>
              {currentBadge.description}
            </p>
          </div>

          {/* Continue button */}
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              padding: '14px 16px',
              backgroundColor: AppColors.accentPurple,
              border: 'none',
              borderRadius: '14px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s, transform 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#9333ea';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = AppColors.accentPurple;
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {hasMore ? 'Next Badge' : 'Continue'}
          </button>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes badge-pop {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes badge-scale {
          0% {
            transform: scale(0.5);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default BadgeEarnedModal;
