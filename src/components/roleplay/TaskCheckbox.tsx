import { AppColors, radius } from '../../theme/colors';

interface TaskCheckboxProps {
  text: string;
  completed: boolean;
  onToggle: () => void;
  isLast?: boolean;
}

export function TaskCheckbox({ text, completed, onToggle, isLast = false }: TaskCheckboxProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px',
        borderBottom: isLast ? 'none' : `1px solid ${AppColors.borderColor}`,
      }}
    >
      <button
        onClick={onToggle}
        aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
        style={{
          flexShrink: 0,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: completed ? AppColors.accentBlue : AppColors.bgElevated,
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </button>
      <p
        style={{
          margin: 0,
          fontSize: '15px',
          lineHeight: 1.5,
          color: completed ? AppColors.textMuted : AppColors.textPrimary,
          textDecoration: completed ? 'line-through' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {text}
      </p>
    </div>
  );
}

interface TaskListProps {
  tasks: Array<{ id: string; text: string; completed: boolean }>;
  onToggle: (id: string) => void;
}

export function TaskList({ tasks, onToggle }: TaskListProps) {
  return (
    <div
      style={{
        backgroundColor: AppColors.bgTertiary,
        borderRadius: radius.lg,
        overflow: 'hidden',
        border: `1px solid ${AppColors.borderColor}`,
      }}
    >
      {tasks.map((task, index) => (
        <TaskCheckbox
          key={task.id}
          text={task.text}
          completed={task.completed}
          onToggle={() => onToggle(task.id)}
          isLast={index === tasks.length - 1}
        />
      ))}
    </div>
  );
}
