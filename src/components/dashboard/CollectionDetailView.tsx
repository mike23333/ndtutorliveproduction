import React, { useState } from 'react';
import { AppColors } from '../../theme/colors';
import {
  ArrowLeftIcon,
  EditIcon,
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
} from '../../theme/icons';
import { useCollectionLessons, CollectionLesson } from '../../hooks/useCollectionLessons';
import { CollectionWithCount } from '../../hooks/useCollections';
import { LessonPickerModal } from './LessonPickerModal';

interface AvailableLesson {
  id: string;
  title: string;
  targetLevel: string | null;
  durationMinutes: number;
  collectionId: string | null;
}

interface CollectionDetailViewProps {
  collection: CollectionWithCount;
  allLessons: AvailableLesson[];
  onClose: () => void;
  onEdit: () => void;
}

// Arrow up icon (ChevronDown rotated)
const ArrowUpIcon = ({ size = 16 }: { size?: number }) => (
  <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}>
    <ChevronDownIcon size={size} />
  </span>
);

const ArrowDownIcon = ChevronDownIcon;

export const CollectionDetailView: React.FC<CollectionDetailViewProps> = ({
  collection,
  allLessons,
  onClose,
  onEdit,
}) => {
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const {
    lessons,
    loading,
    moveLessonUp,
    moveLessonDown,
    toggleHomepage,
    addLesson,
    removeLesson,
  } = useCollectionLessons(collection.id, collection.teacherId);

  const handleRemoveLesson = async (lessonId: string) => {
    if (confirm('Remove this lesson from the collection? (The lesson will not be deleted, just unlinked)')) {
      await removeLesson(lessonId);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: 'clamp(20px, 5vw, 28px)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: AppColors.textSecondary,
            fontSize: 'clamp(12px, 2.5vw, 13px)',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 'clamp(12px, 3vw, 16px)',
          }}
        >
          <ArrowLeftIcon size={16} />
          Back to Collections
        </button>

        <div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 16px)',
            alignItems: 'flex-start',
          }}
        >
          {/* Collection image */}
          <img
            src={collection.imageUrl}
            alt={collection.title}
            style={{
              width: 'clamp(80px, 20vw, 120px)',
              height: 'clamp(80px, 20vw, 120px)',
              borderRadius: 'clamp(10px, 2.5vw, 14px)',
              objectFit: 'cover',
            }}
          />

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 2vw, 12px)',
                marginBottom: 'clamp(4px, 1vw, 6px)',
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(18px, 4vw, 22px)',
                  fontWeight: 600,
                  color: AppColors.textPrimary,
                  margin: 0,
                }}
              >
                {collection.title}
              </h2>
              <button
                onClick={onEdit}
                style={{
                  background: AppColors.surfaceMedium,
                  border: 'none',
                  borderRadius: 6,
                  padding: 6,
                  cursor: 'pointer',
                  color: AppColors.textSecondary,
                }}
              >
                <EditIcon size={14} />
              </button>
            </div>

            {collection.description && (
              <p
                style={{
                  fontSize: 'clamp(12px, 2.5vw, 13px)',
                  color: AppColors.textSecondary,
                  margin: '0 0 clamp(8px, 2vw, 10px) 0',
                }}
              >
                {collection.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <span
                style={{
                  fontSize: 'clamp(10px, 2vw, 11px)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: collection.color || AppColors.accentPurple,
                  color: 'white',
                }}
              >
                {collection.category}
              </span>
              <span
                style={{
                  fontSize: 'clamp(10px, 2vw, 11px)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: AppColors.surfaceMedium,
                  color: AppColors.textSecondary,
                }}
              >
                {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons section */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(12px, 3vw, 16px)',
          }}
        >
          <h3
            style={{
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              color: AppColors.textPrimary,
              margin: 0,
            }}
          >
            Lessons
          </h3>
          <button
            onClick={() => setShowLessonPicker(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 'clamp(11px, 2.2vw, 12px)',
              color: 'white',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <PlusIcon size={14} />
            Add Lesson
          </button>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'clamp(24px, 6vw, 32px)',
              color: AppColors.textSecondary,
            }}
          >
            Loading lessons...
          </div>
        ) : lessons.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'clamp(24px, 6vw, 32px)',
              background: AppColors.surfaceLight,
              borderRadius: 'clamp(10px, 2.5vw, 14px)',
              border: `1px dashed ${AppColors.borderColor}`,
            }}
          >
            <p
              style={{
                fontSize: 'clamp(12px, 2.5vw, 13px)',
                color: AppColors.textSecondary,
                margin: 0,
              }}
            >
              No lessons in this collection yet.
              <br />
              Add lessons from the Lessons tab.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lessons.map((lesson, index) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                isFirst={index === 0}
                isLast={index === lessons.length - 1}
                onMoveUp={() => moveLessonUp(lesson.id)}
                onMoveDown={() => moveLessonDown(lesson.id)}
                onToggleHomepage={(show) => toggleHomepage(lesson.id, show)}
                onRemove={() => handleRemoveLesson(lesson.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lesson Picker Modal */}
      {showLessonPicker && (
        <LessonPickerModal
          lessons={allLessons}
          currentCollectionId={collection.id}
          onAdd={addLesson}
          onClose={() => setShowLessonPicker(false)}
        />
      )}
    </div>
  );
};

