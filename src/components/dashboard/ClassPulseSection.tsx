import React from 'react';
import { AppColors } from '../../theme/colors';
import { SparklesIcon } from '../../theme/icons';
import { ClassPulseAlert } from './ClassPulseAlert';
import type { ClassPulseInsight } from '../../types/dashboard';

// Animated spinner
const Spinner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: '2px solid rgba(139, 92, 246, 0.2)',
      borderTopColor: AppColors.accentPurple,
      animation: 'spin 0.8s linear infinite',
    }}
  />
);

// Animated dots for generating state
const AnimatedDots: React.FC = () => (
  <span style={{ display: 'inline-flex', gap: '4px' }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: AppColors.accentPurple,
          animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
        }}
      />
    ))}
  </span>
);

interface ClassPulseSectionProps {
  insights: ClassPulseInsight[];
  loading: boolean;
  generating: boolean;
  lastGenerated: string | null;
  onGenerate: () => void;
}

export const ClassPulseSection: React.FC<ClassPulseSectionProps> = ({
  insights,
  loading,
  generating,
  lastGenerated,
  onGenerate,
}) => {
  const isDisabled = generating || loading;

  const formatLastGenerated = (isoString: string | null): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ marginBottom: 'clamp(20px, 5vw, 28px)' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Section Card */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 'clamp(16px, 4vw, 20px)',
          padding: 'clamp(18px, 4.5vw, 24px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: generating || loading ? 0 : (insights.length > 0 ? 'clamp(16px, 4vw, 20px)' : 0),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(96, 165, 250, 0.2) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <SparklesIcon size={18} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 'clamp(15px, 3.5vw, 17px)',
                  fontWeight: 600,
                  margin: 0,
                  color: AppColors.textPrimary,
                }}
              >
                AI Insights
              </h2>
              {lastGenerated && !generating && (
                <p
                  style={{
                    fontSize: 'clamp(11px, 2.2vw, 12px)',
                    color: AppColors.textMuted,
                    margin: '2px 0 0 0',
                  }}
                >
                  Updated {formatLastGenerated(lastGenerated)}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={isDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: generating
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(96, 165, 250, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: generating
                ? '1px solid rgba(139, 92, 246, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'clamp(8px, 2vw, 10px)',
              padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)',
              color: generating ? AppColors.accentPurple : AppColors.textSecondary,
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              fontWeight: 500,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {generating ? (
              <>
                <Spinner size={14} />
                <span>Analyzing</span>
                <AnimatedDots />
              </>
            ) : (
              <>
                <SparklesIcon size={14} />
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>

        {/* Content States */}
        {generating ? (
          <div
            style={{
              padding: 'clamp(32px, 8vw, 48px) clamp(16px, 4vw, 24px)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 16px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(96, 165, 250, 0.15) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <Spinner size={24} />
            </div>
            <p
              style={{
                fontSize: 'clamp(14px, 3vw, 15px)',
                fontWeight: 500,
                color: AppColors.textPrimary,
                margin: '0 0 6px 0',
              }}
            >
              Analyzing your class
            </p>
            <p
              style={{
                fontSize: 'clamp(12px, 2.5vw, 13px)',
                color: AppColors.textMuted,
                margin: 0,
              }}
            >
              Reviewing student performance and patterns...
            </p>
          </div>
        ) : loading ? (
          <div
            style={{
              padding: 'clamp(24px, 6vw, 32px)',
              textAlign: 'center',
            }}
          >
            <Spinner size={24} />
            <p
              style={{
                fontSize: 'clamp(13px, 2.8vw, 14px)',
                color: AppColors.textSecondary,
                margin: '12px 0 0 0',
              }}
            >
              Loading insights...
            </p>
          </div>
        ) : insights.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.5vw, 12px)' }}>
            {insights.map((insight, index) => (
              <ClassPulseAlert
                key={`pulse-${index}-${insight.title.slice(0, 10)}`}
                type={insight.type}
                title={insight.title}
                message={insight.message}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: 'clamp(28px, 7vw, 40px) clamp(16px, 4vw, 24px)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 16px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <SparklesIcon size={24} />
            </div>
            <p
              style={{
                fontSize: 'clamp(14px, 3vw, 15px)',
                fontWeight: 500,
                color: AppColors.textPrimary,
                margin: '0 0 6px 0',
              }}
            >
              No insights yet
            </p>
            <p
              style={{
                fontSize: 'clamp(12px, 2.5vw, 13px)',
                color: AppColors.textMuted,
                margin: '0 0 16px 0',
              }}
            >
              Generate AI-powered observations about your class performance
            </p>
            <button
              onClick={onGenerate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(96, 165, 250, 0.2) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 'clamp(8px, 2vw, 10px)',
                padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                color: AppColors.textPrimary,
                fontSize: 'clamp(13px, 2.8vw, 14px)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <SparklesIcon size={16} />
              Generate Insights
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
