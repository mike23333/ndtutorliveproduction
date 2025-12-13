import React from 'react';
import { AppColors } from '../../../../theme/colors';
import { SelectField } from '../../../forms';
import type { LessonFormData, LessonTask } from '../../../../types/dashboard';
import type { PromptTemplateDocument } from '../../../../types/firestore';

interface StepIntelligenceProps {
  formData: LessonFormData;
  onSystemPromptChange: (prompt: string) => void;
  onDurationChange: (duration: number) => void;
  onTasksChange?: (tasks: LessonTask[]) => void;
  promptTemplates: PromptTemplateDocument[];
  selectedTemplateId: string;
  onTemplateSelect: (id: string) => void;
  onSaveAsTemplate: () => void;
}

export const StepIntelligence: React.FC<StepIntelligenceProps> = ({
  formData,
  onSystemPromptChange,
  onDurationChange,
  onTasksChange,
  promptTemplates,
  selectedTemplateId,
  onTemplateSelect,
  onSaveAsTemplate,
}) => {
  const handleDurationChange = (value: string) => {
    const num = parseInt(value) || 15;
    onDurationChange(Math.min(60, Math.max(1, num)));
  };

  const handleTaskChange = (index: number, text: string) => {
    if (!onTasksChange) return;
    const currentTasks = formData.tasks || [];
    const updatedTasks = currentTasks.map((task, i) =>
      i === index ? { ...task, text } : task
    );
    onTasksChange(updatedTasks);
  };

  const handleAddTask = () => {
    if (!onTasksChange) return;
    const currentTasks = formData.tasks || [];
    const newTask: LessonTask = {
      id: `task-${currentTasks.length + 1}`,
      text: '',
    };
    onTasksChange([...currentTasks, newTask]);
  };

  const handleRemoveTask = (index: number) => {
    if (!onTasksChange) return;
    const currentTasks = formData.tasks || [];
    const updatedTasks = currentTasks
      .filter((_, i) => i !== index)
      .map((task, i) => ({ ...task, id: `task-${i + 1}` }));
    onTasksChange(updatedTasks);
  };

  return (
    <div>
      {/* Template Selector */}
      {promptTemplates.length > 0 && (
        <SelectField
          label="Load from Template"
          options={[
            { value: '', label: 'Start from scratch' },
            ...promptTemplates.map((t) => ({ value: t.id, label: t.name })),
          ]}
          value={selectedTemplateId}
          onChange={onTemplateSelect}
        />
      )}

      {/* System Prompt */}
      <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(4px, 1vw, 6px)',
          }}
        >
          <label
            style={{
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontWeight: 500,
              color: AppColors.textSecondary,
            }}
          >
            System Prompt <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <button
            type="button"
            onClick={onSaveAsTemplate}
            style={{
              background: 'transparent',
              border: 'none',
              color: AppColors.accentPurple,
              fontSize: 'clamp(11px, 2.2vw, 12px)',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Save as Template
          </button>
        </div>
        <textarea
          placeholder="Enter the complete system prompt for Gemini. This defines how the AI will behave during the lesson..."
          value={formData.systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: 'clamp(150px, 30vw, 200px)',
            background: AppColors.surfaceLight,
            border: `1px solid ${AppColors.borderColor}`,
            borderRadius: 'clamp(8px, 2vw, 12px)',
            padding: 'clamp(10px, 2.5vw, 14px)',
            color: AppColors.textPrimary,
            fontSize: 'clamp(14px, 3vw, 16px)',
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: 'monospace',
          }}
        />
        <p
          style={{
            fontSize: 'clamp(11px, 2.2vw, 12px)',
            color: AppColors.textSecondary,
            margin: 'clamp(4px, 1vw, 6px) 0 0 0',
          }}
        >
          This is the full instruction set for the AI tutor. Include personality, scenario, and
          teaching style.
        </p>
      </div>

      {/* Duration */}
      <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
        <label
          style={{
            display: 'block',
            fontSize: 'clamp(12px, 2.5vw, 14px)',
            fontWeight: 500,
            color: AppColors.textSecondary,
            marginBottom: 'clamp(4px, 1vw, 6px)',
          }}
        >
          Session Duration (minutes)
        </label>
        <input
          type="number"
          min={1}
          max={60}
          value={formData.durationMinutes}
          onChange={(e) => handleDurationChange(e.target.value)}
          style={{
            width: '120px',
            height: 'clamp(40px, 8vw, 48px)',
            background: AppColors.surfaceLight,
            border: `1px solid ${AppColors.borderColor}`,
            borderRadius: 'clamp(8px, 2vw, 12px)',
            padding: '0 clamp(10px, 2.5vw, 14px)',
            color: AppColors.textPrimary,
            fontSize: 'clamp(14px, 3vw, 16px)',
            textAlign: 'center',
          }}
        />
      </div>

      {/* Lesson Tasks */}
      {onTasksChange && (
        <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
          <label
            style={{
              display: 'block',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontWeight: 500,
              color: AppColors.textSecondary,
              marginBottom: 'clamp(4px, 1vw, 6px)',
            }}
          >
            Lesson Tasks (Optional)
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(formData.tasks || []).map((task, index) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${AppColors.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: AppColors.textSecondary,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                <input
                  type="text"
                  placeholder={`Task ${index + 1}: e.g., "Order a drink"`}
                  value={task.text}
                  onChange={(e) => handleTaskChange(index, e.target.value)}
                  style={{
                    flex: 1,
                    height: 'clamp(40px, 8vw, 44px)',
                    background: AppColors.surfaceLight,
                    border: `1px solid ${AppColors.borderColor}`,
                    borderRadius: 'clamp(8px, 2vw, 10px)',
                    padding: '0 clamp(10px, 2.5vw, 12px)',
                    color: AppColors.textPrimary,
                    fontSize: 'clamp(14px, 3vw, 15px)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTask(index)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddTask}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: 'clamp(40px, 8vw, 44px)',
                background: 'transparent',
                border: `1px dashed ${AppColors.borderColor}`,
                borderRadius: 'clamp(8px, 2vw, 10px)',
                color: AppColors.textSecondary,
                fontSize: 'clamp(13px, 2.8vw, 14px)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = AppColors.accentPurple;
                e.currentTarget.style.color = AppColors.accentPurple;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = AppColors.borderColor;
                e.currentTarget.style.color = AppColors.textSecondary;
              }}
            >
              <span style={{ fontSize: '18px' }}>+</span>
              Add Task
            </button>
          </div>

          <p
            style={{
              fontSize: 'clamp(11px, 2.2vw, 12px)',
              color: AppColors.textSecondary,
              margin: 'clamp(8px, 2vw, 10px) 0 0 0',
            }}
          >
            Students will see checkmarks as they complete each task. The AI marks tasks complete
            automatically.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Generate summary for collapsed edit mode
 */
export function getIntelligenceSummary(
  formData: LessonFormData,
  selectedTemplateId: string
): string {
  const parts: string[] = [];

  parts.push(`${formData.durationMinutes} min`);

  const taskCount = formData.tasks?.filter((t) => t.text.trim()).length || 0;
  if (taskCount > 0) {
    parts.push(`${taskCount} task${taskCount !== 1 ? 's' : ''}`);
  }

  if (selectedTemplateId) {
    parts.push('From template');
  }

  return parts.join(' · ');
}
