import { AppColors, radius } from '../../theme/colors';
import { IllustrationPlaceholder } from './IllustrationPlaceholder';

export type ScenarioType = 'Scenario' | 'Task' | 'Discussion';
export type LevelKey = 'beginner' | 'pre-intermediate' | 'intermediate' | 'upper-intermediate';

interface ScenarioItemProps {
  title: string;
  type: ScenarioType;
  level: LevelKey;
  illustration: string;
  completed?: boolean;
  onClick?: () => void;
}

const levelStyles: Record<LevelKey, { bg: string; color: string; border: string }> = {
  beginner: {
    bg: 'rgba(96, 165, 250, 0.15)',
    color: AppColors.accentBlue,
    border: 'rgba(96, 165, 250, 0.3)',
  },
  'pre-intermediate': {
    bg: 'rgba(74, 222, 128, 0.15)',
    color: AppColors.success,
    border: 'rgba(74, 222, 128, 0.3)',
  },
  intermediate: {
    bg: 'rgba(251, 191, 36, 0.15)',
    color: AppColors.warning,
    border: 'rgba(251, 191, 36, 0.3)',
  },
  'upper-intermediate': {
    bg: 'rgba(248, 113, 113, 0.15)',
    color: AppColors.error,
    border: 'rgba(248, 113, 113, 0.3)',
  },
};

function TypeIcon({ type }: { type: ScenarioType }) {
  if (type === 'Scenario') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 9h6M9 13h6M9 17h4" />
      </svg>
    );
  }
  if (type === 'Task') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  // Discussion
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function formatLevel(level: LevelKey): string {
  return level
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function ScenarioItem({
  title,
  type,
  level,
  illustration,
  completed = false,
  onClick,
}: ScenarioItemProps) {
  const style = levelStyles[level];

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: AppColors.bgTertiary,
        borderRadius: radius.lg,
        padding: '12px',
        display: 'flex',
        gap: '14px',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: `1px solid ${AppColors.borderColor}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.boxShadow = `0 4px 16px rgba(0, 0, 0, 0.2)`;
        e.currentTarget.style.borderColor = AppColors.borderHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = AppColors.borderColor;
      }}
    >
      <div style={{ position: 'relative' }}>
        <IllustrationPlaceholder type={illustration} size="small" />
        {completed && (
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: AppColors.success,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${AppColors.bgTertiary}`,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: '600',
            fontSize: '15px',
            color: AppColors.textPrimary,
            marginBottom: '6px',
            lineHeight: '1.3',
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: AppColors.textSecondary,
            fontSize: '13px',
            marginBottom: '10px',
          }}
        >
          <TypeIcon type={type} />
          <span>{type}</span>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: style.bg,
            color: style.color,
            border: `1px solid ${style.border}`,
          }}
        >
          {formatLevel(level)}
        </div>
      </div>
    </div>
  );
}
