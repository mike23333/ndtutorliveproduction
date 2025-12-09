import { useState, useEffect, useCallback } from 'react';
import {
  getPromptTemplatesForTeacher,
  createPromptTemplate,
} from '../services/firebase/promptTemplates';
import {
  getWeeklyReviewTemplate,
  updateWeeklyReviewTemplate,
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
  resetReviewTemplate: () => void;
  reviewTemplateLoading: boolean;
  reviewTemplateSaving: boolean;
  reviewTemplateChanged: boolean;
}

export function usePromptTemplates(
  teacherId: string | undefined,
  isTemplatesTabActive: boolean
): UsePromptTemplatesResult {
  // Prompt templates state
  const [templates, setTemplates] = useState<PromptTemplateDocument[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(false);

  // System template state
  const [reviewTemplate, setReviewTemplate] = useState<SystemTemplateDocument | null>(null);
  const [editedReviewTemplate, setEditedReviewTemplate] = useState('');
  const [reviewTemplateLoading, setReviewTemplateLoading] = useState(false);
  const [reviewTemplateSaving, setReviewTemplateSaving] = useState(false);

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

  // Fetch weekly review template when templates tab is active
  useEffect(() => {
    const fetchReviewTemplate = async () => {
      if (!isTemplatesTabActive) return;

      setReviewTemplateLoading(true);
      try {
        const template = await getWeeklyReviewTemplate();
        setReviewTemplate(template);
        setEditedReviewTemplate(template.template);
      } catch (error) {
        console.error('Error fetching review template:', error);
      } finally {
        setReviewTemplateLoading(false);
      }
    };

    fetchReviewTemplate();
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

  const resetReviewTemplate = useCallback(() => {
    if (reviewTemplate) {
      setEditedReviewTemplate(reviewTemplate.template);
    }
  }, [reviewTemplate]);

  const reviewTemplateChanged = editedReviewTemplate !== reviewTemplate?.template;

  return {
    templates,
    selectedTemplateId,
    selectTemplate,
    createTemplate,
    loading,
    reviewTemplate,
    editedReviewTemplate,
    setEditedReviewTemplate,
    saveReviewTemplate,
    resetReviewTemplate,
    reviewTemplateLoading,
    reviewTemplateSaving,
    reviewTemplateChanged,
  };
}
