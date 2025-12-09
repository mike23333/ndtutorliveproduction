import { AppColors } from '../../theme/colors';
import { PlayIcon, SparklesIcon } from '../../theme/icons';
import { ReviewLessonDocument } from '../../types/firestore';
import { LessonWithCompletion } from './AssignmentGrid';

interface CurrentLessonInfo {
  missionId: string;
  title: string;
  imageUrl?: string;
}

interface PrimaryActionCardProps {
  /** In-progress lesson from currentLesson field */
  inProgressLesson?: CurrentLessonInfo | null;
  /** Weekly review when available */
  weeklyReview?: ReviewLessonDocument | null;
  /** First incomplete assignment */
  nextAssignment?: LessonWithCompletion | null;
  /** Smart default lesson if nothing else */
  smartDefault?: LessonWithCompletion | null;
  /** User's proficiency level */
  userLevel?: string;
  /** Callbacks for different action types */
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
  icon: React.ReactNode;
  gradientColors: [string, string];
  onClick: () => void;
}

/**
 * Smart primary action card that shows the most relevant action:
 * 1. Continue Practice (if in-progress lesson exists)
 * 2. Weekly Review (if available)
 * 3. Start Assignment (first incomplete)
 * 4. Start Practice (smart default)
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
    // Priority 1: Continue in-progress lesson
    if (inProgressLesson && onContinue) {
      return {
        type: 'continue',
        label: 'Continue Practice',
        subtitle: inProgressLesson.title,
        icon: <PlayIcon size={20} />,
        gradientColors: [AppColors.accentPurple, AppColors.accentBlue],
        onClick: onContinue,
      };
    }

    // Priority 2: Weekly review
    if (weeklyReview && weeklyReview.status === 'ready' && onReview) {
      return {
        type: 'review',
        label: 'Weekly Review',
        subtitle: `Practice ${weeklyReview.struggleWords?.length || 0} words from this week`,
        icon: <SparklesIcon size={20} />,
        gradientColors: ['#fbbf24', '#f59e0b'],
        onClick: onReview,
      };
    }

    // Priority 3: First incomplete assignment
    if (nextAssignment && onStartAssignment) {
      return {
        type: 'assignment',
        label: `Start: ${nextAssignment.title}`,
        subtitle: `${nextAssignment.level} • ${nextAssignment.duration}`,
        icon: <PlayIcon size={20} />,
        gradientColors: [AppColors.accentPurple, '#8b5cf6'],
        onClick: () => onStartAssignment(nextAssignment),
      };
    }

    // Priority 4: Smart default
    if (smartDefault && onStartDefault) {
      return {
        type: 'default',
        label: 'Start Practice',
        subtitle: smartDefault.title,
        icon: <PlayIcon size={20} />,
        gradientColors: [AppColors.accentBlue, '#3b82f6'],
        onClick: () => onStartDefault(smartDefault),
      };
    }

    return null;
  };

  const action = getActionConfig();

  if (!action) {
    // No lessons available
    return (
      <div
        style={{
          margin: '0 clamp(16px, 4vw, 24px) clamp(16px, 4vw, 20px)',
          padding: 'clamp(16px, 4vw, 24px)',
          borderRadius: '16px',
          backgroundColor: AppColors.surfaceMedium,
          border: `1px solid ${AppColors.borderColor}`,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: AppColors.textSecondary,
          }}
        >
          No lessons available yet. Ask your teacher to create some!
        </p>
      </div>
    );
  }

  // Get image URL for continue type
  const imageUrl = action.type === 'continue' && inProgressLesson?.imageUrl
    ? inProgressLesson.imageUrl
    : action.type === 'assignment' && nextAssignment?.image
    ? nextAssignment.image
    : action.type === 'default' && smartDefault?.image
    ? smartDefault.image
    : null;

  return (
    <div
      onClick={action.onClick}
      style={{
        margin: '0 clamp(16px, 4vw, 24px) clamp(16px, 4vw, 20px)',
        padding: 'clamp(12px, 3vw, 18px)',
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${action.gradientColors[0]}22 0%, ${action.gradientColors[1]}22 100%)`,
        border: `1px solid ${action.gradientColors[0]}44`,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(10px, 2.5vw, 14px)',
        }}
      >
        {/* Image thumbnail or Icon */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            style={{
              width: 'clamp(50px, 15vw, 70px)',
              height: 'clamp(50px, 15vw, 70px)',
              borderRadius: '12px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 'clamp(50px, 15vw, 70px)',
              height: 'clamp(50px, 15vw, 70px)',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${action.gradientColors[0]} 0%, ${action.gradientColors[1]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: AppColors.textDark,
              flexShrink: 0,
            }}
          >
            {action.icon}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: '0 0 4px 0',
              fontSize: 'clamp(10px, 2.5vw, 12px)',
              fontWeight: '700',
              color: action.gradientColors[0],
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {action.type === 'continue' ? 'CONTINUE' : action.type === 'review' ? 'READY FOR YOU' : 'RECOMMENDED'}
          </p>
          <h3
            style={{
              margin: '0 0 4px 0',
              fontSize: 'clamp(15px, 4vw, 18px)',
              fontWeight: '600',
              color: AppColors.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {action.label}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: AppColors.textSecondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {action.subtitle}
          </p>
        </div>

        {/* Play button */}
        <div
          style={{
            width: 'clamp(36px, 10vw, 48px)',
            height: 'clamp(36px, 10vw, 48px)',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${action.gradientColors[0]} 0%, ${action.gradientColors[1]} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: AppColors.textDark,
            flexShrink: 0,
          }}
        >
          <PlayIcon size={16} />
        </div>
      </div>

      {/* Progress bar for continue type - matches original ContinueLearningCard */}
      {action.type === 'continue' && (
        <div
          style={{
            marginTop: '8px',
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '65%',
              height: '100%',
              backgroundColor: AppColors.successGreen,
              borderRadius: '2px',
            }}
          />
        </div>
      )}
    </div>
  );
};
