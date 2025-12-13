/**
 * Firebase Missions Service
 *
 * CRUD operations for mission documents in Firestore.
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
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  MissionDocument,
  CreateMissionInput,
  UpdateMissionInput,
} from '../../types/firestore';

const MISSIONS_COLLECTION = 'missions';

/**
 * Clear isFirstLesson flag from all lessons for a teacher
 * Called before setting a new first lesson to ensure only one exists
 */
const clearFirstLessonFlag = async (teacherId: string, excludeMissionId?: string): Promise<void> => {
  if (!db) return;

  try {
    const missionsRef = collection(db, MISSIONS_COLLECTION);
    const q = query(
      missionsRef,
      where('teacherId', '==', teacherId),
      where('isFirstLesson', '==', true)
    );
    const snapshot = await getDocs(q);

    const updates = snapshot.docs
      .filter(doc => doc.id !== excludeMissionId)
      .map(doc => updateDoc(doc.ref, { isFirstLesson: false, updatedAt: Timestamp.now() }));

    await Promise.all(updates);
    console.log('[missions] Cleared isFirstLesson flag from', updates.length, 'lessons');
  } catch (error) {
    console.error('[missions] Error clearing first lesson flags:', error);
  }
};

/**
 * Create a new mission
 */
export const createMission = async (
  missionData: CreateMissionInput
): Promise<MissionDocument> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const missionRef = doc(collection(db, MISSIONS_COLLECTION));

    // Build mission object, excluding undefined values (Firestore doesn't accept undefined)
    const mission: MissionDocument = {
      id: missionRef.id,
      teacherId: missionData.teacherId,
      teacherName: missionData.teacherName,
      title: missionData.title,
      description: missionData.description || '', // Required lesson description
      scenario: missionData.scenario,
      tone: missionData.tone,
      vocabList: missionData.vocabList || [],
      isActive: missionData.isActive ?? true,
      showOnHomepage: missionData.showOnHomepage ?? true, // Default to showing on homepage
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only add optional fields if they have values
    if (missionData.imageUrl) mission.imageUrl = missionData.imageUrl;
    if (missionData.imageStoragePath) mission.imageStoragePath = missionData.imageStoragePath;
    if (missionData.groupId) mission.groupId = missionData.groupId;
    if (missionData.targetLevel) mission.targetLevel = missionData.targetLevel;
    if (missionData.systemPrompt) mission.systemPrompt = missionData.systemPrompt;
    if (missionData.durationMinutes !== undefined) mission.durationMinutes = missionData.durationMinutes;
    if (missionData.functionCallingEnabled !== undefined) mission.functionCallingEnabled = missionData.functionCallingEnabled;
    if (missionData.functionCallingInstructions) mission.functionCallingInstructions = missionData.functionCallingInstructions;
    if (missionData.isFirstLesson !== undefined) mission.isFirstLesson = missionData.isFirstLesson;
    if (missionData.assignedStudentIds?.length) mission.assignedStudentIds = missionData.assignedStudentIds;
    if (missionData.tasks?.length) mission.tasks = missionData.tasks;
    // Collection membership
    if (missionData.collectionId) mission.collectionId = missionData.collectionId;
    if (missionData.collectionOrder !== undefined) mission.collectionOrder = missionData.collectionOrder;

    // If this is marked as first lesson, clear the flag from other lessons
    if (missionData.isFirstLesson) {
      await clearFirstLessonFlag(missionData.teacherId);
    }

    console.log('[missions] Creating mission:', mission.title, 'for teacher:', mission.teacherId);
    await setDoc(missionRef, mission);
    console.log('[missions] Mission created successfully:', missionRef.id);

    return mission;
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code || 'unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[missions] Failed to create mission:', errorCode, errorMessage);
    throw new Error(`Firestore error (${errorCode}): ${errorMessage}`);
  }
};

/**
 * Get a single mission by ID
 */
export const getMission = async (missionId: string): Promise<MissionDocument | null> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const missionRef = doc(db, MISSIONS_COLLECTION, missionId);
    const missionSnap = await getDoc(missionRef);

    if (missionSnap.exists()) {
      return missionSnap.data() as MissionDocument;
    }

    return null;
  } catch (error) {
    console.error('Error fetching mission:', error);
    throw error;
  }
};

/**
 * Get all missions for a specific teacher
 */
export const getMissionsForTeacher = async (
  teacherId: string,
  activeOnly: boolean = false
): Promise<MissionDocument[]> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const missionsRef = collection(db, MISSIONS_COLLECTION);
    const constraints: QueryConstraint[] = [
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc'),
    ];

    if (activeOnly) {
      constraints.push(where('isActive', '==', true));
    }

    const q = query(missionsRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data() as MissionDocument);
  } catch (error) {
    console.error('Error fetching teacher missions:', error);
    throw error;
  }
};

// getMissionsForGroup removed - using direct teacherId on students instead

/**
 * Update an existing mission
 */
export const updateMission = async (
  missionData: UpdateMissionInput
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const { id, ...updates } = missionData;
    const missionRef = doc(db, MISSIONS_COLLECTION, id);

    // Clean the update object - remove undefined values (Firestore rejects undefined)
    // Note: ignoreUndefinedProperties is set in firebase config, but this is extra safety
    const cleanedUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanedUpdates[key] = value;
      }
    }

    // If setting isFirstLesson to true, clear the flag from other lessons first
    if (cleanedUpdates.isFirstLesson === true) {
      // Get the mission to find the teacherId
      const missionSnap = await getDoc(missionRef);
      if (missionSnap.exists()) {
        const teacherId = missionSnap.data().teacherId;
        await clearFirstLessonFlag(teacherId, id);
      }
    }

    console.log('[missions] Updating mission:', id, 'with fields:', Object.keys(cleanedUpdates));

    await updateDoc(missionRef, {
      ...cleanedUpdates,
      updatedAt: Timestamp.now(),
    });

    console.log('[missions] Mission updated successfully:', id);
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code || 'unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[missions] Error updating mission:', errorCode, errorMessage, error);
    throw new Error(`Firestore error (${errorCode}): ${errorMessage}`);
  }
};

