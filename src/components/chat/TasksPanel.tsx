import { useState, useEffect } from 'react';
import { AppColors, radius } from '../../theme/colors';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TasksPanelProps {
  tasks: TaskItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface AnimatedCheckProps {
  completed: boolean;
}

/**
 * Minimal list icon - replaces emoji for visual consistency
 */
function ListIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={AppColors.textSecondary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill={AppColors.textSecondary} stroke="none" />
      <circle cx="4" cy="12" r="1" fill={AppColors.textSecondary} stroke="none" />
      <circle cx="4" cy="18" r="1" fill={AppColors.textSecondary} stroke="none" />
    </svg>
  );
}

function AnimatedCheck({ completed }: AnimatedCheckProps) {
  const [showCheck, setShowCheck] = useState(completed);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (completed && !showCheck) {
      setIsAnimating(true);
      setShowCheck(true);
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    } else if (!completed) {
      setShowCheck(false);
      setIsAnimating(false);
    }
  }, [completed, showCheck]);

  return (
    <div
      style={{
        flexShrink: 0,
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: showCheck ? 'none' : `1.5px solid ${AppColors.borderHover}`,
        backgroundColor: showCheck ? AppColors.success : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
      }}
    >
      {showCheck && (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity: isAnimating ? 1 : 0.95,
            transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          }}
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: TaskItem }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '10px 16px',
      }}
    >
      <div style={{ paddingTop: '2px' }}>
        <AnimatedCheck completed={task.completed} />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: '14px',
          lineHeight: 1.5,
          color: task.completed ? AppColors.textMuted : AppColors.textPrimary,
          textDecoration: task.completed ? 'line-through' : 'none',
          transition: 'color 0.2s ease, text-decoration 0.2s ease',
        }}
      >
        {task.text}
      </p>
    </div>
  );
}

export function TasksPanel({ tasks, isCollapsed, onToggleCollapse }: TasksPanelProps) {
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  return (
    <div
      style={{
        backgroundColor: AppColors.bgTertiary,
        borderRadius: radius.md,
        overflow: 'hidden',
        marginBottom: '12px',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggleCollapse}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ListIcon />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: AppColors.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            Tasks
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: allCompleted ? AppColors.success : AppColors.textMuted,
              backgroundColor: allCompleted
                ? AppColors.successMuted
                : AppColors.surface10,
              padding: '3px 10px',
              borderRadius: radius.full,
              transition: 'all 0.2s ease',
            }}
          >
            {completedCount}/{totalCount}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={AppColors.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Task list */}
      <div
        style={{
          maxHeight: isCollapsed ? '0px' : `${tasks.length * 44 + 8}px`,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease-in-out',
          paddingBottom: isCollapsed ? 0 : '4px',
        }}
      >
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
