import { useEffect, useState } from 'react';
import { AppColors } from '../../theme/colors';
import { StarIcon } from '../../theme/icons';

interface FirstSessionCelebrationProps {
  starsEarned: number;
  onGoHome: () => void;
}

/**
 * Celebration screen shown after a user completes their first session.
 * Encourages them to continue and start a streak.
 */
export const FirstSessionCelebration = ({
  starsEarned,
  onGoHome,
}: FirstSessionCelebrationProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Animate in after mount
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 6vw, 40px)',
        textAlign: 'center',
        transform: showContent ? 'translateY(0)' : 'translateY(20px)',
        opacity: showContent ? 1 : 0,
        transition: 'all 0.5s ease-out',
      }}
    >
      {/* Celebration particles */}
      {showContent && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 30}%`,
                fontSize: '20px',
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              {['⭐', '✨', '🎉', '🌟'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      {/* Trophy/celebration icon */}
      <div
        style={{
          fontSize: 'clamp(56px, 18vw, 80px)',
          marginBottom: '16px',
          animation: showContent ? 'bounce 0.6s ease-out' : 'none',
        }}
      >
        🎉
      </div>

      {/* Title */}
      <h2
        style={{
          margin: '0 0 8px 0',
          fontSize: 'clamp(24px, 7vw, 32px)',
          fontWeight: '700',
          color: AppColors.textPrimary,
        }}
      >
        Great Job!
      </h2>

      <p
        style={{
          margin: '0 0 20px 0',
          fontSize: 'clamp(14px, 4vw, 18px)',
          color: AppColors.textSecondary,
        }}
      >
        You completed your first practice!
      </p>

      {/* Stars earned */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          marginBottom: '24px',
          padding: '12px 20px',
          borderRadius: '16px',
          backgroundColor: 'rgba(251, 191, 36, 0.15)',
        }}
      >
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            style={{
              color: i < starsEarned ? AppColors.whisperAmber : 'rgba(255,255,255,0.2)',
              fontSize: 'clamp(20px, 6vw, 28px)',
              animation: i < starsEarned && showContent ? `starPop 0.3s ease-out ${i * 0.1}s both` : 'none',
            }}
          >
            <StarIcon size={28} />
          </span>
        ))}
      </div>

      {/* First Steps Badge */}
      <div
        style={{
          padding: '16px 24px',
          borderRadius: '16px',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '32px' }}>🏅</span>
          <div style={{ textAlign: 'left' }}>
            <p
              style={{
                margin: '0 0 2px 0',
                fontSize: '10px',
                fontWeight: '600',
                color: AppColors.accentPurple,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Badge Earned
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: '600',
                color: AppColors.textPrimary,
              }}
            >
              First Steps
            </p>
          </div>
        </div>
      </div>

      {/* Streak encouragement */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '28px',
        }}
      >
        <span style={{ fontSize: '20px' }}>🔥</span>
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(13px, 3.5vw, 15px)',
            color: AppColors.textSecondary,
          }}
        >
          Come back tomorrow to start a streak!
        </p>
      </div>

      {/* Continue button */}
      <button
        onClick={onGoHome}
        style={{
          width: '100%',
          maxWidth: '280px',
          padding: 'clamp(14px, 4vw, 18px)',
          borderRadius: '14px',
          border: 'none',
          background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
          color: AppColors.textDark,
          fontSize: 'clamp(15px, 4vw, 17px)',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }}
      >
        Go to Home
      </button>

      {/* Animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes starPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
