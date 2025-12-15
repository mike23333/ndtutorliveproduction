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
  increment,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type {
  SaveStruggleItemParams,
  MarkForReviewParams,
  UpdateUserProfileParams,
  ShowSessionSummaryParams,
} from '../../types/functions';
import type {
  StruggleDocument,
  ReviewItemDocument,
  UserProfileDocument,
  SessionSummaryDocument,
  ReviewLessonDocument,
} from '../../types/firestore';
import { checkAndAwardBadges } from './badges';
import { recordActivity } from './activities';
import type { BadgeDefinition } from '../../types/badges';

// ==================== CURRENT LESSON TRACKING ====================

/**
 * Set the current lesson when a session starts
 * Used for "Continue Learning" feature on homepage
 */
export const setCurrentLesson = async (
  userId: string,
  lesson: {
    missionId: string;
    title: string;
    imageUrl?: string;
  }
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const userRef = doc(db, 'users', userId);

  await updateDoc(userRef, {
    currentLesson: {
      missionId: lesson.missionId,
      title: lesson.title,
      imageUrl: lesson.imageUrl || null,
      startedAt: Timestamp.now(),
    },
    updatedAt: Timestamp.now(),
  });

  console.log('[SessionData] Set current lesson:', lesson.title);

  // Record "started" activity for teacher dashboard
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const teacherId = userData.teacherId;
      const studentName = userData.displayName || 'Student';

      if (teacherId) {
        await recordActivity({
          teacherId,
          studentId: userId,
          studentName,
          action: 'started',
          lessonId: lesson.missionId,
          lessonTitle: lesson.title,
        });
        console.log('[SessionData] Recorded started activity for teacher dashboard');
      }
    }
  } catch (error) {
    console.warn('[SessionData] Could not record started activity:', error);
  }
};

/**
 * Clear the current lesson when a session completes
 */
export const clearCurrentLesson = async (userId: string): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const { deleteField } = await import('firebase/firestore');
  const userRef = doc(db, 'users', userId);

  await updateDoc(userRef, {
    currentLesson: deleteField(),
    updatedAt: Timestamp.now(),
  });

  console.log('[SessionData] Cleared current lesson');
};

// ==================== PRACTICE TIME TRACKING ====================

/**
 * Save only the practice time for incomplete sessions
 * Called when user exits early (before timer ends) via X button or mic stop
 * Does NOT affect stars, session count, streaks, or other summary stats
 *
 * @param userId - User ID
 * @param durationSeconds - Elapsed time in seconds
 */
export const savePracticeTimeOnly = async (
  userId: string,
  durationSeconds: number
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');
  if (durationSeconds <= 0) return; // Don't save if no time spent

  const userRef = doc(db, 'users', userId);
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  await updateDoc(userRef, {
    totalPracticeTime: increment(durationSeconds),
    [`practiceHistory.${todayStr}`]: increment(durationSeconds),
    updatedAt: Timestamp.now(),
  });

  console.log('[SessionData] Saved partial practice time:', durationSeconds, 'seconds');
};

// ==================== STREAK CALCULATION ====================

/**
 * Calculate streak based on last practice date
 * - Same day: keep streak
 * - Yesterday: increment streak
 * - 2+ days ago: reset to 1
 */
export const calculateStreak = (
  lastPracticeDate: string | undefined,
  currentStreak: number | undefined
): { newStreak: number } => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  if (!lastPracticeDate) {
    // First ever session
    return { newStreak: 1 };
  }

  if (lastPracticeDate === todayStr) {
    // Already practiced today, keep current streak
    return { newStreak: currentStreak || 1 };
  }

  // Check if last practice was yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastPracticeDate === yesterdayStr) {
    // Practiced yesterday, increment streak
    return { newStreak: (currentStreak || 0) + 1 };
  }

  // More than 1 day gap, reset streak
  return { newStreak: 1 };
};

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

// ==================== REVIEW ITEMS (NEW) ====================

/**
 * Save a review item to user's reviewItems collection
 * Called when Gemini's mark_for_review function is triggered
 *
 * Stored under users/{userId}/reviewItems for weekly review lesson generation.
 * Enhanced schema captures more linguistic context than legacy struggles.
 *
 * @param sessionId - Current session ID
 * @param userId - User ID
 * @param params - Mark for review parameters from Gemini
 * @param missionId - Optional lesson context
 * @param audioBlob - Optional WAV blob of error audio (uploaded in background)
 */
