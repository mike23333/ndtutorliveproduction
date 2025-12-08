/**
 * Session Data Service
 * Handles struggle items and user preferences from Gemini function calls
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  arrayUnion,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type {
  SaveStruggleItemParams,
  UpdateUserProfileParams,
  ShowSessionSummaryParams,
} from '../../types/functions';
import type {
  StruggleDocument,
  UserProfileDocument,
  SessionSummaryDocument,
  ReviewLessonDocument,
} from '../../types/firestore';

// ==================== STRUGGLE ITEMS ====================

/**
 * Save a struggle item to user's struggles collection
 * Called when Gemini's save_struggle_item function is triggered
 *
 * Stored under users/{userId}/struggles for easy querying when
 * generating weekly review lessons.
 */
export const saveStruggleItem = async (
  sessionId: string,
  userId: string,
  params: SaveStruggleItemParams,
  missionId?: string
): Promise<StruggleDocument> => {
  if (!db) throw new Error('Firebase not configured');

  const struggleRef = doc(collection(db, `users/${userId}/struggles`));

  const struggle: StruggleDocument = {
    id: struggleRef.id,
    userId,
    sessionId,
    missionId: missionId || null,
    word: params.word,
    struggleType: params.struggle_type,
    context: params.context,
    severity: params.severity || 'moderate',
    timestamp: params.timestamp,
    createdAt: Timestamp.now(),
    // Review tracking fields
    reviewCount: 0,
    lastReviewedAt: null,
    mastered: false,
    includedInReviews: [],
  };

  await setDoc(struggleRef, struggle);
  console.log('[SessionData] Saved struggle item:', params.word);

  return struggle;
};

/**
 * Get all struggle items for a user (for review lessons)
 */
export const getUserStruggles = async (
  userId: string,
  options?: {
    since?: Date;
    masteredOnly?: boolean;
    unmasteredOnly?: boolean;
    limit?: number;
  }
): Promise<StruggleDocument[]> => {
  if (!db) throw new Error('Firebase not configured');

  const { where, limit: lim } = await import('firebase/firestore');
  const strugglesRef = collection(db, `users/${userId}/struggles`);

  // Build query constraints
  const constraints: any[] = [orderBy('createdAt', 'desc')];

  if (options?.since) {
    constraints.push(where('createdAt', '>=', Timestamp.fromDate(options.since)));
  }

  if (options?.unmasteredOnly) {
    constraints.push(where('mastered', '==', false));
  } else if (options?.masteredOnly) {
    constraints.push(where('mastered', '==', true));
  }

  if (options?.limit) {
    constraints.push(lim(options.limit));
  }

  const q = query(strugglesRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as StruggleDocument);
};

/**
 * Get struggles for a specific session
 */
export const getSessionStruggles = async (
  userId: string,
  sessionId: string
): Promise<StruggleDocument[]> => {
  if (!db) throw new Error('Firebase not configured');

  const { where } = await import('firebase/firestore');
  const strugglesRef = collection(db, `users/${userId}/struggles`);
  const q = query(
    strugglesRef,
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as StruggleDocument);
};

/**
 * Mark a struggle item as reviewed (increment count)
 */
export const markStruggleReviewed = async (
  userId: string,
  struggleId: string,
  mastered: boolean = false
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const { increment } = await import('firebase/firestore');
  const struggleRef = doc(db, `users/${userId}/struggles`, struggleId);

  await updateDoc(struggleRef, {
    reviewCount: increment(1),
    lastReviewedAt: Timestamp.now(),
    mastered,
  });
};

// ==================== USER PROFILE ====================

/**
 * Update user profile with learned preferences
 * Called when Gemini's update_user_profile function is triggered
 */