/**
 * Delete a mission
 */
export const deleteMission = async (missionId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const missionRef = doc(db, MISSIONS_COLLECTION, missionId);
    await deleteDoc(missionRef);
  } catch (error) {
    console.error('Error deleting mission:', error);
    throw error;
  }
};

/**
 * Deactivate a mission (soft delete)
 */
export const deactivateMission = async (missionId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    await updateMission({
      id: missionId,
      isActive: false,
    });
  } catch (error) {
    console.error('Error deactivating mission:', error);
    throw error;
  }
};

// getAllActiveMissions removed - students now use getMissionsForStudent from students.ts

/**
 * Get all missions (for teacher dashboard)
 */
export const getAllMissions = async (): Promise<MissionDocument[]> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const missionsRef = collection(db, MISSIONS_COLLECTION);
    const q = query(missionsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data() as MissionDocument);
  } catch (error) {
    console.error('Error fetching all missions:', error);
    throw error;
  }
};

// getAvailableMissionsForStudent removed - students now use getMissionsForStudent from students.ts

// ==================== COLLECTION-RELATED FUNCTIONS ====================

/**
 * Get all lessons for a specific collection
 * @param collectionId - The collection ID
 * @param teacherId - The teacher's ID (required for security rules)
 */
export const getLessonsForCollection = async (
  collectionId: string,
  teacherId: string
): Promise<MissionDocument[]> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const missionsRef = collection(db, MISSIONS_COLLECTION);
    // Must include teacherId in query to satisfy Firestore security rules
    const q = query(
      missionsRef,
      where('teacherId', '==', teacherId),
      where('collectionId', '==', collectionId),
      orderBy('collectionOrder', 'asc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data() as MissionDocument);
  } catch (error) {
    console.error('[missions] Error fetching lessons for collection:', error);
    throw error;
  }
};

/**
 * Reorder lessons within a collection
 * Takes an array of lesson IDs in the new order
 */
export const reorderCollectionLessons = async (
  collectionId: string,
  lessonIds: string[]
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  // TypeScript narrowing - capture db after null check
  const firestore = db;

  try {
    const { writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(firestore);
    const now = Timestamp.now();

    lessonIds.forEach((lessonId, index) => {
      const missionRef = doc(firestore, MISSIONS_COLLECTION, lessonId);
      batch.update(missionRef, {
        collectionOrder: index,
        updatedAt: now,
      });
    });

    await batch.commit();
    console.log('[missions] Reordered', lessonIds.length, 'lessons in collection:', collectionId);
  } catch (error) {
    console.error('[missions] Error reordering lessons:', error);
    throw error;
  }
};

/**
 * Toggle lesson homepage visibility
 */
export const toggleLessonHomepage = async (
  lessonId: string,
  showOnHomepage: boolean
): Promise<void> => {
  await updateMission({
    id: lessonId,
    showOnHomepage,
  });
  console.log('[missions] Toggled homepage visibility for lesson:', lessonId, 'to:', showOnHomepage);
};

/**
 * Add a lesson to a collection
 * @param lessonId - The lesson to add
 * @param collectionId - The collection to add it to
 * @param teacherId - The teacher's ID (required for security rules)
 * @param order - Optional order position
 */
export const addLessonToCollection = async (
  lessonId: string,
  collectionId: string,
  teacherId: string,
  order?: number
): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    // If no order specified, get the next order value
    let lessonOrder = order;
    if (lessonOrder === undefined) {
      const existingLessons = await getLessonsForCollection(collectionId, teacherId);
      lessonOrder = existingLessons.length;
    }

    await updateMission({
      id: lessonId,
      collectionId,
      collectionOrder: lessonOrder,
    });
    console.log('[missions] Added lesson:', lessonId, 'to collection:', collectionId, 'at order:', lessonOrder);
  } catch (error) {
    console.error('[missions] Error adding lesson to collection:', error);
    throw error;
  }
};

/**
 * Remove a lesson from its collection
 */
export const removeLessonFromCollection = async (lessonId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const missionRef = doc(db, MISSIONS_COLLECTION, lessonId);
    await updateDoc(missionRef, {
      collectionId: null,
      collectionOrder: null,
      updatedAt: Timestamp.now(),
    });
    console.log('[missions] Removed lesson from collection:', lessonId);
  } catch (error) {
    console.error('[missions] Error removing lesson from collection:', error);
    throw error;
  }
};

/**
 * Get the next order value for a new lesson in a collection
 * @param collectionId - The collection ID
 * @param teacherId - The teacher's ID (required for security rules)
 */
export const getNextLessonOrder = async (collectionId: string, teacherId: string): Promise<number> => {
  try {
    const lessons = await getLessonsForCollection(collectionId, teacherId);
    if (lessons.length === 0) return 0;

    const maxOrder = Math.max(...lessons.map(l => l.collectionOrder ?? 0));
    return maxOrder + 1;
  } catch (error) {
    console.error('[missions] Error getting next lesson order:', error);
    return 0;
  }
};
