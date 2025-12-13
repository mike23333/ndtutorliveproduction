import { useState, useCallback } from 'react';
import type { CollectionDocument, CollectionVisibility } from '../types/firestore';

/**
 * Form data for creating/editing a collection
 */
export interface CollectionFormData {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  imageStoragePath: string | null;
  color: string;
  visibility: CollectionVisibility;
}

interface UseCollectionFormResult {
  formData: CollectionFormData;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setCategory: (category: string) => void;
  setImageUrl: (url: string) => void;
  setImageStoragePath: (path: string | null) => void;
  setImage: (url: string, path: string) => void;
  clearImage: () => void;
  setColor: (color: string) => void;
  setVisibility: (visibility: CollectionVisibility) => void;
  reset: () => void;
  loadFromCollection: (collection: CollectionDocument) => void;
  isValid: boolean;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

const initialFormData: CollectionFormData = {
  title: '',
  description: '',
  category: '',
  imageUrl: '',
  imageStoragePath: null,
  color: '#3B82F6', // Default blue
  visibility: 'visible',
};

export function useCollectionForm(): UseCollectionFormResult {
  const [formData, setFormData] = useState<CollectionFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const setTitle = useCallback((title: string) => {
    setFormData(prev => ({ ...prev, title }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setFormData(prev => ({ ...prev, description }));
  }, []);

  const setCategory = useCallback((category: string) => {
    setFormData(prev => ({ ...prev, category }));
  }, []);

  const setImageUrl = useCallback((imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  }, []);

  const setImageStoragePath = useCallback((imageStoragePath: string | null) => {
    setFormData(prev => ({ ...prev, imageStoragePath }));
  }, []);

  const setImage = useCallback((url: string, path: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url, imageStoragePath: path }));
  }, []);

  const clearImage = useCallback(() => {
    setFormData(prev => ({ ...prev, imageUrl: '', imageStoragePath: null }));
  }, []);

  const setColor = useCallback((color: string) => {
    setFormData(prev => ({ ...prev, color }));
  }, []);

  const setVisibility = useCallback((visibility: CollectionVisibility) => {
    setFormData(prev => ({ ...prev, visibility }));
  }, []);

  const reset = useCallback(() => {
    setFormData(initialFormData);
    setSaving(false);
    setIsUploading(false);
  }, []);

  const loadFromCollection = useCallback((collection: CollectionDocument) => {
    setFormData({
      title: collection.title,
      description: collection.description || '',
      category: collection.category,
      imageUrl: collection.imageUrl,
      imageStoragePath: collection.imageStoragePath || null,
      color: collection.color || '#3B82F6',
      visibility: collection.visibility,
    });
  }, []);

  // Validation: title and category required, image required
  const isValid =
    formData.title.trim().length > 0 &&
    formData.category.trim().length > 0 &&
    formData.imageUrl.trim().length > 0;

  return {
    formData,
    setTitle,
    setDescription,
    setCategory,
    setImageUrl,
    setImageStoragePath,
    setImage,
    clearImage,
    setColor,
    setVisibility,
    reset,
    loadFromCollection,
    isValid,
    saving,
    setSaving,
    isUploading,
    setIsUploading,
  };
}
