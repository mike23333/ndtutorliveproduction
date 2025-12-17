import { AppColors } from '../../theme/colors';
import { CompactLessonCard } from './CompactLessonCard';
import { ChevronRightIcon } from '../../theme/icons';

export interface LessonWithCompletion {
  id: string;
  title: string;
  level: string;
  duration: string;
  durationMinutes?: number;
  completed: boolean;
  completedAt?: Date;
  createdAt?: Date | { toDate: () => Date };
  systemPrompt?: string;
  functionCallingEnabled?: boolean;
  functionCallingInstructions?: string;
  tone?: string;
  image?: string;
  teacherId?: string;
  isFirstLesson?: boolean;
  tasks?: Array<{ id: string; text: string }>;
}

interface AssignmentGridProps {
  teacherName: string;
  lessons: LessonWithCompletion[];
  maxVisible?: number;
  onLessonClick: (lesson: LessonWithCompletion) => void;
  onSeeAll: () => void;
}

/**
 * AssignmentGrid - Premium horizontal lesson scroll
 * Glass-morphic design matching Progress page aesthetic
 */
export const AssignmentGrid = ({
  teacherName,
  lessons,
  maxVisible,
  onLessonClick,
  onSeeAll,
}: AssignmentGridProps) => {
  // Show all lessons in horizontal scroll, or limit if maxVisible specified
  const visibleLessons = maxVisible ? lessons.slice(0, maxVisible) : lessons;
  const completedCount = lessons.filter((l) => l.completed).length;

  if (lessons.length === 0) {
    return null;
  }

  return (
    <section style={{ marginBottom: '24px' }}>
      <style>{`
        .see-all-btn {
          transition: all 200ms ease;
        }
        .see-all-btn:hover {
          background-color: rgba(216, 180, 254, 0.12) !important;
        }
        .lessons-scroll::-webkit-scrollbar {
          display: none;
        }
        .lessons-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Section Header - clean like Progress page */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          padding: '0 20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: AppColors.textPrimary,
                letterSpacing: '-0.3px',
              }}
            >
              Your Lessons
            </h2>
            {/* Progress pill badge */}
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '10px',
                backgroundColor: completedCount > 0
                  ? 'rgba(74, 222, 128, 0.15)'
                  : 'rgba(255, 255, 255, 0.08)',
                color: completedCount > 0
                  ? '#4ADE80'
                  : AppColors.textMuted,
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.2px',
              }}
            >
              {completedCount}/{lessons.length}
            </span>
          </div>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: AppColors.textSecondary,
              fontWeight: '500',
            }}
          >
            From {teacherName}
          </p>
        </div>

        {/* Right side: See All button - always visible */}
        <button
          className="see-all-btn"
          onClick={onSeeAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 14px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            color: AppColors.accent,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            letterSpacing: '-0.2px',
          }}
        >
          See All
          <ChevronRightIcon size={14} />
        </button>
      </div>

      {/* Horizontal scrollable lessons */}
      <div
        className="lessons-scroll"
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: '8px',
          paddingLeft: '20px',
          paddingRight: '20px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {visibleLessons.map((lesson, index) => (
          <div
            key={lesson.id || `lesson-${index}`}
            style={{
              flexShrink: 0,
              width: '180px',
              scrollSnapAlign: 'start',
              animation: `fadeSlideIn 0.4s ease-out ${index * 0.06}s both`,
            }}
          >
            <CompactLessonCard
              title={lesson.title}
              level={lesson.level}
              duration={lesson.duration}
              completed={lesson.completed}
              image={lesson.image}
              onClick={() => onLessonClick(lesson)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
