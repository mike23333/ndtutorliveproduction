import React, { useState } from 'react';
import { AppColors } from '../../theme/colors';
import { EditIcon, CopyIcon, TrashIcon, ChevronDownIcon } from '../../theme/icons';
import type { LessonData } from '../../types/dashboard';

interface LessonListCardProps {
  lesson: LessonData;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const LessonListCard: React.FC<LessonListCardProps> = ({
  lesson,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [showNotCompleted, setShowNotCompleted] = useState(false);
  const hasNotCompletedStudents = lesson.notCompletedStudents && lesson.notCompletedStudents.length > 0;
  const actionButtonStyle: React.CSSProperties = {
    width: 'clamp(30px, 6vw, 34px)',
    height: 'clamp(30px, 6vw, 34px)',
    background: AppColors.surfaceMedium,
    border: 'none',
    borderRadius: 'clamp(6px, 1.5vw, 8px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div
      style={{
        background: AppColors.surfaceLight,
        borderRadius: 'clamp(10px, 2.5vw, 14px)',
        padding: 'clamp(12px, 3vw, 16px)',
        marginBottom: 'clamp(10px, 2.5vw, 12px)',
        border: `1px solid ${AppColors.borderColor}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'clamp(8px, 2vw, 10px)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 8px)', flexWrap: 'wrap' }}>
            <h3
              style={{
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: 600,
                color: AppColors.textPrimary,
                margin: 0,
              }}
            >
              {lesson.title}
            </h3>
            <span
              style={{
                fontSize: 'clamp(10px, 2vw, 11px)',
                padding: 'clamp(2px, 0.5vw, 3px) clamp(6px, 1.5vw, 8px)',
                borderRadius: 'clamp(8px, 2vw, 10px)',
                background: lesson.status === 'published' ? AppColors.successGreen : AppColors.whisperAmber,
                color: AppColors.textDark,
                fontWeight: 500,
              }}
            >
              {lesson.status === 'published' ? 'Published' : 'Draft'}
            </span>
            <span
              style={{
                fontSize: 'clamp(10px, 2vw, 11px)',
                padding: 'clamp(2px, 0.5vw, 3px) clamp(6px, 1.5vw, 8px)',
                borderRadius: 'clamp(8px, 2vw, 10px)',
                background: AppColors.surfaceMedium,
                color: AppColors.textSecondary,
              }}
            >
              {lesson.durationMinutes} min
            </span>
          </div>
          <p
            style={{
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              color: AppColors.textSecondary,
              margin: 'clamp(4px, 1vw, 6px) 0 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {lesson.systemPrompt.slice(0, 100)}...
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'clamp(4px, 1vw, 6px)' }}>
          <button
            onClick={onEdit}
            style={{ ...actionButtonStyle, color: AppColors.textSecondary }}
          >
            <EditIcon size={14} />
          </button>
          <button
            onClick={onDuplicate}
            style={{ ...actionButtonStyle, color: AppColors.textSecondary }}
          >
            <CopyIcon size={14} />
          </button>
          <button
            onClick={onDelete}
            style={{ ...actionButtonStyle, color: AppColors.errorRose }}
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 'clamp(3px, 0.8vw, 4px)',
          }}
        >
          <span style={{ fontSize: 'clamp(11px, 2.2vw, 12px)', color: AppColors.textSecondary }}>
            Completion
          </span>
          <span style={{ fontSize: 'clamp(11px, 2.2vw, 12px)', color: AppColors.textPrimary }}>
            {lesson.studentsCompleted}/{lesson.totalStudents} students
          </span>
        </div>
        <div
          style={{
            height: 'clamp(4px, 1vw, 6px)',
            background: AppColors.surfaceMedium,
            borderRadius: 'clamp(2px, 0.5vw, 3px)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${lesson.completionRate}%`,
              height: '100%',
              background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
              borderRadius: 'clamp(2px, 0.5vw, 3px)',
            }}
          />
        </div>
      </div>

      {/* Who hasn't completed - expandable section */}
      {hasNotCompletedStudents && (
        <div style={{ marginTop: 'clamp(8px, 2vw, 12px)' }}>
          <button
            onClick={() => setShowNotCompleted(!showNotCompleted)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              padding: 0,
              color: AppColors.textSecondary,
              fontSize: 'clamp(11px, 2.2vw, 12px)',
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'flex-start',
            }}
          >
            <span
              style={{
                transform: showNotCompleted ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronDownIcon size={14} />
            </span>
            <span>
              {showNotCompleted ? 'Hide' : 'Show'} who hasn&apos;t completed ({lesson.notCompletedStudents?.length})
            </span>
          </button>

          {showNotCompleted && (
            <div
              style={{
                marginTop: 'clamp(6px, 1.5vw, 8px)',
                padding: 'clamp(8px, 2vw, 10px)',
                background: AppColors.surfaceMedium,
                borderRadius: 'clamp(6px, 1.5vw, 8px)',
              }}
            >
              {lesson.notCompletedStudents?.map((student) => (
                <div
                  key={student.uid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'clamp(4px, 1vw, 6px) 0',
                    borderBottom: `1px solid ${AppColors.borderColor}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(11px, 2.2vw, 12px)',
                      color: AppColors.textPrimary,
                    }}
                  >
                    {student.name}
                  </span>
                  {student.level && (
                    <span
                      style={{
                        fontSize: 'clamp(9px, 1.8vw, 10px)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        color: AppColors.textSecondary,
                      }}
                    >
                      {student.level}
                    </span>
                  )}
                </div>
              ))}
              {lesson.notCompletedStudents?.length === 0 && (
                <p
                  style={{
                    fontSize: 'clamp(11px, 2.2vw, 12px)',
                    color: AppColors.textSecondary,
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  All students have completed this lesson!
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
