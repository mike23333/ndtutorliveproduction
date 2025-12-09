import React, { useRef } from 'react';
import { AppColors } from '../../theme/colors';
import { ClockIcon, PlayIcon, EditIcon, TrashIcon } from '../../theme/icons';
import type { CustomLessonDocument } from '../../types/firestore';

interface MyPracticeSectionProps {
  lessons: CustomLessonDocument[];
  onLessonClick: (lesson: CustomLessonDocument) => void;
  onEditLesson: (lesson: CustomLessonDocument) => void;
  onDeleteLesson: (lesson: CustomLessonDocument) => void;
}

// Custom lesson card component
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
        width: 'clamp(260px, 70vw, 320px)',
        minWidth: 'clamp(260px, 70vw, 320px)',
        flexShrink: 0,
        borderRadius: '20px',
        overflow: 'hidden',
        backgroundColor: AppColors.surfaceDark,
        border: `1px solid ${AppColors.borderColor}`,
        transition: 'all 0.3s ease',
        position: 'relative',
      }}
    >
      {/* Image section */}
      <div
        onClick={onClick}
        style={{
          height: '120px',
          position: 'relative',
          overflow: 'hidden',
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

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'linear-gradient(to top, rgba(30, 27, 75, 1) 0%, transparent 100%)',
          }}
        />

        {/* Practice count badge */}
        {lesson.practiceCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              padding: '3px 8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(139, 92, 246, 0.9)',
              color: AppColors.textDark,
              fontSize: 'clamp(9px, 2vw, 11px)',
              fontWeight: '600',
            }}
          >
            Practiced {lesson.practiceCount}x
          </div>
        )}
      </div>

      {/* Content section */}
      <div style={{ padding: 'clamp(10px, 2.5vw, 14px)' }}>
        {/* Title */}
        <h4
          onClick={onClick}
          style={{
            margin: '0 0 6px 0',
            fontSize: 'clamp(13px, 3.2vw, 15px)',
            fontWeight: '700',
            color: AppColors.textPrimary,
            lineHeight: 1.3,
            cursor: 'pointer',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {lesson.title}
        </h4>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
          }}
        >
          {/* Duration */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'clamp(10px, 2.2vw, 12px)',
              color: AppColors.textSecondary,
            }}
          >
            <ClockIcon size={12} />
            5 min
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: AppColors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.color = AppColors.accentPurple;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = AppColors.textSecondary;
              }}
            >
              <EditIcon size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: AppColors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = AppColors.textSecondary;
              }}
            >
              <TrashIcon size={14} />
            </button>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={onClick}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: 'clamp(8px, 2vw, 10px)',
            borderRadius: '10px',
            border: 'none',
            background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
            color: AppColors.textDark,
            fontSize: 'clamp(11px, 2.5vw, 13px)',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <PlayIcon size={14} />
          Practice
        </button>
      </div>
    </div>
  );
};

export const MyPracticeSection: React.FC<MyPracticeSectionProps> = ({
  lessons,
  onLessonClick,
  onEditLesson,
  onDeleteLesson,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Don't render if no lessons
  if (lessons.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 'clamp(16px, 4vw, 24px)',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(16px, 4vw, 24px)',
          marginBottom: 'clamp(12px, 3vw, 16px)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: 700,
            color: AppColors.textPrimary,
          }}
        >
          My Practice
        </h2>
        <span
          style={{
            fontSize: 'clamp(12px, 2.8vw, 14px)',
            color: AppColors.textSecondary,
          }}
        >
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: 'clamp(12px, 3vw, 16px)',
          padding: '0 clamp(16px, 4vw, 24px)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            style={{
              scrollSnapAlign: 'start',
            }}
          >
            <CustomLessonCard
              lesson={lesson}
              onClick={() => onLessonClick(lesson)}
              onEdit={() => onEditLesson(lesson)}
              onDelete={() => onDeleteLesson(lesson)}
            />
          </div>
        ))}
      </div>

      {/* Hide scrollbar */}
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