interface LessonRowProps {
  lesson: CollectionLesson;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleHomepage: (show: boolean) => void;
  onRemove: () => void;
}

const LessonRow: React.FC<LessonRowProps> = ({
  lesson,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onToggleHomepage,
  onRemove,
}) => {
  const arrowButtonStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    background: AppColors.surfaceMedium,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: AppColors.textSecondary,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(8px, 2vw, 12px)',
        padding: 'clamp(10px, 2.5vw, 14px)',
        background: AppColors.surfaceLight,
        borderRadius: 'clamp(8px, 2vw, 10px)',
        border: `1px solid ${AppColors.borderColor}`,
      }}
    >
      {/* Reorder buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          style={{
            ...arrowButtonStyle,
            opacity: isFirst ? 0.3 : 1,
            cursor: isFirst ? 'not-allowed' : 'pointer',
          }}
        >
          <ArrowUpIcon size={14} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          style={{
            ...arrowButtonStyle,
            opacity: isLast ? 0.3 : 1,
            cursor: isLast ? 'not-allowed' : 'pointer',
          }}
        >
          <ArrowDownIcon size={14} />
        </button>
      </div>

      {/* Lesson info */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(13px, 2.8vw, 14px)',
              fontWeight: 500,
              color: AppColors.textPrimary,
            }}
          >
            {lesson.title}
          </span>
          {lesson.targetLevel && (
            <span
              style={{
                fontSize: 'clamp(9px, 1.8vw, 10px)',
                padding: '2px 6px',
                borderRadius: 4,
                background: AppColors.surfaceMedium,
                color: AppColors.textSecondary,
              }}
            >
              {lesson.targetLevel}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 'clamp(11px, 2.2vw, 12px)',
            color: AppColors.textSecondary,
          }}
        >
          {lesson.durationMinutes} min
        </span>
      </div>

      {/* Homepage toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 'clamp(10px, 2vw, 11px)',
            color: AppColors.textSecondary,
          }}
        >
          Homepage
        </span>
        <button
          onClick={() => onToggleHomepage(!lesson.showOnHomepage)}
          style={{
            width: 40,
            height: 22,
            borderRadius: 11,
            border: 'none',
            background: lesson.showOnHomepage
              ? AppColors.accentPurple
              : AppColors.surfaceMedium,
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s ease',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'white',
              top: 3,
              left: lesson.showOnHomepage ? 21 : 3,
              transition: 'left 0.2s ease',
            }}
          />
        </button>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: AppColors.textSecondary,
          padding: 4,
        }}
      >
        <TrashIcon size={14} />
      </button>
    </div>
  );
};
