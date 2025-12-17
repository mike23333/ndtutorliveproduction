import { AppColors } from '../../theme/colors';
import { CheckCircleIcon, ClockIcon, XIcon } from '../../theme/icons';
import { LessonWithCompletion } from './AssignmentGrid';

interface AllLessonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: LessonWithCompletion[];
  teacherName: string;
  onLessonClick: (lesson: LessonWithCompletion) => void;
}

/**
 * Get level badge colors based on CEFR level
 */
const getLevelColors = (level: string) => {
  const l = level.toUpperCase();
  if (l === 'A1' || l === 'A2') {
    return { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80' };
  }
  if (l === 'B1' || l === 'B2') {
    return { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' };
  }
  if (l === 'C1' || l === 'C2') {
    return { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171' };
  }
  return { bg: 'rgba(216, 180, 254, 0.15)', text: '#d8b4fe' };
};

/**
 * Format the created date in a friendly way
 */
const formatCreatedDate = (date: Date | { toDate: () => Date } | undefined): string => {
  if (!date) return '';

  const d = typeof date === 'object' && 'toDate' in date ? date.toDate() : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  // Show day of week for lessons within 2 weeks
  if (diffDays < 14) {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Otherwise show date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * LessonListItem - Premium list item for the modal
 */
const LessonListItem = ({
  lesson,
  onClick,
  index,
}: {
  lesson: LessonWithCompletion;
  onClick: () => void;
  index: number;
}) => {
  const levelColors = getLevelColors(lesson.level);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 16px',
        borderRadius: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${lesson.completed ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.06)'}`,
        cursor: 'pointer',
        transition: 'all 200ms ease',
        animation: `fadeSlideUp 0.3s ease-out ${index * 0.04}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {lesson.image ? (
          <img
            src={lesson.image}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: lesson.completed ? 'grayscale(20%) brightness(0.85)' : 'none',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${AppColors.accent}30 0%, ${AppColors.accentBlue}30 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}
          >
            {'\u{1F4DA}'}
          </div>
        )}
        {/* Completed overlay */}
        {lesson.completed && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleIcon size={20} color={AppColors.success} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: '600',
            color: lesson.completed ? AppColors.textSecondary : AppColors.textPrimary,
            letterSpacing: '-0.2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {lesson.title}
        </h4>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ClockIcon size={12} color={AppColors.textMuted} />
            <span
              style={{
                fontSize: '12px',
                color: AppColors.textMuted,
                fontWeight: '500',
              }}
            >
              {lesson.duration}
            </span>
          </div>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '5px',
              fontSize: '10px',
              fontWeight: '700',
              backgroundColor: levelColors.bg,
              color: levelColors.text,
              letterSpacing: '0.3px',
            }}
          >
            {lesson.level}
          </span>
          {lesson.createdAt && (
            <>
              <span style={{ color: AppColors.textMuted, fontSize: '10px' }}>•</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: AppColors.textMuted,
                }}
              >
                {formatCreatedDate(lesson.createdAt)}
              </span>
            </>
          )}
          {lesson.completed && (
            <>
              <span style={{ color: AppColors.textMuted, fontSize: '10px' }}>•</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: AppColors.success,
                }}
              >
                Done
              </span>
            </>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={AppColors.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
};

/**
 * AllLessonsModal - Full-screen modal showing all lessons
 */
export const AllLessonsModal = ({
  isOpen,
  onClose,
  lessons,
  teacherName,
  onLessonClick,
}: AllLessonsModalProps) => {
  if (!isOpen) return null;

  const completedCount = lessons.filter((l) => l.completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: AppColors.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .all-lessons-scroll::-webkit-scrollbar {
          display: none;
        }
        .all-lessons-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          borderBottom: `1px solid ${AppColors.borderColor}`,
          backgroundColor: AppColors.bgPrimary,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '700',
                color: AppColors.textPrimary,
                letterSpacing: '-0.4px',
              }}
            >
              Your Lessons
            </h1>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                color: AppColors.textSecondary,
              }}
            >
              From {teacherName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: AppColors.textPrimary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: '3px',
                background: completedCount > 0
                  ? 'linear-gradient(90deg, #4ADE80 0%, #22C55E 100%)'
                  : 'transparent',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: completedCount > 0 ? AppColors.success : AppColors.textMuted,
              minWidth: '70px',
              textAlign: 'right',
            }}
          >
            {completedCount}/{lessons.length} done
          </span>
        </div>
      </div>

      {/* Lessons list */}
      <div
        className="all-lessons-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          {lessons.map((lesson, index) => (
            <LessonListItem
              key={lesson.id || `lesson-${index}`}
              lesson={lesson}
              index={index}
              onClick={() => {
                // Show lesson preview modal - don't close AllLessonsModal yet
                // It will close when user starts the lesson or navigates away
                onLessonClick(lesson);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
