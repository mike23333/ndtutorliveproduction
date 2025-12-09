import React from 'react';
import { AppColors } from '../../theme/colors';
import { SparklesIcon } from '../../theme/icons';
import { ClassPulseAlert } from './ClassPulseAlert';
import type { ClassPulseInsight } from '../../types/dashboard';

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

  return (
    <div style={{ marginBottom: 'clamp(20px, 5vw, 28px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(12px, 3vw, 16px)' }}>
        <h2
          style={{
            fontSize: 'clamp(16px, 3.5vw, 18px)',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Class Pulse
        </h2>
        <button
          onClick={onGenerate}
          disabled={isDisabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(4px, 1vw, 6px)',
            background: AppColors.surfaceLight,
            border: `1px solid ${AppColors.borderColor}`,
            borderRadius: 'clamp(6px, 1.5vw, 8px)',
            padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 14px)',
            color: isDisabled ? AppColors.textSecondary : AppColors.accentPurple,
            fontSize: 'clamp(11px, 2.2vw, 12px)',
            fontWeight: 500,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          <SparklesIcon size={14} />
          {generating ? 'Generating...' : 'Refresh Insights'}
        </button>
      </div>

      {loading ? (
        <div
          style={{
            background: AppColors.surfaceLight,
            borderRadius: 'clamp(8px, 2vw, 10px)',
            padding: 'clamp(20px, 5vw, 28px)',
            textAlign: 'center',
            color: AppColors.textSecondary,
          }}
        >
          Loading insights...
        </div>
      ) : insights.length > 0 ? (
        <>
          {insights.map((insight, index) => (
            <ClassPulseAlert
              key={`pulse-${index}-${insight.title.slice(0, 10)}`}
              type={insight.type}
              title={insight.title}
              message={insight.message}
            />
          ))}
          {lastGenerated && (
            <p style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: AppColors.textSecondary, margin: 'clamp(8px, 2vw, 10px) 0 0 0' }}>
              Last updated: {new Date(lastGenerated).toLocaleString()}
            </p>
          )}
        </>
      ) : (
        <div
          style={{
            background: AppColors.surfaceLight,
            borderRadius: 'clamp(8px, 2vw, 10px)',
            padding: 'clamp(16px, 4vw, 24px)',
            textAlign: 'center',
          }}
        >
          <div style={{ color: AppColors.textSecondary, marginBottom: 'clamp(8px, 2vw, 10px)' }}>
            <SparklesIcon size={32} />
          </div>
          <p style={{ fontSize: 'clamp(13px, 2.8vw, 14px)', color: AppColors.textSecondary, margin: 0 }}>
            No insights yet. Click "Refresh Insights" to generate AI-powered observations about your class.
          </p>
        </div>
      )}
    </div>
  );
};
