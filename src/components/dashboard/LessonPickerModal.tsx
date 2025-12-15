import React, { useState, useMemo } from 'react';
import { AppColors } from '../../theme/colors';
import { XIcon, SearchIcon, PlusIcon, CheckIcon, LoaderIcon } from '../../theme/icons';

interface AvailableLesson {
  id: string;
  title: string;
  targetLevel: string | null;
  durationMinutes: number;
  collectionId: string | null;
}

interface LessonPickerModalProps {
  lessons: AvailableLesson[];
  currentCollectionId: string;
  onAdd: (lessonId: string) => Promise<void>;
  onClose: () => void;
}

export const LessonPickerModal: React.FC<LessonPickerModalProps> = ({
  lessons,
  currentCollectionId,
  onAdd,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Filter to show only lessons NOT already in this collection
  const availableLessons = useMemo(() => {
    return lessons.filter(lesson => {
      // Exclude lessons already in this collection
      if (lesson.collectionId === currentCollectionId) return false;
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return lesson.title.toLowerCase().includes(query);
      }
      return true;
    });
  }, [lessons, currentCollectionId, searchQuery]);

  const handleAdd = async (lessonId: string) => {
    setAddingId(lessonId);
    try {
      await onAdd(lessonId);
      setAddedIds(prev => new Set([...prev, lessonId]));
    } catch (error) {
      console.error('Failed to add lesson:', error);
      alert('Failed to add lesson. Please try again.');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 24px)',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: AppColors.bgSecondary,
          borderRadius: 'clamp(16px, 4vw, 20px)',
          width: '100%',
          maxWidth: 500,
          maxHeight: 'calc(80vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'clamp(16px, 4vw, 20px)',
            borderBottom: `1px solid ${AppColors.borderColor}`,
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(16px, 3.5vw, 18px)',
              fontWeight: 600,
              margin: 0,
              color: AppColors.textPrimary,
            }}
          >
            Add Lessons
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: AppColors.textSecondary,
              padding: 4,
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: 'clamp(12px, 3vw, 16px)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              background: AppColors.surfaceMedium,
              borderRadius: 8,
              border: `1px solid ${AppColors.borderColor}`,
            }}
          >
            <SearchIcon size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lessons..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: AppColors.textPrimary,
                fontSize: 14,
              }}
            />
          </div>
        </div>

        {/* Lessons list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 clamp(12px, 3vw, 16px) clamp(12px, 3vw, 16px)',
          }}
        >
          {availableLessons.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'clamp(24px, 6vw, 32px)',
                color: AppColors.textSecondary,
              }}
            >
              {searchQuery
                ? 'No lessons match your search'
                : 'No available lessons to add. Create lessons from the Lessons tab first.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableLessons.map((lesson, index) => {
                const isAdded = addedIds.has(lesson.id);
                const isAdding = addingId === lesson.id;

                return (
                  <div
                    key={`${lesson.id}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 'clamp(10px, 2.5vw, 12px)',
                      background: isAdded ? `${AppColors.accentPurple}10` : AppColors.surfaceMedium,
                      borderRadius: 10,
                      border: `1px solid ${isAdded ? AppColors.accentPurple : AppColors.borderColor}`,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 2,
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
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: AppColors.surfaceLight,
                              color: AppColors.textSecondary,
                            }}
                          >
                            {lesson.targetLevel}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        }}
                      >
                        {lesson.durationMinutes} min
                        {lesson.collectionId && ' • In another collection'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAdd(lesson.id)}
                      disabled={isAdded || isAdding}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: 'none',
                        background: isAdded
                          ? AppColors.accentPurple
                          : isAdding
                          ? AppColors.surfaceMedium
                          : `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                        color: 'white',
                        cursor: isAdded || isAdding ? 'default' : 'pointer',
                      }}
                    >
                      {isAdded ? (
                        <CheckIcon size={16} />
                      ) : isAdding ? (
                        <LoaderIcon size={16} />
                      ) : (
                        <PlusIcon size={16} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 'clamp(12px, 3vw, 16px)',
            borderTop: `1px solid ${AppColors.borderColor}`,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: 'clamp(10px, 2.5vw, 12px) clamp(20px, 5vw, 28px)',
              background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
