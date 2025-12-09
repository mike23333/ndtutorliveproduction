import React from 'react';
import { LessonListCard } from './LessonListCard';
import type { LessonData } from '../../types/dashboard';

interface LessonsTabProps {
  lessons: LessonData[];
  onEdit: (lessonId: string) => void;
  onDelete: (lessonId: string) => void;
  onDuplicate: (lesson: LessonData) => void;
}

export const LessonsTab: React.FC<LessonsTabProps> = ({
  lessons,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const handleDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    onDelete(lessonId);
  };

  return (
    <div>
      <h2
        style={{
          fontSize: 'clamp(16px, 3.5vw, 18px)',
          fontWeight: 600,
          marginBottom: 'clamp(12px, 3vw, 16px)',
        }}
      >
        Your Lessons
      </h2>
      {lessons.map((lesson, index) => (
        <LessonListCard
          key={lesson.id || `lesson-${index}`}
          lesson={lesson}
          onEdit={() => onEdit(lesson.id)}
          onDelete={() => handleDelete(lesson.id)}
          onDuplicate={() => onDuplicate(lesson)}
        />
      ))}
    </div>
  );
};
