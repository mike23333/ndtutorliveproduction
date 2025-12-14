/**
 * Progress Hero Section
 * Stunning animated hero with streak ring and motivational messaging
 * Inspired by premium fitness & learning apps
 */

import { AppColors } from '../../theme/colors';
import { FireIcon } from '../../theme/icons';

interface ProgressHeroProps {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  userName?: string;
}

export default function ProgressHero({
  currentStreak,
  longestStreak,
  todayCompleted,
  userName,
}: ProgressHeroProps) {
  // Calculate ring progress (today's status)
  const ringProgress = todayCompleted ? 100 : 0;
  const circumference = 2 * Math.PI * 72; // radius = 72
  const strokeDashoffset = circumference - (ringProgress / 100) * circumference;

  // Motivational message based on streak
  const getMessage = () => {
    if (currentStreak === 0) return "Start your streak today!";
    if (currentStreak === 1) return "Great start! Keep it going.";
    if (currentStreak < 7) return "Building momentum!";
    if (currentStreak < 14) return "You're on fire!";
    if (currentStreak < 30) return "Incredible dedication!";
    return "Unstoppable learner!";
  };

  return (
    <div style={{
      position: 'relative',
      padding: '40px 24px 32px',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.5; }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes shimmer-streak {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .streak-ring-bg {
          animation: pulse-ring 3s ease-in-out infinite;
        }
        .streak-number {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-streak 3s ease-in-out infinite;
        }
        .floating-ember {
          animation: float-particle 2s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient gradient background */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-25%',
        width: '150%',
        height: '200%',
        background: `
          radial-gradient(ellipse at 50% 0%, ${AppColors.whisperAmber}12 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, ${AppColors.accentPurple}08 0%, transparent 40%),
          radial-gradient(ellipse at 20% 60%, ${AppColors.accentBlue}06 0%, transparent 40%)
        `,
        pointerEvents: 'none',
      }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="floating-ember"
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: AppColors.whisperAmber,
            opacity: 0.2 + Math.random() * 0.3,
            top: `${20 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.3}s`,
            filter: 'blur(1px)',
          }}
        />
      ))}

      {/* Main content */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Greeting */}
        {userName && (
          <p style={{
            margin: '0 0 24px 0',
            fontSize: '15px',
            color: AppColors.textSecondary,
            fontWeight: '500',
          }}>
            Your Progress, {userName}
          </p>
        )}

        {/* Streak Ring */}
        <div style={{
          position: 'relative',
          width: '180px',
          height: '180px',
          marginBottom: '24px',
        }}>
          {/* Outer glow ring */}
          <svg
            className="streak-ring-bg"
            style={{
              position: 'absolute',
              inset: '-10px',
              width: '200px',
              height: '200px',
            }}
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r="82"
              fill="none"
              stroke={AppColors.whisperAmber}
              strokeWidth="2"
              opacity="0.15"
            />
          </svg>

          {/* Background track */}
          <svg
            style={{ position: 'absolute', inset: 0 }}
            viewBox="0 0 180 180"
          >
            <defs>
              <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={AppColors.whisperAmber} />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r="72"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="8"
              strokeLinecap="round"
            />

            {/* Progress circle */}
            <circle
              cx="90"
              cy="90"
              r="72"
              fill="none"
              stroke="url(#ring-gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 90 90)"
              filter="url(#glow)"
              style={{
                transition: 'stroke-dashoffset 1s ease-out',
              }}
            />
          </svg>

          {/* Center content */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FireIcon
              size={28}
              color={currentStreak > 0 ? AppColors.whisperAmber : AppColors.textMuted}
            />
            <span
              className={currentStreak > 0 ? 'streak-number' : ''}
              style={{
                fontSize: '48px',
                fontWeight: '800',
                lineHeight: 1,
                marginTop: '4px',
                color: currentStreak > 0 ? undefined : AppColors.textMuted,
              }}
            >
              {currentStreak}
            </span>
            <span style={{
              fontSize: '13px',
              color: AppColors.textSecondary,
              marginTop: '2px',
              fontWeight: '500',
            }}>
              day streak
            </span>
          </div>
        </div>

        {/* Motivational message */}
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '22px',
          fontWeight: '700',
          color: AppColors.textPrimary,
          letterSpacing: '-0.3px',
        }}>
          {getMessage()}
        </h1>

        {/* Best streak indicator */}
        {longestStreak > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginTop: '8px',
          }}>
            <span style={{ fontSize: '14px' }}>⭐</span>
            <span style={{
              fontSize: '13px',
              color: AppColors.textSecondary,
            }}>
              Best: <span style={{ color: AppColors.textPrimary, fontWeight: '600' }}>
                {longestStreak} days
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
