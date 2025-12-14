import React, { useState } from 'react';
import { AppColors } from '../../theme/colors';
import { PlusIcon, PlayIcon } from '../../theme/icons';
import type { CustomLessonDocument } from '../../types/firestore';

// MoreVertical icon
const MoreVerticalIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

// Edit icon
const EditIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// Trash icon
const TrashIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

interface MyPracticeSectionProps {
  lessons: CustomLessonDocument[];
  onLessonClick: (lesson: CustomLessonDocument) => void;
  onEditLesson: (lesson: CustomLessonDocument) => void;
  onDeleteLesson: (lesson: CustomLessonDocument) => void;
  onAddNew?: () => void;
}

// Generate unique ID for CSS scoping
let itemId = 0;

/**
 * Custom lesson list item - Premium design with hover effects
 */
const CustomLessonListItem: React.FC<{
  lesson: CustomLessonDocument;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ lesson, onClick, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const uniqueId = `practice-item-${++itemId}`;

  // Format created date
  const formatCreatedDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={uniqueId}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        padding: '16px',
        borderRadius: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        position: 'relative',
      }}
    >
      <style>{`
        .${uniqueId} {
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .${uniqueId}:hover {
          transform: translateY(-2px);
          background-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(216, 180, 254, 0.15);
        }
        .${uniqueId}:hover .play-indicator {
          opacity: 1;
          transform: scale(1);
        }
        .${uniqueId} .more-btn:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .${uniqueId} .menu-item:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>

      {/* Left side: Icon + Text */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Icon with play indicator */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(216, 180, 254, 0.2) 0%, rgba(216, 180, 254, 0.1) 100%)',
              border: '1px solid rgba(216, 180, 254, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '18px',
            }}
          >
            {lesson.imageUrl ? (
              <img
                src={lesson.imageUrl}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '11px',
                }}
              />
            ) : (
              '✨'
            )}
          </div>
          {/* Play indicator on hover */}
          <div
            className="play-indicator"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '12px',
              backgroundColor: 'rgba(216, 180, 254, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transform: 'scale(0.9)',
              transition: 'all 200ms ease',
            }}
          >
            <PlayIcon size={16} color={AppColors.textDark} />
          </div>
        </div>

        {/* Text content */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '600',
              color: AppColors.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.2px',
            }}
          >
            {lesson.title}
          </h4>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '3px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: AppColors.textMuted,
                fontWeight: '500',
              }}
            >
              {lesson.practiceCount > 0
                ? `${lesson.practiceCount} session${lesson.practiceCount > 1 ? 's' : ''}`
                : '5 min'}
            </span>
            <span style={{ fontSize: '12px', color: AppColors.textMuted }}>•</span>
            <span
              style={{
                fontSize: '12px',
                color: AppColors.textMuted,
              }}
            >
              {formatCreatedDate(lesson.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: More button */}
      <div style={{ position: 'relative' }}>
        <button
          className="more-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            backgroundColor: 'transparent',
            color: AppColors.textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'all 150ms ease',
          }}
        >
          <MoreVerticalIcon size={18} />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                backgroundColor: AppColors.bgElevated,
                borderRadius: '12px',
                border: `1px solid ${AppColors.borderColor}`,
                overflow: 'hidden',
                zIndex: 20,
                minWidth: '140px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              }}
            >
              <button
                className="menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onEdit();
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: AppColors.textPrimary,
                  fontSize: '13px',
                  fontWeight: '500',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <EditIcon size={15} />
                Edit lesson
              </button>
              <div style={{ height: '1px', backgroundColor: AppColors.borderColor, margin: '0 10px' }} />
              <button
                className="menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete();
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: AppColors.error,
                  fontSize: '13px',
                  fontWeight: '500',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <TrashIcon size={15} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * My Practice Section - Premium custom lessons list
 */
export const MyPracticeSection: React.FC<MyPracticeSectionProps> = ({
  lessons,
  onLessonClick,
  onEditLesson,
  onDeleteLesson,
  onAddNew,
}) => {
  if (lessons.length === 0) return null;

  return (
    <section style={{ padding: '0 20px', marginBottom: '24px' }}>
      <style>{`
        .add-new-btn {
          transition: all 250ms ease;
        }
        .add-new-btn:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
      `}</style>

      {/* Header - clean like Progress page */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '700',
            color: AppColors.textPrimary,
            letterSpacing: '-0.3px',
          }}
        >
          My Practice
        </h2>
        <span
          style={{
            fontSize: '13px',
            color: AppColors.textSecondary,
            fontWeight: '500',
          }}
        >
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lessons list */}
      <div>
        {lessons.map((lesson, index) => (
          <div
            key={lesson.id}
            style={{
              animation: `fadeSlideIn 0.3s ease-out ${index * 0.05}s both`,
            }}
          >
            <style>{`
              @keyframes fadeSlideIn {
                from { opacity: 0; transform: translateX(-8px); }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>
            <CustomLessonListItem
              lesson={lesson}
              onClick={() => onLessonClick(lesson)}
              onEdit={() => onEditLesson(lesson)}
              onDelete={() => onDeleteLesson(lesson)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
