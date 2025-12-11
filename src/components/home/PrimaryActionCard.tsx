import { AppColors } from '../../theme/colors';
import { PlayIcon } from '../../theme/icons';
import { ReviewLessonDocument } from '../../types/firestore';
import { LessonWithCompletion } from './AssignmentGrid';

interface CurrentLessonInfo {
  missionId: string;
  title: string;
  imageUrl?: string;
}

interface PrimaryActionCardProps {
  inProgressLesson?: CurrentLessonInfo | null;
  weeklyReview?: ReviewLessonDocument | null;
  nextAssignment?: LessonWithCompletion | null;
  smartDefault?: LessonWithCompletion | null;
  userLevel?: string;
  onContinue?: () => void;
  onReview?: () => void;
  onStartAssignment?: (lesson: LessonWithCompletion) => void;
  onStartDefault?: (lesson: LessonWithCompletion) => void;
}

type ActionType = 'continue' | 'review' | 'assignment' | 'default';

interface ActionConfig {
  type: ActionType;
  label: string;
  subtitle: string;
  progress?: number;
  onClick: () => void;
  imageUrl?: string | null;
}

/**
 * Continue Learning Card
 * Vibrant gradient style matching the new design system
 */
export const PrimaryActionCard = ({
  inProgressLesson,
  weeklyReview,
  nextAssignment,
  smartDefault,
  onContinue,
  onReview,
  onStartAssignment,
  onStartDefault,
}: PrimaryActionCardProps) => {
  // Determine which action to show based on priority
  const getActionConfig = (): ActionConfig | null => {
    if (inProgressLesson && onContinue) {
      return {
        type: 'continue',
        label: inProgressLesson.title,
        subtitle: 'Continue where you left off',
        progress: 65, // Could be passed in from props
        onClick: onContinue,
        imageUrl: inProgressLesson.imageUrl,
      };
    }

    if (weeklyReview && weeklyReview.status === 'ready' && onReview) {
      return {
        type: 'review',
        label: 'Weekly Review',
        subtitle: `${weeklyReview.struggleWords?.length || 0} words to practice`,
        onClick: onReview,
      };
    }

    if (nextAssignment && onStartAssignment) {
      return {
        type: 'assignment',
        label: nextAssignment.title,
        subtitle: `${nextAssignment.duration} · ${nextAssignment.level}`,
        onClick: () => onStartAssignment(nextAssignment),
        imageUrl: nextAssignment.image,
      };
    }

    if (smartDefault && onStartDefault) {
      return {
        type: 'default',
        label: smartDefault.title,
        subtitle: `${smartDefault.duration} · ${smartDefault.level}`,
        onClick: () => onStartDefault(smartDefault),
        imageUrl: smartDefault.image,
      };
    }

    return null;
  };

  const action = getActionConfig();

  if (!action) {
    return (
      <div
        style={{
          margin: '0 20px 24px',
          padding: '32px 24px',
          borderRadius: '16px',
          backgroundColor: AppColors.bgTertiary,
          border: `1px solid ${AppColors.borderColor}`,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '15px',
            color: AppColors.textSecondary,
            lineHeight: 1.5,
          }}
        >
          No lessons available yet.
          <br />
          Ask your teacher to assign some!
        </p>
      </div>
    );
  }

  return (
    <div
      onClick={action.onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && action.onClick()}
      style={{
        margin: '0 20px 24px',
        padding: '16px',
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${AppColors.accentPurple}22 0%, ${AppColors.accentBlue}22 100%)`,
        border: `1px solid ${AppColors.accentPurple}44`,
        cursor: 'pointer',
        transition: 'all 200ms ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Thumbnail image */}
        {action.imageUrl ? (
          <img
            src={action.imageUrl}
            alt={action.label}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              backgroundColor: AppColors.surfaceMedium,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PlayIcon size={24} />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type label */}
          <p
            style={{
              margin: '0 0 4px 0',
              fontSize: '11px',
              color: AppColors.accentPurple,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {action.type === 'continue'
              ? 'Continue Learning'
              : action.type === 'review'
                ? 'Review Ready'
                : 'Up Next'}
          </p>

          {/* Title */}
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: AppColors.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {action.label}
          </h3>

          {/* Progress bar (for continue type) */}
          {action.type === 'continue' && action.progress !== undefined ? (
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${action.progress}%`,
                  height: '100%',
                  backgroundColor: AppColors.success,
                  borderRadius: '2px',
                }}
              />
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: AppColors.textSecondary,
              }}
            >
              {action.subtitle}
            </p>
          )}
        </div>

        {/* Play button */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: AppColors.accentPurple,
            color: AppColors.textDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <PlayIcon size={18} />
        </div>
      </div>
    </div>
  );
};
