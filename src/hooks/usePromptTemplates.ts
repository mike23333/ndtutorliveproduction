import { useState, useEffect, useCallback } from 'react';
import {
  getPromptTemplatesForTeacher,
  createPromptTemplate,
} from '../services/firebase/promptTemplates';
import {
  getWeeklyReviewTemplate,
  updateWeeklyReviewTemplate,
  getCustomLessonTemplate,
  updateCustomLessonTemplate,
  getPronunciationCoachTemplate,
  updatePronunciationCoachTemplate,
  DEFAULT_WEEKLY_REVIEW_TEMPLATE,
  DEFAULT_CUSTOM_LESSON_TEMPLATE,
  DEFAULT_PRONUNCIATION_COACH_TEMPLATE,
} from '../services/firebase/systemTemplates';
import type { PromptTemplateDocument, SystemTemplateDocument } from '../types/firestore';

interface UsePromptTemplatesResult {
  // Prompt templates
  templates: PromptTemplateDocument[];
  selectedTemplateId: string;
  selectTemplate: (id: string) => PromptTemplateDocument | undefined;
  createTemplate: (name: string, systemPrompt: string, duration: number) => Promise<void>;
  loading: boolean;

  // System template (weekly review)
  reviewTemplate: SystemTemplateDocument | null;
  editedReviewTemplate: string;
  setEditedReviewTemplate: (template: string) => void;
  saveReviewTemplate: () => Promise<void>;
  discardReviewChanges: () => void;
  resetReviewToDefault: () => void;
  reviewTemplateLoading: boolean;
  reviewTemplateSaving: boolean;
  reviewTemplateChanged: boolean;

  // Custom lesson template
  customLessonTemplate: SystemTemplateDocument | null;
  editedCustomLessonTemplate: string;
  setEditedCustomLessonTemplate: (template: string) => void;
  saveCustomLessonTemplate: () => Promise<void>;
  discardCustomLessonChanges: () => void;
  resetCustomLessonToDefault: () => void;
  customLessonTemplateLoading: boolean;
  customLessonTemplateSaving: boolean;
  customLessonTemplateChanged: boolean;

  // Pronunciation coach template
  pronunciationTemplate: SystemTemplateDocument | null;
  editedPronunciationTemplate: string;
  setEditedPronunciationTemplate: (template: string) => void;
  savePronunciationTemplate: () => Promise<void>;
  discardPronunciationChanges: () => void;
  resetPronunciationToDefault: () => void;
  pronunciationTemplateLoading: boolean;
  pronunciationTemplateSaving: boolean;
  pronunciationTemplateChanged: boolean;
}

