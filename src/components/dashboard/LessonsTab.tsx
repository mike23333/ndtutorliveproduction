import React, { useState, useMemo } from 'react';
import { AppColors } from '../../theme/colors';
import { SearchIcon, EditIcon, CopyIcon, TrashIcon } from '../../theme/icons';
import type { LessonData } from '../../types/dashboard';

interface LessonsTabProps {
  lessons: LessonData[];
  onEdit: (lessonId: string) => void;
  onDelete: (lessonId: string) => void;
  onDuplicate: (lesson: LessonData) => void;
  onToggleStatus?: (lessonId: string, newStatus: 'published' | 'draft') => void;
}

type FilterType = 'all' | 'published' | 'draft' | 'recent';

const LEVEL_COLORS: Record<string, string> = {
  'A1': '#22C55E',
  'A2': '#16A34A',
  'B1': '#EAB308',
  'B2': '#EA580C',
  'C1': '#8B5CF6',
  'C2': '#EC4899',
};

export const LessonsTab: React.FC<LessonsTabProps> = ({
  lessons,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    onDelete(lessonId);
  };

  // Filter lessons based on search and filter
  const filteredLessons = useMemo(() => {
    let result = [...lessons];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lesson =>
        lesson.title.toLowerCase().includes(query) ||
        lesson.systemPrompt.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    switch (activeFilter) {
      case 'published':
        result = result.filter(l => l.status === 'published');
        break;
      case 'draft':
        result = result.filter(l => l.status === 'draft');
        break;
      case 'recent':
        // Sort by creation date (assuming most recent have higher indices)
        result = result.slice().reverse().slice(0, 10);
        break;
      default:
        break;
    }

    return result;
  }, [lessons, searchQuery, activeFilter]);

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: lessons.length },
    { key: 'published', label: 'Published', count: lessons.filter(l => l.status === 'published').length },
    { key: 'draft', label: 'Draft', count: lessons.filter(l => l.status === 'draft').length },
    { key: 'recent', label: 'Recent', count: Math.min(10, lessons.length) },
  ];

  return (
    <div>
      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '12px 16px',
          marginBottom: 'clamp(16px, 4vw, 20px)',
        }}
      >
        <SearchIcon size={18} color={AppColors.textSecondary} />
        <input
          type="text"
          placeholder="Search lessons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: AppColors.textPrimary,
            fontSize: '15px',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: AppColors.textSecondary,
              fontSize: '12px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: 'clamp(16px, 4vw, 20px)',
          flexWrap: 'wrap',
        }}
      >
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: activeFilter === filter.key
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: activeFilter === filter.key
                ? '1px solid rgba(139, 92, 246, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: activeFilter === filter.key ? AppColors.textPrimary : AppColors.textSecondary,
              fontSize: '13px',
              fontWeight: activeFilter === filter.key ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {filter.label}
            <span
              style={{
                background: activeFilter === filter.key
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(255, 255, 255, 0.1)',
                padding: '2px 6px',
                borderRadius: '6px',
                fontSize: '11px',
              }}
            >
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(14px, 3.5vw, 18px)',
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
          {searchQuery
            ? `Results for "${searchQuery}"`
            : activeFilter === 'all'
              ? 'All Lessons'
              : activeFilter === 'recent'
                ? 'Recent Lessons'
                : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Lessons`}
        </h2>
        <span
          style={{
            fontSize: '13px',
            color: AppColors.textSecondary,
          }}
        >
          {filteredLessons.length} lesson{filteredLessons.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lesson Grid */}
      {filteredLessons.length === 0 ? (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            padding: 'clamp(32px, 8vw, 48px)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {searchQuery ? '🔍' : '📚'}
          </div>
          <h3
            style={{
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: 600,
              color: AppColors.textPrimary,
              margin: '0 0 8px 0',
            }}
          >
            {searchQuery ? 'No lessons found' : 'No lessons yet'}
          </h3>
          <p
            style={{
              fontSize: 'clamp(13px, 3vw, 15px)',
              color: AppColors.textSecondary,
              margin: 0,
            }}
          >
            {searchQuery
              ? 'Try a different search term'
              : 'Create your first lesson to get started!'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'clamp(12px, 3vw, 16px)',
          }}
        >
          {filteredLessons.map((lesson, index) => (
            <LessonGridCard
              key={lesson.id || `lesson-${index}`}
              lesson={lesson}
              onEdit={() => onEdit(lesson.id)}
              onDelete={() => handleDelete(lesson.id)}
              onDuplicate={() => onDuplicate(lesson)}
              onToggleStatus={onToggleStatus ? (newStatus) => onToggleStatus(lesson.id, newStatus) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Lesson Grid Card Component
interface LessonGridCardProps {
  lesson: LessonData;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleStatus?: (newStatus: 'published' | 'draft') => void;
}

const LessonGridCard: React.FC<LessonGridCardProps> = ({
  lesson,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const levelColor = LEVEL_COLORS[lesson.targetLevel || 'B1'] || LEVEL_COLORS['B1'];

  return (
    <div
      className="lesson-card"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '18px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      onClick={onEdit}
    >
      {/* Image/Gradient Header */}
      <div
        style={{
          height: '100px',
          background: lesson.imageUrl
            ? `url(${lesson.imageUrl}) center/cover`
            : `linear-gradient(135deg, ${levelColor}30 0%, ${levelColor}10 100%)`,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '12px',
        }}
      >
        {/* Level Badge */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: levelColor,
            color: '#000',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          {lesson.targetLevel || 'B1'}
        </div>

        {/* Status Badge */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: lesson.status === 'published'
              ? 'rgba(74, 222, 128, 0.9)'
              : 'rgba(251, 191, 36, 0.9)',
            color: '#000',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {lesson.status === 'published' ? 'Live' : 'Draft'}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Title */}
        <h3
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: AppColors.textPrimary,
            margin: '0 0 6px 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {lesson.title}
        </h3>

        {/* Description Preview */}
        <p
          style={{
            fontSize: '12px',
            color: AppColors.textSecondary,
            margin: '0 0 12px 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
            height: '33.6px',
          }}
        >
          {lesson.systemPrompt.slice(0, 120)}...
        </p>

        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: AppColors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ⏱ {lesson.durationMinutes}m
          </span>
          <span
            style={{
              fontSize: '12px',
              color: AppColors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            👥 {lesson.studentsCompleted}/{lesson.totalStudents}
          </span>
          {lesson.completionRate !== undefined && lesson.completionRate > 0 && (
            <span
              style={{
                fontSize: '12px',
                color: lesson.completionRate >= 70 ? AppColors.success : AppColors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ✓ {lesson.completionRate}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              width: `${lesson.completionRate || 0}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${levelColor} 0%, ${AppColors.accentBlue} 100%)`,
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '10px',
              color: AppColors.accentPurple,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <EditIcon size={14} />
            Edit
          </button>
          <button
            onClick={onDuplicate}
            style={{
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: AppColors.textSecondary,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Duplicate"
          >
            <CopyIcon size={14} />
          </button>
          {/* More Menu Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: AppColors.textSecondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
              title="More options"
            >
              ⋮
            </button>
            {/* Dropdown Menu */}
            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  marginBottom: '4px',
                  background: 'rgba(30, 30, 40, 0.98)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '6px',
                  minWidth: '140px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  zIndex: 100,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {onToggleStatus && (
                  <button
                    onClick={() => {
                      onToggleStatus(lesson.status === 'published' ? 'draft' : 'published');
                      setShowMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: lesson.status === 'published' ? '#FCD34D' : '#4ADE80',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>{lesson.status === 'published' ? '📝' : '🚀'}</span>
                    {lesson.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: AppColors.errorRose,
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <TrashIcon size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
