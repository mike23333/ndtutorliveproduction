/**
 * Home Hero Section
 * Stunning animated hero matching Progress page design language
 * Features: ambient gradients, floating particles, progress ring, motivational messaging
 */

import { AppColors } from '../../theme/colors';
import { PlayIcon } from '../../theme/icons';

interface HomeHeroProps {
  userName: string;
  streakDays: number;
  lessonsCompleted: number;
  totalLessons: number;
  todayPracticed: boolean;
  onContinue: () => void;
  onProfileClick: () => void;
}

/**
 * Get time-based greeting with contextual emoji
 */
const getGreetingData = (): { text: string; emoji: string } => {
  const hour = new Date().getHours();
  if (hour < 6) return { text: 'Good night', emoji: '\u{1F319}' };
  if (hour < 12) return { text: 'Good morning', emoji: '\u{2600}\u{FE0F}' };
  if (hour < 17) return { text: 'Good afternoon', emoji: '\u{1F31E}' };
  if (hour < 21) return { text: 'Good evening', emoji: '\u{1F305}' };
  return { text: 'Good night', emoji: '\u{1F319}' };
};

/**
 * Get motivational message based on progress
 */
const getMotivationalMessage = (
  lessonsCompleted: number,
  totalLessons: number,
  streakDays: number,
  todayPracticed: boolean
): string => {
  if (!todayPracticed && streakDays > 0) {
    return "Keep your streak alive!";
  }
  if (lessonsCompleted === 0) {
    return "Ready to start learning?";
  }
  if (lessonsCompleted === totalLessons && totalLessons > 0) {
    return "Amazing! All lessons done!";
  }
  if (lessonsCompleted > 0 && lessonsCompleted < totalLessons) {
    const percent = Math.round((lessonsCompleted / totalLessons) * 100);
    if (percent >= 75) return "Almost there!";
    if (percent >= 50) return "You're doing great!";
    return "Keep it up!";
  }
  if (streakDays >= 7) return "Incredible dedication!";
  if (streakDays >= 3) return "You're on fire!";
  return "Let's practice!";
};