export const saveReviewItem = async (
  sessionId: string,
  userId: string,
  params: MarkForReviewParams,
  missionId?: string,
  audioBlob?: Blob | null
): Promise<ReviewItemDocument> => {
  if (!db) throw new Error('Firebase not configured');

  const reviewItemRef = doc(collection(db, `users/${userId}/reviewItems`));
  const reviewItemId = reviewItemRef.id;

  const reviewItem: ReviewItemDocument = {
    id: reviewItemId,
    userId,
    sessionId,
    missionId: missionId || null,
    errorType: params.error_type,
    severity: params.severity,
    userSentence: params.user_sentence,
    correction: params.correction,
    explanation: params.explanation,
    createdAt: Timestamp.now(),
    // Review tracking fields
    reviewCount: 0,
    lastReviewedAt: null,
    mastered: false,
    includedInReviews: [],
  };

  // Save document immediately (non-blocking audio upload)
  await setDoc(reviewItemRef, reviewItem);
  console.log('[SessionData] Saved review item:', params.error_type, '-', params.user_sentence.substring(0, 30) + '...');

  // Upload audio in background if available (non-blocking, fire-and-forget)
  if (audioBlob) {
    uploadErrorAudioAndUpdate(reviewItemId, userId, audioBlob).catch((error) => {
      console.warn('[SessionData] Audio upload failed (non-blocking):', error);
    });
  }

  return reviewItem;
};

/**
 * Helper to upload audio and update Firestore document
 * Runs in background, doesn't block conversation flow
 */
async function uploadErrorAudioAndUpdate(
  reviewItemId: string,
  userId: string,
  audioBlob: Blob
): Promise<void> {
  try {
    const { uploadErrorAudio } = await import('./errorAudioStorage');
    const { downloadUrl, storagePath } = await uploadErrorAudio(
      audioBlob,
      reviewItemId,
      userId
    );

    // Update document with audio URL
    const reviewItemRef = doc(db!, `users/${userId}/reviewItems`, reviewItemId);
    await updateDoc(reviewItemRef, {
      audioUrl: downloadUrl,
      audioStoragePath: storagePath,
    });

    console.log('[SessionData] Updated review item with audio URL');
  } catch (error) {
    console.error('[SessionData] Failed to upload error audio:', error);
    // Don't re-throw - audio is an optional enhancement
  }
}

/**
 * Get all review items for a user (for weekly review lessons)
 */
export const getUserReviewItems = async (
  userId: string,
  options?: {
    since?: Date;
    masteredOnly?: boolean;
    unmasteredOnly?: boolean;
    limit?: number;
  }
): Promise<ReviewItemDocument[]> => {
  if (!db) throw new Error('Firebase not configured');

  const { where, limit: lim } = await import('firebase/firestore');
  const reviewItemsRef = collection(db, `users/${userId}/reviewItems`);

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

  const q = query(reviewItemsRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as ReviewItemDocument);
};

/**
 * Mark a review item as reviewed (increment count)
 */
export const markReviewItemReviewed = async (
  userId: string,
  reviewItemId: string,
  mastered: boolean = false
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const { increment: inc } = await import('firebase/firestore');
  const reviewItemRef = doc(db, `users/${userId}/reviewItems`, reviewItemId);

  await updateDoc(reviewItemRef, {
    reviewCount: inc(1),
    lastReviewedAt: Timestamp.now(),
    mastered,
  });
};

/**
 * Get a single review item by ID
 * Includes fuzzy matching fallback for when Gemini slightly mangles IDs
 */
