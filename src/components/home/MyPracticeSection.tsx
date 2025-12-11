import React, { useRef } from 'react';
import { AppColors } from '../../theme/colors';
import { PlayIcon, EditIcon, TrashIcon } from '../../theme/icons';
import type { CustomLessonDocument } from '../../types/firestore';

interface MyPracticeSectionProps {
  lessons: CustomLessonDocument[];
  onLessonClick: (lesson: CustomLessonDocument) => void;
  onEditLesson: (lesson: CustomLessonDocument) => void;
  onDeleteLesson: (lesson: CustomLessonDocument) => void;
}

/**
 * Custom lesson card - Clean, compact design
 */
const CustomLessonCard: React.FC<{
  lesson: CustomLessonDocument;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ lesson, onClick, onEdit, onDelete }) => {
  const defaultImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop';

  return (
    <div
      style={{
        width: '200px',
        minWidth: '200px',
        flexShrink: 0,
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: AppColors.bgTertiary,
        border: `1px solid ${AppColors.borderColor}`,
        transition: 'all 150ms ease',
      }}
    >
      {/* Image */}
      <div
        onClick={onClick}
        style={{
          height: '100px',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <img
          src={lesson.imageUrl || defaultImage}
          alt={lesson.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15, 13, 26, 0.9) 0%, transparent 60%)',
          }}
        />

        {/* Play button overlay */}
        <button
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: AppColors.accent,
            color: AppColors.textDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <PlayIcon size={16} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        <h4
          onClick={onClick}
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '500',
            color: AppColors.textPrimary,
            lineHeight: 1.3,
            cursor: 'pointer',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '36px',
          }}
        >
          {lesson.title}
        </h4>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '12px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: AppColors.textMuted,
            }}
          >
            {lesson.practiceCount > 0 ? `${lesson.practiceCount}× practiced` : '5 min'}
          </span>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="Edit lesson"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: AppColors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <EditIcon size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Delete lesson"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: AppColors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrashIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * My Practice Section - Horizontal scroll of custom lessons
 */
export const MyPracticeSection: React.FC<MyPracticeSectionProps> = ({
  lessons,
  onLessonClick,
  onEditLesson,
  onDeleteLesson,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (lessons.length === 0) return null;

  return (
    <section style={{ marginBottom: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '0 20px',
          marginBottom: '12px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '17px',
            fontWeight: '600',
            color: AppColors.textPrimary,
          }}
        >
          My Practice
        </h2>
        <span
          style={{
            fontSize: '13px',
            color: AppColors.textSecondary,
          }}
        >
          {lessons.length} custom
        </span>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: '12px',
          padding: '0 20px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {lessons.map((lesson) => (
          <CustomLessonCard
            key={lesson.id}
            lesson={lesson}
            onClick={() => onLessonClick(lesson)}
            onEdit={() => onEditLesson(lesson)}
            onDelete={() => onDeleteLesson(lesson)}
          />
        ))}
      </div>
    </section>
  );
};
