import { AppColors } from '../../theme/colors';
import { CompactLessonCard } from './CompactLessonCard';

export interface LessonWithCompletion {
  id: string;
  title: string;
  level: string;
  duration: string;
  durationMinutes?: number;
  completed: boolean;
  completedAt?: Date;
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
 * 2-column lesson grid
 * Clean layout with generous spacing
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
  const completedCount = lessons.filter((l) => l.completed).length;

  if (lessons.length === 0) {
    return null; // Don't show empty section
  }

  return (
    <section style={{ padding: '0 20px', marginBottom: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: '600',
              color: AppColors.textPrimary,
            }}
          >
            Your Lessons
          </h2>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: AppColors.textSecondary,
            }}
          >
            From {teacherName} · {completedCount}/{lessons.length} done
          </p>
        </div>

        {hasMore && onSeeAll && (
          <button
            onClick={onSeeAll}
            style={{
              padding: '8px 0',
              border: 'none',
              backgroundColor: 'transparent',
              color: AppColors.accent,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            See all
          </button>
        )}
      </div>

      {/* 2-column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}
      >
        {visibleLessons.map((lesson, index) => (
          <CompactLessonCard
            key={lesson.id || `lesson-${index}`}
            title={lesson.title}
            level={lesson.level}
            duration={lesson.duration}
            completed={lesson.completed}
            image={lesson.image}
            onClick={() => onLessonClick(lesson)}
          />
        ))}
      </div>
    </section>
  );
};
