/**
 * Firebase Activities Service
 *
 * CRUD operations for activity tracking in Firestore.
 * Used for real-time activity feed on teacher dashboard.
 */

import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { ActivityDocument, CreateActivityInput } from '../../types/firestore';

const ACTIVITIES_COLLECTION = 'activities';

/**
 * Record a new activity
 */
export const recordActivity = async (
  activityData: CreateActivityInput
): Promise<ActivityDocument> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION));

    const activity: ActivityDocument = {
      id: activityRef.id,
      teacherId: activityData.teacherId,
      studentId: activityData.studentId,
      studentName: activityData.studentName,
      action: activityData.action,
      lessonId: activityData.lessonId,
      lessonTitle: activityData.lessonTitle,
      timestamp: Timestamp.now(),
    };

    // Only add stars if provided
    if (activityData.stars !== undefined) {
      activity.stars = activityData.stars;
    }

    await setDoc(activityRef, activity);
    console.log('[activities] Recorded activity:', activity.action, 'for student:', activity.studentName);

    return activity;
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code || 'unknown';
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[activities] Failed to record activity:', errorCode, errorMessage);
    throw new Error(`Firestore error (${errorCode}): ${errorMessage}`);
  }
};

/**
 * Get recent activities for a teacher (one-time fetch)
 */
export const getRecentActivities = async (
  teacherId: string,
  limitCount: number = 10
): Promise<ActivityDocument[]> => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  try {
    const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
    const q = query(
      activitiesRef,
      where('teacherId', '==', teacherId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as ActivityDocument);
  } catch (error) {
    console.error('[activities] Error fetching recent activities:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time activity updates for a teacher
 * Returns an unsubscribe function
 */
export const subscribeToActivities = (
  teacherId: string,
  limitCount: number = 10,
  onActivities: (activities: ActivityDocument[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!db) {
    throw new Error('Firebase is not configured. Please check your environment variables.');
  }

  const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
  const q = query(
    activitiesRef,
    where('teacherId', '==', teacherId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map(doc => doc.data() as ActivityDocument);
      onActivities(activities);
    },
    (error) => {
      console.error('[activities] Real-time subscription error:', error);
      onError?.(error);
    }
  );
};