export const HomeHero = ({
  userName,
  streakDays,
  lessonsCompleted,
  totalLessons,
  todayPracticed,
  onContinue,
  onProfileClick,
}: HomeHeroProps) => {
  const greeting = getGreetingData();
  const motivationalMessage = getMotivationalMessage(
    lessonsCompleted,
    totalLessons,
    streakDays,
    todayPracticed
  );

  // Calculate progress ring
  const progress = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;
  const circumference = 2 * Math.PI * 72;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{
      position: 'relative',
      padding: '32px 20px 40px',
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
        @keyframes shimmer-gradient {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fireGlow {
          0%, 100% {
            filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.5));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.8));
            transform: scale(1.1);
          }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(216, 180, 254, 0.3); }
          50% { box-shadow: 0 0 40px rgba(216, 180, 254, 0.5); }
        }
        .hero-ring-bg {
          animation: pulse-ring 3s ease-in-out infinite;
        }
        .floating-ember {
          animation: float-particle 2s ease-in-out infinite;
        }
        .hero-greeting {
          animation: fadeInUp 0.5s ease-out;
        }
        .hero-name {
          animation: fadeInUp 0.6s ease-out;
          background: linear-gradient(135deg, #ffffff 0%, ${AppColors.accent} 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-message {
          animation: fadeInUp 0.7s ease-out;
        }
        .streak-fire {
          animation: fireGlow 2s ease-in-out infinite;
          display: inline-block;
        }
        .streak-badge {
          animation: fadeInUp 0.5s ease-out;
        }
        .profile-btn {
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .profile-btn:hover {
          transform: scale(1.05);
          border-color: rgba(216, 180, 254, 0.5) !important;
        }
        .cta-button {
          animation: fadeInUp 0.8s ease-out, pulseGlow 3s ease-in-out infinite 1s;
          transition: all 250ms ease;
        }
        .cta-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 32px rgba(216, 180, 254, 0.4) !important;
        }
        .cta-button:active {
          transform: translateY(0) scale(1);
        }
        .progress-number {
          background: linear-gradient(135deg, ${AppColors.accent} 0%, ${AppColors.accentBlue} 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
          radial-gradient(ellipse at 30% 20%, ${AppColors.accentPurple}15 0%, transparent 50%),
          radial-gradient(ellipse at 70% 60%, ${AppColors.accentBlue}10 0%, transparent 45%),
          radial-gradient(ellipse at 50% 100%, ${AppColors.whisperAmber}08 0%, transparent 40%)
        `,
        pointerEvents: 'none',
      }} />

      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="floating-ember"
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: i % 2 === 0 ? AppColors.accent : AppColors.accentBlue,
            opacity: 0.15 + Math.random() * 0.2,
            top: `${15 + Math.random() * 70}%`,
            left: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.4}s`,
            filter: 'blur(1px)',
          }}
        />
      ))}

      {/* Top bar: Streak + Profile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Streak badge */}
        {streakDays > 0 && (
          <div
            className="streak-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 18px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(251, 191, 36, 0.08) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <span className="streak-fire" style={{ fontSize: '20px' }}>
              {'\u{1F525}'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontSize: '18px',
                fontWeight: '800',
                color: AppColors.whisperAmber,
                lineHeight: 1,
              }}>
                {streakDays}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                color: 'rgba(251, 191, 36, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {streakDays === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        )}

        {/* Empty spacer if no streak */}
        {streakDays === 0 && <div />}

        {/* Profile button */}
        <button
          className="profile-btn"
          onClick={onProfileClick}
          aria-label="View profile"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            color: AppColors.textSecondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>

      {/* Main hero content */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 1,
      }}>
        {/* Greeting */}
        <div
          className="hero-greeting"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>{greeting.emoji}</span>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: AppColors.textSecondary,
          }}>
            {greeting.text}
          </span>
        </div>

        {/* User name */}
        <h1
          className="hero-name"
          style={{
            margin: '0 0 32px 0',
            fontSize: '32px',
            fontWeight: '800',
            letterSpacing: '-0.8px',
            lineHeight: 1.1,
          }}
        >
          {userName}
        </h1>

        {/* Progress Ring */}
        <div style={{
          position: 'relative',
          width: '180px',
          height: '180px',
          marginBottom: '24px',
        }}>
          {/* Outer glow ring */}
          <svg
            className="hero-ring-bg"
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
              stroke={AppColors.accent}
              strokeWidth="2"
              opacity="0.12"
            />
          </svg>

          {/* Main ring */}
          <svg
            style={{ position: 'absolute', inset: 0 }}
            viewBox="0 0 180 180"
          >
            <defs>
              <linearGradient id="home-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={AppColors.accent} />
                <stop offset="100%" stopColor={AppColors.accentBlue} />
              </linearGradient>
              <filter id="home-glow">
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
              stroke="url(#home-ring-gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 90 90)"
              filter="url(#home-glow)"
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
            <span
              className="progress-number"
              style={{
                fontSize: '44px',
                fontWeight: '800',
                lineHeight: 1,
              }}
            >
              {lessonsCompleted}
            </span>
            <span style={{
              fontSize: '13px',
              color: AppColors.textSecondary,
              marginTop: '4px',
              fontWeight: '500',
            }}>
              of {totalLessons} lessons
            </span>
          </div>
        </div>

        {/* Motivational message */}
        <p
          className="hero-message"
          style={{
            margin: '0 0 28px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: AppColors.textPrimary,
            letterSpacing: '-0.3px',
          }}
        >
          {motivationalMessage}
        </p>

        {/* CTA Button */}
        <button
          className="cta-button"
          onClick={onContinue}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '18px 40px',
            borderRadius: '20px',
            border: 'none',
            background: 'linear-gradient(135deg, #d8b4fe 0%, #c084fc 50%, #a855f7 100%)',
            color: '#1a0a2e',
            fontSize: '17px',
            fontWeight: '700',
            cursor: 'pointer',
            letterSpacing: '-0.3px',
            boxShadow: '0 8px 24px rgba(216, 180, 254, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Button shine effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 0%, transparent 100%)',
            pointerEvents: 'none',
            borderRadius: '20px 20px 0 0',
          }} />
          <PlayIcon size={20} />
          <span style={{ position: 'relative' }}>
            {lessonsCompleted > 0 && lessonsCompleted < totalLessons
              ? 'Continue Learning'
              : 'Start Learning'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default HomeHero;
