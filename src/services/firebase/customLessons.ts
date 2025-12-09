/**
 * Custom Lessons Service
 * CRUD operations for student-created personalized practice lessons
 * Collection: users/{userId}/customLessons
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
  orderBy,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { deleteLessonImage } from './storage';
import type { CustomLessonDocument, CreateCustomLessonInput, UpdateCustomLessonInput } from '../../types/firestore';

const getCustomLessonsCollection = (userId: string) => {
  if (!db) throw new Error('Firebase not configured');
  return collection(db, 'users', userId, 'customLessons');
};

/**
 * Get all custom lessons for a user
 * Ordered by createdAt descending (newest first)
 */
export const getCustomLessons = async (userId: string): Promise<CustomLessonDocument[]> => {
  const lessonsRef = getCustomLessonsCollection(userId);
  const q = query(lessonsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as CustomLessonDocument));
};

/**
 * Get a single custom lesson by ID
 */
export const getCustomLesson = async (
  userId: string,
  lessonId: string
): Promise<CustomLessonDocument | null> => {
  if (!db) throw new Error('Firebase not configured');

  const lessonRef = doc(db, 'users', userId, 'customLessons', lessonId);
  const snapshot = await getDoc(lessonRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as CustomLessonDocument;
};

/**
 * Create a new custom lesson
 */
export const createCustomLesson = async (
  userId: string,
  data: Omit<CreateCustomLessonInput, 'userId' | 'id'>
): Promise<CustomLessonDocument> => {
  if (!db) throw new Error('Firebase not configured');

  const lessonsRef = getCustomLessonsCollection(userId);
  const newDocRef = doc(lessonsRef);

  const lessonData: CustomLessonDocument = {
    id: newDocRef.id,
    userId,
    title: data.title,
    description: data.description,
    systemPrompt: data.systemPrompt,
    durationMinutes: 5, // Fixed at 5 minutes
    practiceCount: 0,
    createdAt: Timestamp.now(),
  };

  // Add optional fields if provided
  if (data.imageUrl) {
    lessonData.imageUrl = data.imageUrl;
  }
  if (data.imageStoragePath) {
    lessonData.imageStoragePath = data.imageStoragePath;
  }

  await setDoc(newDocRef, lessonData);
  console.log('[CustomLessons] Created lesson:', newDocRef.id);

  return lessonData;
};

/**
 * Update an existing custom lesson
 */
export const updateCustomLesson = async (
  userId: string,
  lessonId: string,
  updates: Omit<UpdateCustomLessonInput, 'id'>
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const lessonRef = doc(db, 'users', userId, 'customLessons', lessonId);

  // Filter out undefined values
  const cleanedUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      cleanedUpdates[key] = value;
    }
  }

  if (Object.keys(cleanedUpdates).length === 0) {
    console.log('[CustomLessons] No updates to apply');
    return;
  }

  await updateDoc(lessonRef, cleanedUpdates);
  console.log('[CustomLessons] Updated lesson:', lessonId);
};

/**
 * Delete a custom lesson
 * Also cleans up associated image from storage
 */
export const deleteCustomLesson = async (
  userId: string,
  lessonId: string
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  // First, get the lesson to check for image storage path
  const lesson = await getCustomLesson(userId, lessonId);

  if (lesson?.imageStoragePath) {
    try {
      await deleteLessonImage(lesson.imageStoragePath);
      console.log('[CustomLessons] Deleted associated image');
    } catch (error) {
      console.error('[CustomLessons] Failed to delete image:', error);
      // Continue with lesson deletion even if image deletion fails
    }
  }

  const lessonRef = doc(db, 'users', userId, 'customLessons', lessonId);
  await deleteDoc(lessonRef);

  console.log('[CustomLessons] Deleted lesson:', lessonId);
};

/**
 * Update the lastPracticedAt timestamp and increment practiceCount
 * Called when a user completes a practice session
 */
export const updateCustomLessonPracticed = async (
  userId: string,
  lessonId: string
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const lessonRef = doc(db, 'users', userId, 'customLessons', lessonId);

  await updateDoc(lessonRef, {
    lastPracticedAt: Timestamp.now(),
    practiceCount: increment(1),
  });

  console.log('[CustomLessons] Updated practice stats for lesson:', lessonId);
};