export const getReviewItem = async (
  userId: string,
  reviewItemId: string
): Promise<ReviewItemDocument | null> => {
  if (!db) throw new Error('Firebase not configured');

  // First try exact match
  const reviewItemRef = doc(db, `users/${userId}/reviewItems`, reviewItemId);
  const snapshot = await getDoc(reviewItemRef);

  if (snapshot.exists()) {
    return snapshot.data() as ReviewItemDocument;
  }

  // Fuzzy match fallback - Gemini sometimes adds/removes characters from IDs
  console.log('[SessionData] Exact match failed, trying fuzzy match for:', reviewItemId);

  const reviewItemsRef = collection(db, `users/${userId}/reviewItems`);
  const allItems = await getDocs(query(reviewItemsRef, orderBy('createdAt', 'desc')));

  // Find best match using Levenshtein-like similarity
  let bestMatch: ReviewItemDocument | null = null;
  let bestScore = 0;
  const minSimilarity = 0.8; // Require 80% similarity

  for (const docSnap of allItems.docs) {
    const itemId = docSnap.id;
    const similarity = calculateSimilarity(reviewItemId, itemId);

    if (similarity > bestScore && similarity >= minSimilarity) {
      bestScore = similarity;
      bestMatch = docSnap.data() as ReviewItemDocument;
    }
  }

  if (bestMatch) {
    console.log(`[SessionData] Fuzzy matched "${reviewItemId}" to "${bestMatch.id}" (${(bestScore * 100).toFixed(0)}% similar)`);
  }

  return bestMatch;
};

/**
 * Calculate similarity between two strings (0-1)
 * Simple approach: longest common subsequence ratio
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  // Count matching characters in sequence
  let matches = 0;
  let j = 0;
  for (let i = 0; i < longer.length && j < shorter.length; i++) {
    if (longer[i] === shorter[j]) {
      matches++;
      j++;
    }
  }

  return matches / longer.length;
}

/**
 * Mark a review item as mastered by the AI during review lesson
 * Called when student demonstrates clear understanding
 */
export const markItemMastered = async (
  userId: string,
  reviewItemId: string,
  confidence: 'low' | 'medium' | 'high'
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const { increment: inc } = await import('firebase/firestore');
  const reviewItemRef = doc(db, `users/${userId}/reviewItems`, reviewItemId);

  await updateDoc(reviewItemRef, {
    mastered: true,
    masteredAt: Timestamp.now(),
    masteredConfidence: confidence,
    reviewCount: inc(1),
    lastReviewedAt: Timestamp.now(),
  });

  console.log(`[SessionData] Marked review item ${reviewItemId} as mastered (confidence: ${confidence})`);
};

/**
 * Get all struggle items for a user (for review lessons)
 * @deprecated Use getUserReviewItems instead
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
 * - Tracks badge-related fields (uniqueScenarios, consecutiveFiveStars)
 * - Checks and awards badges
 *
 * Returns the summary and any newly earned badges
 */