export const updateUserPreference = async (
  userId: string,
  params: UpdateUserProfileParams
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const profileRef = doc(db, `users/${userId}/profile`, 'preferences');
  const profileSnap = await getDoc(profileRef);

  const newPreference = {
    category: params.category,
    value: params.value,
    sentiment: params.sentiment,
    confidence: params.confidence || 0.8,
    updatedAt: Timestamp.now(),
  };

  if (profileSnap.exists()) {
    // Check if this preference already exists (same category + value)
    const existingData = profileSnap.data() as UserProfileDocument;
    const existingIndex = existingData.preferences.findIndex(
      (p) => p.category === params.category && p.value === params.value
    );

    if (existingIndex >= 0) {
      // Update existing preference
      const updatedPreferences = [...existingData.preferences];
      updatedPreferences[existingIndex] = newPreference;

      await updateDoc(profileRef, {
        preferences: updatedPreferences,
        lastUpdated: Timestamp.now(),
      });
    } else {
      // Add new preference using arrayUnion
      await updateDoc(profileRef, {
        preferences: arrayUnion(newPreference),
        lastUpdated: Timestamp.now(),
      });
    }
  } else {
    // Create new profile document
    await setDoc(profileRef, {
      preferences: [newPreference],
      lastUpdated: Timestamp.now(),
    });
  }

  console.log('[SessionData] Updated user preference:', params.category, params.value);
};

/**
 * Get user profile preferences
 */
export const getUserPreferences = async (
  userId: string
): Promise<UserProfileDocument | null> => {
  if (!db) throw new Error('Firebase not configured');

  const profileRef = doc(db, `users/${userId}/profile`, 'preferences');
  const snapshot = await getDoc(profileRef);

  return snapshot.exists() ? (snapshot.data() as UserProfileDocument) : null;
};

// ==================== SESSION SUMMARY ====================

/**
 * Save session summary when show_session_summary is triggered
 * - Saves detailed summary to users/{userId}/sessionSummaries
 * - Updates aggregate stats on users/{userId} for fast UI reads
 */
export const saveSessionSummary = async (
  sessionId: string,
  userId: string,
  missionId: string,
  durationSeconds: number,
  params: ShowSessionSummaryParams
): Promise<SessionSummaryDocument> => {
  if (!db) throw new Error('Firebase not configured');

  const { increment } = await import('firebase/firestore');

  // Save detailed summary to subcollection
  const summaryRef = doc(db, `users/${userId}/sessionSummaries`, sessionId);

  const summary: SessionSummaryDocument = {
    sessionId,
    userId,
    missionId,
    didWell: params.did_well,
    workOn: params.work_on,
    stars: params.stars,
    summaryText: params.summary_text,
    encouragement: params.encouragement,
    durationSeconds,
    createdAt: Timestamp.now(),
  };

  await setDoc(summaryRef, summary);
  console.log('[SessionData] Saved session summary with', params.stars, 'stars');

  // Update aggregate stats on user document for fast UI reads
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Update existing user with incremented stats
      await updateDoc(userRef, {
        totalStars: increment(params.stars),
        totalSessions: increment(1),
        totalPracticeTime: increment(durationSeconds),
        lastSessionAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create user stats if doesn't exist
      await setDoc(userRef, {
        totalStars: params.stars,
        totalSessions: 1,
        totalPracticeTime: durationSeconds,
        lastSessionAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }, { merge: true });
    }
    console.log('[SessionData] Updated user aggregate stats');
  } catch (error) {
    console.warn('[SessionData] Could not update user stats:', error);
  }

  // Also update the session document with the star rating
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      'feedback.overallScore': params.stars,
      'feedback.strengths': params.did_well,
      'feedback.areasForImprovement': params.work_on,
      'feedback.generatedAt': Timestamp.now(),
      status: 'completed',
      endTime: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn('[SessionData] Could not update session with summary:', error);
  }

  return summary;
};

/**
 * Get session summary by session ID
 */
export const getSessionSummary = async (
  userId: string,
  sessionId: string
): Promise<SessionSummaryDocument | null> => {
  if (!db) throw new Error('Firebase not configured');

  const summaryRef = doc(db, `users/${userId}/sessionSummaries`, sessionId);
  const snapshot = await getDoc(summaryRef);

  return snapshot.exists() ? (snapshot.data() as SessionSummaryDocument) : null;
};

/**
 * Get all summaries for a user (for progress tracking)
 */
