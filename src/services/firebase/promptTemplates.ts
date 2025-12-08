/**
 * Prompt Templates Service
 * CRUD operations for saved prompt templates
 * Templates are private per teacher
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { PromptTemplateDocument, CreatePromptTemplateInput } from '../../types/firestore';

const COLLECTION = 'promptTemplates';

/**
 * Create a new prompt template
 */
export const createPromptTemplate = async (
  data: CreatePromptTemplateInput
): Promise<PromptTemplateDocument> => {
  if (!db) throw new Error('Firebase not configured');

  try {
    const docRef = doc(collection(db, COLLECTION));

    // Build template object, excluding undefined values (Firestore doesn't accept undefined)
    const template: PromptTemplateDocument = {
      id: docRef.id,
      teacherId: data.teacherId,
      name: data.name,
      systemPrompt: data.systemPrompt,
      isDefault: data.isDefault ?? false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only add optional fields if they have values
    if (data.defaultDurationMinutes !== undefined) {
      template.defaultDurationMinutes = data.defaultDurationMinutes;
    }
    if (data.functionCallingInstructions) {
      template.functionCallingInstructions = data.functionCallingInstructions;
    }

    console.log('[promptTemplates] Creating template:', template.name, 'for teacher:', data.teacherId);
    await setDoc(docRef, template);
    console.log('[promptTemplates] Template created successfully:', docRef.id);
    return template;
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code || 'unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[promptTemplates] Failed to create template:', errorCode, errorMessage);
    throw new Error(`Firestore error (${errorCode}): ${errorMessage}`);
  }
};

/**
 * Get all prompt templates for a specific teacher
 * Templates are private - each teacher only sees their own
 */
export const getPromptTemplatesForTeacher = async (
  teacherId: string
): Promise<PromptTemplateDocument[]> => {
  if (!db) throw new Error('Firebase not configured');

  const q = query(
    collection(db, COLLECTION),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as PromptTemplateDocument);
};

/**
 * Get a single prompt template by ID
 */
export const getPromptTemplate = async (
  id: string
): Promise<PromptTemplateDocument | null> => {
  if (!db) throw new Error('Firebase not configured');

  const docRef = doc(db, COLLECTION, id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as PromptTemplateDocument) : null;
};

/**
 * Update an existing prompt template
 */
export const updatePromptTemplate = async (
  id: string,
  updates: Partial<Omit<PromptTemplateDocument, 'id' | 'createdAt' | 'teacherId'>>
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  await updateDoc(doc(db, COLLECTION, id), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

/**
 * Delete a prompt template
 */
export const deletePromptTemplate = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, COLLECTION, id));
};

/**
 * Get the default template for a teacher (if any)
 */
export const getDefaultTemplate = async (
  teacherId: string
): Promise<PromptTemplateDocument | null> => {
  if (!db) throw new Error('Firebase not configured');

  const q = query(
    collection(db, COLLECTION),
    where('teacherId', '==', teacherId),
    where('isDefault', '==', true)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  return snapshot.docs[0].data() as PromptTemplateDocument;
};

/**
 * Set a template as the default (unsets any existing default)
 */
export const setDefaultTemplate = async (
  teacherId: string,
  templateId: string
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  // First, unset any existing defaults
  const existingDefault = await getDefaultTemplate(teacherId);
  if (existingDefault && existingDefault.id !== templateId) {
    await updatePromptTemplate(existingDefault.id, { isDefault: false });
  }

  // Set the new default
  await updatePromptTemplate(templateId, { isDefault: true });
};

/**
 * Duplicate a template with a new name
 */
export const duplicateTemplate = async (
  templateId: string,
  newName: string,
  teacherId: string
): Promise<PromptTemplateDocument> => {
  const original = await getPromptTemplate(templateId);
  if (!original) throw new Error('Template not found');

  return createPromptTemplate({
    teacherId,
    name: newName,
    systemPrompt: original.systemPrompt,
    defaultDurationMinutes: original.defaultDurationMinutes,
    functionCallingInstructions: original.functionCallingInstructions,
    isDefault: false,
  });
};