export const saveSessionSummary = async (
  sessionId: string,
  userId: string,
  missionId: string,
  durationSeconds: number,
  params: ShowSessionSummaryParams
): Promise<{ summary: SessionSummaryDocument; newBadges: BadgeDefinition[] }> => {
  if (!db) throw new Error('Firebase not configured');

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
    const { deleteField } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (userSnap.exists()) {
      const userData = userSnap.data();

      // Calculate new streak
      const { newStreak } = calculateStreak(
        userData.lastPracticeDate,
        userData.currentStreak
      );
      const longestStreak = Math.max(newStreak, userData.longestStreak || 0);

      // Badge tracking: consecutive 5-star sessions
      // Increment if 5 stars, reset to 0 otherwise
      const newConsecutiveFiveStars = params.stars === 5
        ? (userData.consecutiveFiveStarSessions || 0) + 1
        : 0;

      // Badge tracking: unique scenarios (only add if not already in array)
      const uniqueScenarios = userData.uniqueScenariosCompleted || [];
      const shouldAddScenario = missionId && !uniqueScenarios.includes(missionId);

      // Build update object
      const updateData: Record<string, unknown> = {
        totalStars: increment(params.stars),
        totalSessions: increment(1),
        totalPracticeTime: increment(durationSeconds),
        lastSessionAt: Timestamp.now(),
        // Streak updates
        currentStreak: newStreak,
        lastPracticeDate: todayStr,
        longestStreak: longestStreak,
        // Badge tracking
        consecutiveFiveStarSessions: newConsecutiveFiveStars,
        // Clear current lesson since session completed
        currentLesson: deleteField(),
        // Practice history for Progress page
        [`practiceHistory.${todayStr}`]: increment(durationSeconds),
        updatedAt: Timestamp.now(),
      };

      // Add unique scenario if new
      if (shouldAddScenario) {
        updateData.uniqueScenariosCompleted = arrayUnion(missionId);
      }

      await updateDoc(userRef, updateData);
      console.log('[SessionData] Updated streak:', newStreak, '(longest:', longestStreak, ')');
      console.log('[SessionData] Consecutive 5-stars:', newConsecutiveFiveStars);
    } else {
      // Create user stats if doesn't exist (first session ever)
      const initialData: Record<string, unknown> = {
        totalStars: params.stars,
        totalSessions: 1,
        totalPracticeTime: durationSeconds,
        lastSessionAt: Timestamp.now(),
        // Initialize streak for new user
        currentStreak: 1,
        lastPracticeDate: todayStr,
        longestStreak: 1,
        // Badge tracking
        consecutiveFiveStarSessions: params.stars === 5 ? 1 : 0,
        uniqueScenariosCompleted: missionId ? [missionId] : [],
        // Practice history for Progress page
        practiceHistory: { [todayStr]: durationSeconds },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(userRef, initialData, { merge: true });
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

  // Check and award badges
  let newBadges: BadgeDefinition[] = [];
  try {
    const badgeResult = await checkAndAwardBadges(userId, 'session_completed');
    newBadges = badgeResult.newlyEarned;
    if (newBadges.length > 0) {
      console.log('[SessionData] Awarded badges:', newBadges.map(b => b.name).join(', '));
    }
  } catch (error) {
    console.warn('[SessionData] Could not check badges:', error);
  }

  // Record activity for teacher dashboard real-time feed
  try {
    // Get user data for teacherId and studentName
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const teacherId = userData.teacherId;
      const studentName = userData.displayName || 'Student';

      // Only record if student has a teacher
      if (teacherId && missionId) {
        // Get lesson title from missions collection
        const missionRef = doc(db, 'missions', missionId);
        const missionSnap = await getDoc(missionRef);
        const lessonTitle = missionSnap.exists()
          ? (missionSnap.data().title || 'Lesson')
          : 'Lesson';

        await recordActivity({
          teacherId,
          studentId: userId,
          studentName,
          action: 'completed',
          lessonId: missionId,
          lessonTitle,
          stars: params.stars,
        });
        console.log('[SessionData] Recorded activity for teacher dashboard');
      }
    }
  } catch (error) {
    console.warn('[SessionData] Could not record activity:', error);
  }

  return { summary, newBadges };
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
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
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
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null,
    };
  }

  const data = userSnap.data();
  const totalSessions = data.totalSessions || 0;
  const totalStars = data.totalStars || 0;

  // Check if streak should be reset (more than 1 day since last practice)
  let displayStreak = data.currentStreak || 0;
  if (data.lastPracticeDate) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If last practice was not today or yesterday, streak is effectively 0
    if (data.lastPracticeDate !== todayStr && data.lastPracticeDate !== yesterdayStr) {
      displayStreak = 0;
    }
  }

  return {
    totalSessions,
    totalStars,
    averageStars: totalSessions > 0 ? totalStars / totalSessions : 0,
    totalPracticeTime: data.totalPracticeTime || 0,
    lastSessionAt: data.lastSessionAt?.toDate() || null,
    currentStreak: displayStreak,
    longestStreak: data.longestStreak || 0,
    lastPracticeDate: data.lastPracticeDate || null,
  };
};

// ==================== REVIEW LESSONS ====================

/**
 * Get the active review lesson (ready or in_progress)
 * Used by HomePage to display the WeeklyReviewCard
 * Single source of truth - shows if not completed/skipped
 */
export const getActiveReviewLesson = async (
  userId: string
): Promise<ReviewLessonDocument | null> => {
  if (!db) throw new Error('Firebase not configured');

  const { where, limit: lim } = await import('firebase/firestore');
  const reviewsRef = collection(db, `users/${userId}/reviewLessons`);

  // Query for ready OR in_progress reviews
  const q = query(
    reviewsRef,
    where('status', 'in', ['ready', 'in_progress']),
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
 * Start a review lesson (mark as in_progress)
 * Called when user begins a review session
 */
export const startReviewLesson = async (
  userId: string,
  reviewId: string,
  sessionId: string
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const reviewRef = doc(db, `users/${userId}/reviewLessons`, reviewId);

  await updateDoc(reviewRef, {
    status: 'in_progress',
    sessionId,
    startedAt: Timestamp.now(),
  });

  console.log('[SessionData] Started review lesson:', reviewId);
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
