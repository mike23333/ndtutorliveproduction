import { useEffect, useState } from 'react';
import { AppColors } from '../../theme/colors';
import { StreakMilestone } from '../../hooks/useStreak';

interface StreakMilestoneModalProps {
  milestone: StreakMilestone;
  currentStreak: number;
  onContinue: () => void;
}

/**
 * Celebration modal shown when user hits a streak milestone.
 * Animated confetti-like effect with milestone icon and message.
 */
export const StreakMilestoneModal = ({
  milestone,
  currentStreak,
  onContinue,
}: StreakMilestoneModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    setShowContent(false);
    setIsVisible(false);
    setTimeout(onContinue, 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isVisible ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'background-color 0.3s ease',
        padding: '20px',
      }}
      onClick={handleContinue}
    >
      {/* Celebration particles */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {showContent &&
          [...Array(20)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: '-20px',
                fontSize: '24px',
                animation: `fall ${2 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            >
              {['✨', '🔥', '⭐', '🎉'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
      </div>

      {/* Modal content */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '340px',
          padding: 'clamp(24px, 6vw, 32px)',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${AppColors.gradientStart} 0%, ${AppColors.gradientMid} 100%)`,
          border: `2px solid ${AppColors.whisperAmber}`,
          textAlign: 'center',
          transform: showContent ? 'scale(1)' : 'scale(0.8)',
          opacity: showContent ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: 'clamp(48px, 15vw, 72px)',
            marginBottom: '16px',
            animation: showContent ? 'bounce 0.6s ease-out' : 'none',
          }}
        >
          {milestone.icon}
        </div>

        {/* Title */}
        <h2
          style={{
            margin: '0 0 8px 0',
            fontSize: 'clamp(22px, 6vw, 28px)',
            fontWeight: '700',
            color: AppColors.whisperAmber,
          }}
        >
          {milestone.title}
        </h2>

        {/* Streak count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '20px' }}>🔥</span>
          <span
            style={{
              fontSize: 'clamp(28px, 8vw, 36px)',
              fontWeight: '700',
              color: AppColors.textPrimary,
            }}
          >
            {currentStreak}
          </span>
          <span
            style={{
              fontSize: '14px',
              color: AppColors.textSecondary,
            }}
          >
            days
          </span>
        </div>

        {/* Message */}
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: 'clamp(14px, 4vw, 16px)',
            color: AppColors.textSecondary,
            lineHeight: 1.5,
          }}
        >
          {milestone.message}
        </p>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          style={{
            width: '100%',
            padding: 'clamp(12px, 3vw, 16px)',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: AppColors.whisperAmber,
            color: AppColors.textDark,
            fontSize: 'clamp(14px, 4vw, 16px)',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
        >
          Keep Going! 🚀
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};
