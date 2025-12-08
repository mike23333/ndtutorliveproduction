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
      scenario: missionData.scenario,
      tone: missionData.tone,
      vocabList: missionData.vocabList || [],
      isActive: missionData.isActive ?? true,
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

/**
 * Get all missions for a specific group
 */
export const getMissionsForGroup = async (
  groupId: string,
  activeOnly: boolean = false
): Promise<MissionDocument[]> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const missionsRef = collection(db, MISSIONS_COLLECTION);
    const constraints: QueryConstraint[] = [
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc'),
    ];

    if (activeOnly) {
      constraints.push(where('isActive', '==', true));
    }

    const q = query(missionsRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data() as MissionDocument);
  } catch (error) {
    console.error('Error fetching group missions:', error);
    throw error;
  }
};

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

/**
 * Get all active missions (for homepage display)
 */
export const getAllActiveMissions = async (): Promise<MissionDocument[]> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const missionsRef = collection(db, MISSIONS_COLLECTION);
    const q = query(
      missionsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data() as MissionDocument);
  } catch (error) {
    console.error('Error fetching all active missions:', error);
    throw error;
  }
};

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

/**
 * Get active missions available for a student
 */
export const getAvailableMissionsForStudent = async (
  groupIds: string[]
): Promise<MissionDocument[]> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  if (groupIds.length === 0) {
    return [];
  }

  try {
    const missionsRef = collection(db, MISSIONS_COLLECTION);

    // Firestore 'in' queries are limited to 10 items
    // If more than 10 groups, we need to batch the queries
    const batchSize = 10;
    const batches: MissionDocument[][] = [];

    for (let i = 0; i < groupIds.length; i += batchSize) {
      const batchGroupIds = groupIds.slice(i, i + batchSize);

      const q = query(
        missionsRef,
        where('groupId', 'in', batchGroupIds),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      batches.push(querySnapshot.docs.map(doc => doc.data() as MissionDocument));
    }

    return batches.flat();
  } catch (error) {
    console.error('Error fetching available missions:', error);
    throw error;
  }
};
