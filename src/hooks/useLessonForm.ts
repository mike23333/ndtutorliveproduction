import { useState, useCallback } from 'react';
import type { LessonFormData, LessonData, LessonTask } from '../types/dashboard';
import type { ProficiencyLevel } from '../types/firestore';

interface UseLessonFormResult {
  formData: LessonFormData;
  setTitle: (title: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setDurationMinutes: (duration: number) => void;
  setTargetLevel: (level: ProficiencyLevel | null) => void;
  setIsFirstLesson: (isFirst: boolean) => void;
  setImageUrl: (url: string | null) => void;
  setImageStoragePath: (path: string | null) => void;
  setImage: (url: string, path: string) => void;
  clearImage: () => void;
  setAssignedStudentIds: (studentIds: string[]) => void;
  setTasks: (tasks: LessonTask[]) => void;
  reset: () => void;
  loadFromLesson: (lesson: LessonData) => void;
  loadFromFormData: (data: LessonFormData) => void;
  isValid: boolean;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

const initialFormData: LessonFormData = {
  title: '',
  systemPrompt: '',
  durationMinutes: 15,
  imageUrl: null,
  imageStoragePath: null,
  targetLevel: null,
  isFirstLesson: false,
  assignedStudentIds: [],
  tasks: [],
};

export function useLessonForm(): UseLessonFormResult {
  const [formData, setFormData] = useState<LessonFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const setTitle = useCallback((title: string) => {
    setFormData(prev => ({ ...prev, title }));
  }, []);

  const setSystemPrompt = useCallback((systemPrompt: string) => {
    setFormData(prev => ({ ...prev, systemPrompt }));
  }, []);

  const setDurationMinutes = useCallback((durationMinutes: number) => {
    const clampedDuration = Math.min(60, Math.max(1, durationMinutes));
    setFormData(prev => ({ ...prev, durationMinutes: clampedDuration }));
  }, []);

  const setTargetLevel = useCallback((targetLevel: ProficiencyLevel | null) => {
    setFormData(prev => ({ ...prev, targetLevel }));
  }, []);

  const setIsFirstLesson = useCallback((isFirstLesson: boolean) => {
    setFormData(prev => ({ ...prev, isFirstLesson }));
  }, []);

  const setImageUrl = useCallback((imageUrl: string | null) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  }, []);

  const setImageStoragePath = useCallback((imageStoragePath: string | null) => {
    setFormData(prev => ({ ...prev, imageStoragePath }));
  }, []);

  const setImage = useCallback((url: string, path: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url, imageStoragePath: path }));
  }, []);

  const clearImage = useCallback(() => {
    setFormData(prev => ({ ...prev, imageUrl: null, imageStoragePath: null }));
  }, []);

  const setAssignedStudentIds = useCallback((assignedStudentIds: string[]) => {
    setFormData(prev => ({ ...prev, assignedStudentIds }));
  }, []);

  const setTasks = useCallback((tasks: LessonTask[]) => {
    setFormData(prev => ({ ...prev, tasks }));
  }, []);

  const reset = useCallback(() => {
    setFormData(initialFormData);
    setSaving(false);
    setIsUploading(false);
  }, []);

  const loadFromLesson = useCallback((lesson: LessonData) => {
    setFormData({
      title: lesson.title,
      systemPrompt: lesson.systemPrompt,
      durationMinutes: lesson.durationMinutes,
      imageUrl: lesson.imageUrl,
      imageStoragePath: lesson.imageStoragePath || null,
      targetLevel: lesson.targetLevel || null,
      isFirstLesson: lesson.isFirstLesson || false,
      assignedStudentIds: lesson.assignedStudentIds || [],
      tasks: lesson.tasks || [],
    });
  }, []);

  const loadFromFormData = useCallback((data: LessonFormData) => {
    setFormData(data);
  }, []);

  const isValid = formData.title.trim().length > 0 && formData.systemPrompt.trim().length > 0;

  return {
    formData,
    setTitle,
    setSystemPrompt,
    setDurationMinutes,
    setTargetLevel,
    setIsFirstLesson,
    setImageUrl,
    setImageStoragePath,
    setImage,
    clearImage,
    setAssignedStudentIds,
    setTasks,
    reset,
    loadFromLesson,
    loadFromFormData,
    isValid,
    saving,
    setSaving,
    isUploading,
    setIsUploading,
  };
}
