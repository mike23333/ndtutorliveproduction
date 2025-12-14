/**
 * Homepage Header - Premium Hero Section
 * World-class design with immersive gradients, animated elements, and glass-morphism
 */

import { AppColors } from '../../theme/colors';

interface HeaderProps {
  userName: string;
  streakDays: number;
}

/**
 * Get time-based greeting with contextual emoji
 */
const getGreetingData = (): { text: string; emoji: string; gradient: string } => {
  const hour = new Date().getHours();
  if (hour < 6) return { text: 'Good night', emoji: '\u{1F319}', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' };
  if (hour < 12) return { text: 'Good morning', emoji: '\u{2600}\u{FE0F}', gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' };
  if (hour < 17) return { text: 'Good afternoon', emoji: '\u{1F31E}', gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' };
  if (hour < 21) return { text: 'Good evening', emoji: '\u{1F305}', gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' };
  return { text: 'Good night', emoji: '\u{1F319}', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' };
};

/**
 * Homepage Header Component
 * Premium design with animated greeting, glowing streak, and refined profile button
 */
export const Header = ({
  userName,
  streakDays,
}: HeaderProps) => {
  const greeting = getGreetingData();

  return (
    <header
      style={{
        position: 'relative',
        padding: '24px 20px 20px',
        overflow: 'hidden',
      }}
    >
      <style>{`
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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.2); }
          50% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.4); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .header-greeting { animation: fadeInUp 0.5s ease-out; }
        .header-name { animation: fadeInUp 0.6s ease-out; }
        .streak-badge {
          animation: slideInRight 0.5s ease-out;
        }
        .streak-fire {
          animation: fireGlow 2s ease-in-out infinite;
          display: inline-block;
        }
        .streak-count {
          background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Decorative gradient orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '180px',
          height: '180px',
          background: 'radial-gradient(circle, rgba(216, 180, 254, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '-60px',
          width: '140px',
          height: '140px',
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Main header content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Greeting Section */}
        <div style={{ flex: 1 }}>
          <div
            className="header-greeting"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                lineHeight: 1,
              }}
            >
              {greeting.emoji}
            </span>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: AppColors.textSecondary,
                letterSpacing: '0.2px',
              }}
            >
              {greeting.text}
            </p>
          </div>
          <h1
            className="header-name"
            style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: '800',
              color: AppColors.textPrimary,
              letterSpacing: '-0.8px',
              lineHeight: 1.15,
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(216, 180, 254, 0.9) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {userName}
          </h1>
        </div>

        {/* Right side: Compact streak badge */}
        {streakDays > 0 && (
          <div
            className="streak-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.08) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              marginTop: '4px',
            }}
          >
            <span
              className="streak-fire"
              style={{
                fontSize: '16px',
                lineHeight: 1,
              }}
            >
              {'\u{1F525}'}
            </span>
            <span
              className="streak-count"
              style={{
                fontSize: '15px',
                fontWeight: '700',
                letterSpacing: '-0.3px',
              }}
            >
              {streakDays}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
