import React from 'react';
import { AppColors } from '../../theme/colors';
import type { ClassMistakesData, MistakeErrorType } from '../../types/dashboard';

interface CommonMistakesSectionProps {
  data: ClassMistakesData | null;
  loading: boolean;
  onSeeAll: () => void;
}

const ERROR_TYPE_CONFIG: Record<MistakeErrorType, { color: string; icon: string; description: string }> = {
  Grammar: { color: '#FF6B81', icon: '✏️', description: 'Sentence structure & rules' },
  Pronunciation: { color: '#A855F7', icon: '🗣️', description: 'Sound & accent' },
  Vocabulary: { color: '#60A5FA', icon: '📚', description: 'Word choice & meaning' },
  Cultural: { color: '#FBBF24', icon: '🌍', description: 'Context & usage' },
};

// Donut chart component for visual breakdown
const MistakeDonut: React.FC<{ summary: Record<MistakeErrorType, number>; total: number }> = ({
  summary,
  total,
}) => {
  if (total === 0) return null;

  const errorTypes: MistakeErrorType[] = ['Grammar', 'Pronunciation', 'Vocabulary', 'Cultural'];
  let cumulativePercent = 0;

  return (
    <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke={AppColors.surfaceMedium}
          strokeWidth="3"
        />
        {/* Segments */}
        {errorTypes.map((type) => {
          const count = summary[type] || 0;
          if (count === 0) return null;
          const percent = (count / total) * 100;
          const dashArray = `${percent} ${100 - percent}`;
          const dashOffset = -cumulativePercent;
          cumulativePercent += percent;

          return (
            <circle
              key={type}
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={ERROR_TYPE_CONFIG[type].color}
              strokeWidth="3"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          );
        })}
      </svg>
      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 700, color: AppColors.textPrimary }}>{total}</div>
        <div style={{ fontSize: '10px', color: AppColors.textSecondary, marginTop: '-2px' }}>total</div>
      </div>
    </div>
  );
};

export const CommonMistakesSection: React.FC<CommonMistakesSectionProps> = ({
  data,
  loading,
  onSeeAll,
}) => {
  if (loading) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 'clamp(16px, 4vw, 20px)',
          padding: 'clamp(20px, 5vw, 28px)',
          textAlign: 'center',
          color: AppColors.textSecondary,
          fontSize: 'clamp(14px, 3vw, 15px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: 'clamp(20px, 5vw, 28px)',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid rgba(139, 92, 246, 0.2)',
            borderTopColor: AppColors.accentPurple,
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading mistakes...
      </div>
    );
  }

  const summary = data?.summary || { Grammar: 0, Pronunciation: 0, Vocabulary: 0, Cultural: 0 };
  const totalMistakes = Object.values(summary).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(summary), 1);

  const errorTypes: MistakeErrorType[] = ['Grammar', 'Pronunciation', 'Vocabulary', 'Cultural'];

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 'clamp(16px, 4vw, 20px)',
        padding: 'clamp(20px, 5vw, 28px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        marginBottom: 'clamp(20px, 5vw, 28px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'clamp(16px, 4vw, 24px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🎯</span>
          <div>
            <h3
              style={{
                fontSize: 'clamp(15px, 3.5vw, 17px)',
                fontWeight: 600,
                margin: 0,
                color: AppColors.textPrimary,
              }}
            >
              Common Mistakes
            </h3>
            {totalMistakes > 0 && (
              <p
                style={{
                  fontSize: 'clamp(12px, 2.5vw, 13px)',
                  color: AppColors.textSecondary,
                  margin: '2px 0 0 0',
                }}
              >
                Areas where your students need practice
              </p>
            )}
          </div>
        </div>
        {totalMistakes > 0 && (
          <button
            onClick={onSeeAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(96, 165, 250, 0.15) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: 'clamp(8px, 2vw, 10px)',
              padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3.5vw, 16px)',
              color: AppColors.textPrimary,
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            View all
            <span style={{ fontSize: '12px' }}>→</span>
          </button>
        )}
      </div>

      {totalMistakes === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'clamp(24px, 6vw, 40px) clamp(16px, 4vw, 24px)',
            background: 'rgba(74, 222, 128, 0.08)',
            borderRadius: 'clamp(12px, 3vw, 16px)',
            border: '1px solid rgba(74, 222, 128, 0.15)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
          <p
            style={{
              fontSize: 'clamp(15px, 3.5vw, 16px)',
              fontWeight: 600,
              color: AppColors.success,
              margin: '0 0 4px 0',
            }}
          >
            No mistakes this period!
          </p>
          <p
            style={{
              fontSize: 'clamp(13px, 2.8vw, 14px)',
              color: AppColors.textSecondary,
              margin: 0,
            }}
          >
            Your students are doing great
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 'clamp(20px, 5vw, 28px)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Donut chart */}
          <MistakeDonut summary={summary} total={totalMistakes} />

          {/* Legend / Breakdown */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.5vw, 14px)' }}>
              {errorTypes.map((type) => {
                const count = summary[type];
                if (count === 0) return null;

                const config = ERROR_TYPE_CONFIG[type];
                const barWidth = (count / maxCount) * 100;
                const percentage = Math.round((count / totalMistakes) * 100);

                return (
                  <div key={type}>
                    {/* Type row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>{config.icon}</span>
                        <span
                          style={{
                            fontSize: 'clamp(13px, 2.8vw, 14px)',
                            fontWeight: 500,
                            color: AppColors.textPrimary,
                          }}
                        >
                          {type}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: 'clamp(11px, 2.2vw, 12px)',
                            color: AppColors.textSecondary,
                          }}
                        >
                          {percentage}%
                        </span>
                        <span
                          style={{
                            fontSize: 'clamp(14px, 3vw, 15px)',
                            fontWeight: 700,
                            color: config.color,
                            minWidth: '24px',
                            textAlign: 'right',
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div
                      style={{
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${barWidth}%`,
                          background: `linear-gradient(90deg, ${config.color} 0%, ${config.color}88 100%)`,
                          borderRadius: '3px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