export const getUserSummaries = async (
  userId: string,
  options?: {
    since?: Date;
    limit?: number;
  }
): Promise<SessionSummaryDocument[]> => {
  if (!db) throw new Error('Firebase not configured');

  const { where, limit: lim } = await import('firebase/firestore');
  const summariesRef = collection(db, `users/${userId}/sessionSummaries`);

  const constraints: any[] = [orderBy('createdAt', 'desc')];

  if (options?.since) {
    constraints.push(where('createdAt', '>=', Timestamp.fromDate(options.since)));
  }

  if (options?.limit) {
    constraints.push(lim(options.limit));
  }

  const q = query(summariesRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as SessionSummaryDocument);
};

/**
 * Get user's star statistics for UI display
 * Fast read from user document (no queries needed)
 */
export const getUserStarStats = async (
  userId: string
): Promise<{
  totalSessions: number;
  totalStars: number;
  averageStars: number;
  totalPracticeTime: number;
  lastSessionAt: Date | null;
}> => {
  if (!db) throw new Error('Firebase not configured');

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return {
      totalSessions: 0,
      totalStars: 0,
      averageStars: 0,
      totalPracticeTime: 0,
      lastSessionAt: null,
    };
  }

  const data = userSnap.data();
  const totalSessions = data.totalSessions || 0;
  const totalStars = data.totalStars || 0;

  return {
    totalSessions,
    totalStars,
    averageStars: totalSessions > 0 ? totalStars / totalSessions : 0,
    totalPracticeTime: data.totalPracticeTime || 0,
    lastSessionAt: data.lastSessionAt?.toDate() || null,
  };
};

// ==================== REVIEW LESSONS ====================

/**
 * Get the most recent ready review lesson for a user
 * Used by HomePage to display the WeeklyReviewCard
 */
export const getActiveReviewLesson = async (
  userId: string
): Promise<ReviewLessonDocument | null> => {
  if (!db) throw new Error('Firebase not configured');

  const { where, limit: lim } = await import('firebase/firestore');
  const reviewsRef = collection(db, `users/${userId}/reviewLessons`);

  const q = query(
    reviewsRef,
    where('status', '==', 'ready'),
    orderBy('createdAt', 'desc'),
    lim(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  return snapshot.docs[0].data() as ReviewLessonDocument;
};

/**
 * Get all pending/ready review lessons for a user
 */
export const getPendingReviewLessons = async (
  userId: string
): Promise<ReviewLessonDocument[]> => {
  if (!db) throw new Error('Firebase not configured');

  const { where } = await import('firebase/firestore');
  const reviewsRef = collection(db, `users/${userId}/reviewLessons`);

  const q = query(
    reviewsRef,
    where('status', 'in', ['pending', 'ready']),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as ReviewLessonDocument);
};

/**
 * Mark a review lesson as completed
 * Called when user finishes a review session
 */
export const completeReviewLesson = async (
  userId: string,
  reviewId: string,
  sessionId: string,
  stars: number
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const reviewRef = doc(db, `users/${userId}/reviewLessons`, reviewId);

  await updateDoc(reviewRef, {
    status: 'completed',
    completedAt: Timestamp.now(),
    sessionId,
    stars,
  });

  console.log('[SessionData] Marked review lesson as completed:', reviewId, 'with', stars, 'stars');
};

/**
 * Skip a review lesson
 * Called when user chooses to skip this week's review
 */
export const skipReviewLesson = async (
  userId: string,
  reviewId: string
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const reviewRef = doc(db, `users/${userId}/reviewLessons`, reviewId);

  await updateDoc(reviewRef, {
    status: 'skipped',
  });

  console.log('[SessionData] Skipped review lesson:', reviewId);
};

/**
 * Get a specific review lesson by ID
 */
export const getReviewLesson = async (
  userId: string,
  reviewId: string
): Promise<ReviewLessonDocument | null> => {
  if (!db) throw new Error('Firebase not configured');

  const reviewRef = doc(db, `users/${userId}/reviewLessons`, reviewId);
  const snapshot = await getDoc(reviewRef);

  return snapshot.exists() ? (snapshot.data() as ReviewLessonDocument) : null;
};