export function usePromptTemplates(
  teacherId: string | undefined,
  isTemplatesTabActive: boolean
): UsePromptTemplatesResult {
  // Prompt templates state
  const [templates, setTemplates] = useState<PromptTemplateDocument[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(false);

  // System template state - Weekly Review
  const [reviewTemplate, setReviewTemplate] = useState<SystemTemplateDocument | null>(null);
  const [editedReviewTemplate, setEditedReviewTemplate] = useState('');
  const [reviewTemplateLoading, setReviewTemplateLoading] = useState(false);
  const [reviewTemplateSaving, setReviewTemplateSaving] = useState(false);

  // System template state - Custom Lesson
  const [customLessonTemplate, setCustomLessonTemplate] = useState<SystemTemplateDocument | null>(null);
  const [editedCustomLessonTemplate, setEditedCustomLessonTemplate] = useState('');
  const [customLessonTemplateLoading, setCustomLessonTemplateLoading] = useState(false);
  const [customLessonTemplateSaving, setCustomLessonTemplateSaving] = useState(false);

  // System template state - Pronunciation Coach
  const [pronunciationTemplate, setPronunciationTemplate] = useState<SystemTemplateDocument | null>(null);
  const [editedPronunciationTemplate, setEditedPronunciationTemplate] = useState('');
  const [pronunciationTemplateLoading, setPronunciationTemplateLoading] = useState(false);
  const [pronunciationTemplateSaving, setPronunciationTemplateSaving] = useState(false);

  // Fetch prompt templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!teacherId) return;
      setLoading(true);
      try {
        const fetchedTemplates = await getPromptTemplatesForTeacher(teacherId);
        setTemplates(fetchedTemplates);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [teacherId]);

  // Fetch all system templates when templates tab is active
  useEffect(() => {
    const fetchSystemTemplates = async () => {
      if (!isTemplatesTabActive) return;

      // Fetch all three templates in parallel
      setReviewTemplateLoading(true);
      setCustomLessonTemplateLoading(true);
      setPronunciationTemplateLoading(true);

      try {
        const [review, customLesson, pronunciation] = await Promise.all([
          getWeeklyReviewTemplate(),
          getCustomLessonTemplate(),
          getPronunciationCoachTemplate(),
        ]);

        setReviewTemplate(review);
        setEditedReviewTemplate(review.template);

        setCustomLessonTemplate(customLesson);
        setEditedCustomLessonTemplate(customLesson.template);

        setPronunciationTemplate(pronunciation);
        setEditedPronunciationTemplate(pronunciation.template);
      } catch (error) {
        console.error('Error fetching system templates:', error);
      } finally {
        setReviewTemplateLoading(false);
        setCustomLessonTemplateLoading(false);
        setPronunciationTemplateLoading(false);
      }
    };

    fetchSystemTemplates();
  }, [isTemplatesTabActive]);

  const selectTemplate = useCallback((id: string): PromptTemplateDocument | undefined => {
    setSelectedTemplateId(id);
    return templates.find(t => t.id === id);
  }, [templates]);

  const createTemplate = useCallback(async (
    name: string,
    systemPrompt: string,
    duration: number
  ) => {
    if (!teacherId || !name.trim() || !systemPrompt.trim()) {
      throw new Error('Please provide a template name and system prompt');
    }

    const newTemplate = await createPromptTemplate({
      teacherId,
      name: name.trim(),
      systemPrompt,
      defaultDurationMinutes: duration,
    });
    setTemplates(prev => [...prev, newTemplate]);
  }, [teacherId]);

  const saveReviewTemplate = useCallback(async () => {
    if (!teacherId || !editedReviewTemplate.trim()) return;

    setReviewTemplateSaving(true);
    try {
      await updateWeeklyReviewTemplate(editedReviewTemplate, teacherId);
      setReviewTemplate(prev => prev ? { ...prev, template: editedReviewTemplate } : prev);
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    } finally {
      setReviewTemplateSaving(false);
    }
  }, [teacherId, editedReviewTemplate]);

  // Discard unsaved changes (revert to what's in Firestore)
  const discardReviewChanges = useCallback(() => {
    if (reviewTemplate) {
      setEditedReviewTemplate(reviewTemplate.template);
    }
  }, [reviewTemplate]);

  // Reset to hardcoded default (populates editor, user must save)
  const resetReviewToDefault = useCallback(() => {
    setEditedReviewTemplate(DEFAULT_WEEKLY_REVIEW_TEMPLATE);
  }, []);

  // Custom Lesson Template handlers
  const saveCustomLessonTemplate = useCallback(async () => {
    if (!teacherId || !editedCustomLessonTemplate.trim()) return;

    setCustomLessonTemplateSaving(true);
    try {
      await updateCustomLessonTemplate(editedCustomLessonTemplate, teacherId);
      setCustomLessonTemplate(prev => prev ? { ...prev, template: editedCustomLessonTemplate } : prev);
    } catch (error) {
      console.error('Error saving custom lesson template:', error);
      throw error;
    } finally {
      setCustomLessonTemplateSaving(false);
    }
  }, [teacherId, editedCustomLessonTemplate]);

  const discardCustomLessonChanges = useCallback(() => {
    if (customLessonTemplate) {
      setEditedCustomLessonTemplate(customLessonTemplate.template);
    }
  }, [customLessonTemplate]);

  const resetCustomLessonToDefault = useCallback(() => {
    setEditedCustomLessonTemplate(DEFAULT_CUSTOM_LESSON_TEMPLATE);
  }, []);

  // Pronunciation Coach Template handlers
  const savePronunciationTemplate = useCallback(async () => {
    if (!teacherId || !editedPronunciationTemplate.trim()) return;

    setPronunciationTemplateSaving(true);
    try {
      await updatePronunciationCoachTemplate(editedPronunciationTemplate, teacherId);
      setPronunciationTemplate(prev => prev ? { ...prev, template: editedPronunciationTemplate } : prev);
    } catch (error) {
      console.error('Error saving pronunciation template:', error);
      throw error;
    } finally {
      setPronunciationTemplateSaving(false);
    }
  }, [teacherId, editedPronunciationTemplate]);

  const discardPronunciationChanges = useCallback(() => {
    if (pronunciationTemplate) {
      setEditedPronunciationTemplate(pronunciationTemplate.template);
    }
  }, [pronunciationTemplate]);

  const resetPronunciationToDefault = useCallback(() => {
    setEditedPronunciationTemplate(DEFAULT_PRONUNCIATION_COACH_TEMPLATE);
  }, []);

  const reviewTemplateChanged = editedReviewTemplate !== reviewTemplate?.template;
  const customLessonTemplateChanged = editedCustomLessonTemplate !== customLessonTemplate?.template;
  const pronunciationTemplateChanged = editedPronunciationTemplate !== pronunciationTemplate?.template;

  return {
    templates,
    selectedTemplateId,
    selectTemplate,
    createTemplate,
    loading,
    // Weekly review template
    reviewTemplate,
    editedReviewTemplate,
    setEditedReviewTemplate,
    saveReviewTemplate,
    discardReviewChanges,
    resetReviewToDefault,
    reviewTemplateLoading,
    reviewTemplateSaving,
    reviewTemplateChanged,
    // Custom lesson template
    customLessonTemplate,
    editedCustomLessonTemplate,
    setEditedCustomLessonTemplate,
    saveCustomLessonTemplate,
    discardCustomLessonChanges,
    resetCustomLessonToDefault,
    customLessonTemplateLoading,
    customLessonTemplateSaving,
    customLessonTemplateChanged,
    // Pronunciation coach template
    pronunciationTemplate,
    editedPronunciationTemplate,
    setEditedPronunciationTemplate,
    savePronunciationTemplate,
    discardPronunciationChanges,
    resetPronunciationToDefault,
    pronunciationTemplateLoading,
    pronunciationTemplateSaving,
    pronunciationTemplateChanged,
  };
}
