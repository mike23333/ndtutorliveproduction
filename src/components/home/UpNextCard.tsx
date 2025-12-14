/**
 * Up Next Card - Premium Hero Card
 * World-class immersive design with glass-morphism, animations, and depth
 */

import { AppColors } from '../../theme/colors';
import { PlayIcon, ClockIcon } from '../../theme/icons';
import { LessonWithCompletion } from './AssignmentGrid';

interface CurrentLessonInfo {
  missionId: string;
  title: string;
  imageUrl?: string;
}

interface UpNextCardProps {
  lesson: LessonWithCompletion | null;
  inProgressLesson?: CurrentLessonInfo | null;
  teacherName?: string;
  onContinue: () => void;
  onLessonClick?: (lesson: LessonWithCompletion) => void;
}

/**
 * Up Next Card - Premium hero card with immersive design
 * Features: animated gradient mesh, floating particles, smooth transitions
 */
export const UpNextCard = ({
  lesson,
  inProgressLesson,
  teacherName,
  onContinue,
  onLessonClick,
}: UpNextCardProps) => {
  const isInProgress = !!inProgressLesson;
  const displayTitle = isInProgress ? inProgressLesson?.title : lesson?.title;
  const displayImage = isInProgress ? inProgressLesson?.imageUrl : lesson?.image;

  const backgroundImage =
    displayImage ||
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop';

  const handleClick = () => {
    if (isInProgress) {
      onContinue();
    } else if (lesson && onLessonClick) {
      onLessonClick(lesson);
    } else {
      onContinue();
    }
  };

  if (!lesson && !inProgressLesson) {
    return (
      <div
        style={{
          margin: '0 20px 28px',
          padding: '48px 32px',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, rgba(216, 180, 254, 0.08) 0%, rgba(96, 165, 250, 0.06) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
          }
        `}</style>

        {/* Decorative gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-30%',
            right: '-20%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(216, 180, 254, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(216, 180, 254, 0.15) 0%, rgba(96, 165, 250, 0.1) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            animation: 'floatSlow 4s ease-in-out infinite',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {'\u{1F4DA}'}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: '16px',
            color: AppColors.textSecondary,
            lineHeight: 1.6,
            position: 'relative',
            zIndex: 1,
          }}
        >
          No lessons available yet.
          <br />
          <span style={{ color: AppColors.textMuted, fontSize: '14px' }}>
            Ask your teacher to assign some!
          </span>
        </p>
      </div>
    );
  }

  return (
    <div
      className="upnext-card"
      style={{
        margin: '0 20px 28px',
        borderRadius: '32px',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
          25% { transform: translateY(-20px) translateX(10px) scale(1.1); opacity: 0.8; }
          50% { transform: translateY(-10px) translateX(-5px) scale(0.95); opacity: 0.5; }
          75% { transform: translateY(-30px) translateX(15px) scale(1.05); opacity: 0.7; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(216, 180, 254, 0.3); }
          50% { box-shadow: 0 0 50px rgba(216, 180, 254, 0.5); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .upnext-card {
          transition: transform 350ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 350ms ease;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
        }
        .upnext-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(216, 180, 254, 0.2);
        }
        .upnext-card:active {
          transform: translateY(-2px) scale(1.005);
        }
        .upnext-btn {
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .upnext-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(216, 180, 254, 0.5) !important;
        }
        .upnext-content {
          animation: slideUp 0.6s ease-out;
        }
        .status-badge {
          animation: slideUp 0.4s ease-out;
        }
        .particle {
          animation: floatParticle 6s ease-in-out infinite;
        }
      `}</style>

      {/* Background image layer with enhanced blur */}
      <div
        style={{
          position: 'absolute',
          inset: '-30px',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(30px) saturate(1.3) brightness(0.8)',
          transform: 'scale(1.3)',
          opacity: 0.7,
        }}
      />

      {/* Animated gradient mesh overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(145deg,
              ${AppColors.bgPrimary}f0 0%,
              ${AppColors.gradientMid}cc 35%,
              rgba(96, 165, 250, 0.15) 65%,
              ${AppColors.bgPrimary}e6 100%
            )
          `,
          backgroundSize: '200% 200%',
          animation: 'gradientShift 8s ease infinite',
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
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'rgba(216, 180, 254, 0.6)',
          pointerEvents: 'none',
          animationDelay: '0s',
        }}
      />
      <div
        className="particle"
        style={{
          position: 'absolute',
          top: '60%',
          right: '25%',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'rgba(96, 165, 250, 0.5)',
          pointerEvents: 'none',
          animationDelay: '2s',
        }}
      />
      <div
        className="particle"
        style={{
          position: 'absolute',
          top: '40%',
          right: '8%',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: 'rgba(251, 191, 36, 0.5)',
          pointerEvents: 'none',
          animationDelay: '4s',
        }}
      />

      {/* Radial gradient accent */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-30%',
          width: '80%',
          height: '120%',
          background: 'radial-gradient(ellipse, rgba(216, 180, 254, 0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Border glow effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          pointerEvents: 'none',
        }}
      />

      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(216, 180, 254, 0.5) 50%, transparent 100%)',
          borderRadius: '1px',
        }}
      />

      {/* Content */}
      <div
        className="upnext-content"
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '200px',
        }}
      >
        {/* Top row: Status badge + Duration */}
        <div
          className="status-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              background: isInProgress
                ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(74, 222, 128, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(96, 165, 250, 0.1) 100%)',
              border: `1px solid ${isInProgress ? 'rgba(74, 222, 128, 0.3)' : 'rgba(96, 165, 250, 0.3)'}`,
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isInProgress ? '#4ade80' : '#60a5fa',
                boxShadow: isInProgress
                  ? '0 0 8px rgba(74, 222, 128, 0.7)'
                  : '0 0 8px rgba(96, 165, 250, 0.7)',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: isInProgress ? '#4ade80' : '#60a5fa',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {isInProgress ? 'Continue' : 'Up Next'}
            </span>
          </div>

          {/* Duration pill - moved to top right */}
          {lesson && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <ClockIcon size={12} color={AppColors.textSecondary} />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: AppColors.textSecondary,
                }}
              >
                {lesson.duration}
              </span>
            </div>
          )}
        </div>

        {/* Teacher attribution */}
        {teacherName && (
          <p
            style={{
              margin: '0 0 6px 0',
              fontSize: '12px',
              fontWeight: '500',
              color: AppColors.textMuted,
            }}
          >
            From {teacherName}
          </p>
        )}

        {/* Lesson title - responsive sizing */}
        <h2
          style={{
            margin: '0 0 auto 0',
            fontSize: '22px',
            fontWeight: '700',
            color: AppColors.textPrimary,
            lineHeight: 1.25,
            letterSpacing: '-0.4px',
            wordBreak: 'break-word',
          }}
        >
          {displayTitle}
        </h2>

        {/* Bottom: Full-width action button */}
        <button
          className="upnext-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px 24px',
            marginTop: '20px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #d8b4fe 0%, #c084fc 50%, #a855f7 100%)',
            color: '#1a0a2e',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            letterSpacing: '-0.2px',
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
              borderRadius: '14px 14px 0 0',
            }}
          />
          <PlayIcon size={16} />
          <span style={{ position: 'relative' }}>
            {isInProgress ? 'Continue Lesson' : 'Start Lesson'}
          </span>
        </button>
      </div>
    </div>
  );
};
