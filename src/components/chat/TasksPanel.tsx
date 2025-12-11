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

function AnimatedCheck({ completed }: AnimatedCheckProps) {
  const [showCheck, setShowCheck] = useState(completed);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (completed && !showCheck) {
      // Trigger animation when newly completed
      setIsAnimating(true);
      setShowCheck(true);
      // Reset animation state after animation completes
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
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        border: showCheck ? 'none' : `2px solid ${AppColors.borderColor}`,
        backgroundColor: showCheck ? AppColors.accentBlue : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        transform: isAnimating ? 'scale(1.15)' : 'scale(1)',
      }}
    >
      {showCheck && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          }}
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

function TaskRow({ task, isLast }: { task: TaskItem; isLast: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${AppColors.borderColor}`,
      }}
    >
      <AnimatedCheck completed={task.completed} />
      <p
        style={{
          margin: 0,
          fontSize: '14px',
          lineHeight: 1.5,
          color: task.completed ? AppColors.textMuted : AppColors.textPrimary,
          textDecoration: task.completed ? 'line-through' : 'none',
          transition: 'all 0.2s ease',
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
  const allCompleted = completedCount === totalCount;

  return (
    <div
      style={{
        backgroundColor: AppColors.surfaceDark,
        borderRadius: radius.lg,
        border: `1px solid ${AppColors.borderColor}`,
        overflow: 'hidden',
        marginBottom: '12px',
      }}
    >
      {/* Header - always visible */}
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
          borderBottom: isCollapsed ? 'none' : `1px solid ${AppColors.borderColor}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>📋</span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: AppColors.textPrimary,
            }}
          >
            Tasks
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: allCompleted ? AppColors.success : AppColors.textSecondary,
              backgroundColor: allCompleted
                ? 'rgba(16, 185, 129, 0.15)'
                : AppColors.surfaceLight,
              padding: '2px 8px',
              borderRadius: '10px',
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
          stroke={AppColors.textSecondary}
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

      {/* Task list - expandable */}
      <div
        style={{
          maxHeight: isCollapsed ? '0px' : `${tasks.length * 60 + 20}px`,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease-in-out',
        }}
      >
        {tasks.map((task, index) => (
          <TaskRow
            key={task.id}
            task={task}
            isLast={index === tasks.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
