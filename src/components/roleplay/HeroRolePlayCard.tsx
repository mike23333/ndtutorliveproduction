/**
 * HeroRolePlayCard - Premium Featured Card
 * Glass-morphic design with animated gradient mesh and floating particles
 */

import { AppColors, radius } from '../../theme/colors';

interface HeroRolePlayCardProps {
  onStartRandom: () => void;
  totalLessons: number;
  disabled?: boolean;
}

export const HeroRolePlayCard = ({
  onStartRandom,
  totalLessons,
  disabled,
}: HeroRolePlayCardProps) => {
  return (
    <div
      className="hero-card"
      onClick={disabled ? undefined : onStartRandom}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => !disabled && e.key === 'Enter' && onStartRandom()}
      style={{
        margin: '0 20px 24px',
        borderRadius: radius.xxl + 4,
        overflow: 'hidden',
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-15px) scale(1.1); opacity: 0.9; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 24px rgba(216, 180, 254, 0.3); }
          50% { box-shadow: 0 0 40px rgba(216, 180, 254, 0.5); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-card {
          transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms ease;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.5s ease-out;
        }
        .hero-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(216, 180, 254, 0.15);
        }
        .hero-card:active {
          transform: translateY(-2px);
        }
        .hero-btn {
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .hero-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 12px 32px rgba(216, 180, 254, 0.5) !important;
        }
        .particle {
          animation: floatParticle 5s ease-in-out infinite;
        }
        .hero-content {
          animation: slideUp 0.6s ease-out;
        }
      `}</style>

      {/* Animated gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg,
            ${AppColors.bgPrimary}f5 0%,
            rgba(91, 33, 182, 0.35) 40%,
            rgba(96, 165, 250, 0.15) 70%,
            ${AppColors.bgPrimary}f0 100%)`,
          backgroundSize: '200% 200%',
          animation: 'gradientShift 8s ease infinite',
        }}
      />

      {/* Glass overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      />

      {/* Floating particles */}
      <div
        className="particle"
        style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: 'rgba(216, 180, 254, 0.7)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="particle"
        style={{
          position: 'absolute',
          top: '55%',
          right: '8%',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'rgba(96, 165, 250, 0.6)',
          pointerEvents: 'none',
          animationDelay: '1.5s',
        }}
      />
      <div
        className="particle"
        style={{
          position: 'absolute',
          top: '35%',
          right: '25%',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: 'rgba(251, 191, 36, 0.5)',
          pointerEvents: 'none',
          animationDelay: '3s',
        }}
      />

      {/* Radial gradient accent */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-20%',
          width: '60%',
          height: '100%',
          background: 'radial-gradient(ellipse, rgba(216, 180, 254, 0.15) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Border glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius.xxl + 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
        }}
      />

      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(216, 180, 254, 0.4) 50%, transparent 100%)',
          borderRadius: '1px',
        }}
      />

      {/* Content */}
      <div
        className="hero-content"
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '28px 24px',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(216, 180, 254, 0.2) 0%, rgba(216, 180, 254, 0.1) 100%)',
            border: '1px solid rgba(216, 180, 254, 0.25)',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: AppColors.accent,
              boxShadow: '0 0 8px rgba(216, 180, 254, 0.7)',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: AppColors.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Quick Start
          </span>
        </div>

        {/* Title */}
        <h2
          style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: AppColors.textPrimary,
            letterSpacing: '-0.5px',
          }}
        >
          Random Scenario
        </h2>

        {/* Subtitle */}
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '15px',
            color: AppColors.textSecondary,
            lineHeight: 1.4,
          }}
        >
          Jump into any of {totalLessons} practice scenarios
        </p>

        {/* CTA Button */}
        <button
          className="hero-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onStartRandom();
          }}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #d8b4fe 0%, #c084fc 50%, #a855f7 100%)',
            color: '#1a0a2e',
            fontSize: '16px',
            fontWeight: '700',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Button inner glow */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 0%, transparent 100%)',
              pointerEvents: 'none',
              borderRadius: '16px 16px 0 0',
            }}
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ position: 'relative' }}
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <span style={{ position: 'relative' }}>Start Random</span>
        </button>
      </div>
    </div>
  );
};
