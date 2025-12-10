import React from 'react';
import { AppColors } from '../../theme/colors';
import type { ClassMistakesData, MistakeErrorType } from '../../types/dashboard';

interface CommonMistakesSectionProps {
  data: ClassMistakesData | null;
  loading: boolean;
  onSeeAll: () => void;
}

const ERROR_TYPE_COLORS: Record<MistakeErrorType, string> = {
  Grammar: '#FF6B81',
  Pronunciation: '#A855F7',
  Vocabulary: '#60A5FA',
  Cultural: '#FBBF24',
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
          background: AppColors.surfaceLight,
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          color: AppColors.textSecondary,
          fontSize: '15px',
        }}
      >
        Loading...
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
        background: AppColors.surfaceLight,
        borderRadius: '16px',
        padding: '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '20px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '17px',
              fontWeight: 600,
              margin: 0,
              color: AppColors.textPrimary,
            }}
          >
            Mistakes
          </h3>
          {totalMistakes > 0 && (
            <p
              style={{
                fontSize: '13px',
                color: AppColors.textSecondary,
                margin: '4px 0 0 0',
              }}
            >
              {totalMistakes} this period
            </p>
          )}
        </div>
        {totalMistakes > 0 && (
          <button
            onClick={onSeeAll}
            style={{
              background: 'transparent',
              border: 'none',
              color: AppColors.accentPurple,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            View all
          </button>
        )}
      </div>

      {totalMistakes === 0 ? (
        <p
          style={{
            fontSize: '15px',
            color: AppColors.textSecondary,
            margin: 0,
            textAlign: 'center',
            padding: '16px 0',
          }}
        >
          No mistakes this period
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {errorTypes.map((type) => {
            const count = summary[type];
            if (count === 0) return null;

            const barWidth = (count / maxCount) * 100;
            const color = ERROR_TYPE_COLORS[type];

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
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: AppColors.textPrimary,
                    }}
                  >
                    {type}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: color,
                    }}
                  >
                    {count}
                  </span>
                </div>

                {/* Simple bar */}
                <div
                  style={{
                    height: '4px',
                    background: AppColors.surfaceMedium,
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: color,
                      borderRadius: '2px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
