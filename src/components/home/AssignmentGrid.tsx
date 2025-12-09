import { AppColors } from '../../theme/colors';
import { ChevronRightIcon } from '../../theme/icons';
import { CompactLessonCard } from './CompactLessonCard';

export interface LessonWithCompletion {
  id: string;
  title: string;
  level: string;
  duration: string;
  durationMinutes?: number;
  completed: boolean;
  completedAt?: Date;
  // Pass-through fields for navigation
  systemPrompt?: string;
  functionCallingEnabled?: boolean;
  functionCallingInstructions?: string;
  tone?: string;
  image?: string;
  teacherId?: string;
  isFirstLesson?: boolean;
}

interface AssignmentGridProps {
  teacherName: string;
  lessons: LessonWithCompletion[];
  maxVisible?: number;
  onLessonClick: (lesson: LessonWithCompletion) => void;
  onSeeAll?: () => void;
}

/**
 * 3-column grid of compact lesson cards.
 * Shows teacher name header and "See all" link if more lessons than maxVisible.
 */
export const AssignmentGrid = ({
  teacherName,
  lessons,
  maxVisible = 6,
  onLessonClick,
  onSeeAll,
}: AssignmentGridProps) => {
  const visibleLessons = lessons.slice(0, maxVisible);
  const hasMore = lessons.length > maxVisible;

  if (lessons.length === 0) {
    return (
      <div style={{ padding: '0 clamp(16px, 4vw, 24px)', marginBottom: '16px' }}>
        {/* Header */}
        <h2
          style={{
            margin: '0 0 clamp(12px, 3vw, 16px) 0',
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            fontWeight: '600',
            color: AppColors.textPrimary,
          }}
        >
          From {teacherName}
        </h2>

        {/* Empty state */}
        <div
          style={{
            padding: 'clamp(20px, 5vw, 32px)',
            borderRadius: '16px',
            backgroundColor: AppColors.surfaceMedium,
            border: `1px dashed ${AppColors.borderColor}`,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(13px, 3vw, 15px)',
              color: AppColors.textSecondary,
            }}
          >
            No lessons assigned yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 clamp(16px, 4vw, 24px)', marginBottom: '16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(12px, 3vw, 16px)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            fontWeight: '600',
            color: AppColors.textPrimary,
          }}
        >
          From {teacherName}
        </h2>

        {hasMore && onSeeAll && (
          <button
            onClick={onSeeAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: 'transparent',
              color: AppColors.accentPurple,
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            See all
            <ChevronRightIcon size={14} />
          </button>
        )}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'clamp(8px, 2vw, 12px)',
        }}
      >
        {visibleLessons.map((lesson) => (
          <CompactLessonCard
            key={lesson.id}
            title={lesson.title}
            level={lesson.level}
            duration={lesson.duration}
            completed={lesson.completed}
            image={lesson.image}
            onClick={() => onLessonClick(lesson)}
          />
        ))}
      </div>

      {/* Completion summary */}
      {lessons.length > 0 && (
        <div
          style={{
            marginTop: 'clamp(10px, 2.5vw, 14px)',
            fontSize: '12px',
            color: AppColors.textSecondary,
            textAlign: 'center',
          }}
        >
          {lessons.filter((l) => l.completed).length} of {lessons.length} completed
        </div>
      )}
    </div>
  );
};
