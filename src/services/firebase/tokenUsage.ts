/**
 * Firebase Token Usage Tracking Service
 *
 * ARCHITECTURE (Senior Developer Approach):
 * =========================================
 *
 * Firestore Structure:
 *   users/{userId}
 *     ├── tokenUsage (field on user doc) - Running totals for quick reads
 *     │     { totalTokens, totalCost, lastSessionAt }
 *     │
 *     └── sessions/{sessionId} (subcollection) - Detailed session data
 *           { inputTokens, outputTokens, cost, startTime, endTime, missionId }
 *
 * Why this structure:
 * 1. Sessions as subcollection under users = natural security rules (user owns their data)
 * 2. Aggregates on user doc = single read for dashboard, no extra collection
 * 3. Querying user's sessions = simple subcollection query, no composite index needed
 * 4. Teacher queries = use collectionGroup('sessions') with teacherId field
 *
 * For teacher dashboard cost aggregation, we query:
 *   collectionGroup('sessions').where('teacherId', '==', X).where('startTime', '>=', Y)
 *
 * Alternative considered but rejected:
 * - Root tokenUsage collection: Requires composite indexes, poor security model
 * - Separate userTokenAggregates: Extra read, can get out of sync
 */

import {
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  getDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { UsageMetadata } from '../../types/gemini';

/**
 * Gemini 2.5 Flash Native Audio (Live API) Pricing (December 2024)
 * Model: gemini-2.5-flash-native-audio-preview
 * Source: https://ai.google.dev/gemini-api/docs/pricing
 *
 * Live API Native Audio pricing:
 * - Text input:  $0.50 per 1M tokens
 * - Audio/Video input: $3.00 per 1M tokens
 * - Text output: $2.00 per 1M tokens
 * - Audio output: $12.00 per 1M tokens
 *
 * Token Calculation (from https://ai.google.dev/gemini-api/docs/tokens):
 * - Audio: 32 tokens per second (fixed rate)
 * - Video: 263 tokens per second (fixed rate)
 *
 * IMPORTANT: The Live API returns actual token counts in `usageMetadata`.
 * Use those values directly rather than estimating from duration.
 */
export const GEMINI_LIVE_API_PRICING = {
  // Per 1M tokens (USD)
  textInput: 0.50,
  audioInput: 3.00,
  textOutput: 2.00,
  audioOutput: 12.00,
  // Audio token rate: 32 tokens per second (official docs)
  audioTokensPerSecond: 32,
  // Video token rate: 263 tokens per second
  videoTokensPerSecond: 263,
} as const;

// For the Live API voice tutoring use case:
// We use audio rates since that's the primary modality
const COST_PER_1M_INPUT_TOKENS = GEMINI_LIVE_API_PRICING.audioInput;
const COST_PER_1M_OUTPUT_TOKENS = GEMINI_LIVE_API_PRICING.audioOutput;

/**
 * Calculate cost from token counts
 * Uses Gemini 2.5 Flash Native Audio (Live API) pricing
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * COST_PER_1M_INPUT_TOKENS +
    (outputTokens / 1_000_000) * COST_PER_1M_OUTPUT_TOKENS
  );
}

/**
 * Calculate tokens from audio duration (for estimation only)
 * Gemini API uses 32 tokens per second of audio (fixed rate)
 */
export function audioSecondsToTokens(seconds: number): number {
  return Math.ceil(seconds * GEMINI_LIVE_API_PRICING.audioTokensPerSecond);
}

/**
 * Estimate cost for an audio session (for planning/budgeting)
 */
export function estimateAudioSessionCost(inputSeconds: number, outputSeconds: number): number {
  const inputTokens = audioSecondsToTokens(inputSeconds);
  const outputTokens = audioSecondsToTokens(outputSeconds);
  return calculateCost(inputTokens, outputTokens);
}

/**
 * Get pricing info for display
 */
export function getPricingInfo() {
  return {
    ...GEMINI_LIVE_API_PRICING,
    costPerMinuteInput: (60 * GEMINI_LIVE_API_PRICING.audioTokensPerSecond / 1_000_000) * GEMINI_LIVE_API_PRICING.audioInput,
    costPerMinuteOutput: (60 * GEMINI_LIVE_API_PRICING.audioTokensPerSecond / 1_000_000) * GEMINI_LIVE_API_PRICING.audioOutput,
  };
}

// ============================================================================
// SESSION TRACKING - Stored as subcollection: users/{userId}/sessions/{sessionId}
// ============================================================================

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function getDayKey(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Create a new session usage record
 * Stores in: users/{userId}/sessions/{sessionId}
 */
export async function createSessionUsage(
  userId: string,
  sessionHandle?: string,
  missionId?: string,
  teacherId?: string
): Promise<string> {
  if (!db) {
    console.warn('[TokenUsage] Firestore not initialized');
    return generateSessionId();
  }

  const sessionId = generateSessionId();
  const now = new Date();

  try {
    // Store session as subcollection under user
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await setDoc(sessionRef, {
      sessionId,
      userId,
      missionId: missionId || null,
      teacherId: teacherId || null, // For teacher dashboard queries
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cost: 0,
      startTime: Timestamp.fromDate(now),
      endTime: null,
      durationSeconds: 0,
      sessionHandle: sessionHandle || null,
      dayKey: getDayKey(now),      // For daily aggregation queries
      monthKey: getMonthKey(now),  // For monthly aggregation queries
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`[TokenUsage] Created session: users/${userId}/sessions/${sessionId}`);
    return sessionId;
  } catch (error) {
    console.error('[TokenUsage] Failed to create session:', error);
    return sessionId;
  }
}

/**
 * Update session usage with new token counts (incremental)
 * Updates: users/{userId}/sessions/{sessionId}
 */
export async function updateSessionUsage(
  sessionId: string,
  metadata: UsageMetadata,
  userId?: string
): Promise<void> {
  if (!db) return;

  const { inputTokens, outputTokens } = metadata;
  if (inputTokens === 0 && outputTokens === 0) return;

  const costDelta = calculateCost(inputTokens, outputTokens);

  try {
    // If we have userId, use the new subcollection path
    if (userId) {
      const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        inputTokens: increment(inputTokens),
        outputTokens: increment(outputTokens),
        totalTokens: increment(inputTokens + outputTokens),
        cost: increment(costDelta),
        updatedAt: serverTimestamp()
      });
    } else {
      // Fallback to old root collection for backwards compatibility
      const docRef = doc(db, 'tokenUsage', sessionId);
      await updateDoc(docRef, {
        inputTokens: increment(inputTokens),
        outputTokens: increment(outputTokens),
        totalTokens: increment(inputTokens + outputTokens),
        costEstimate: increment(costDelta),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('[TokenUsage] Failed to update session:', error);
  }
}

/**
 * Finalize session and update user's aggregate stats
 * Uses batch write for atomicity
 */
export async function finalizeSessionUsage(
  sessionId: string,
  userId: string,
  sessionHandle?: string
): Promise<void> {
  if (!db) return;

  const now = new Date();

  try {
    // Try new path first, fall back to old path
    let sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    let sessionDoc = await getDoc(sessionRef);

    // Fallback to old root collection
    if (!sessionDoc.exists()) {
      sessionRef = doc(db, 'tokenUsage', sessionId);
      sessionDoc = await getDoc(sessionRef);
    }

    if (!sessionDoc.exists()) {
      console.warn(`[TokenUsage] Session not found: ${sessionId}`);
      return;
    }

    const data = sessionDoc.data();
    const startTime = data.startTime?.toDate() || now;
    const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const inputTokens = data.inputTokens || 0;
    const outputTokens = data.outputTokens || 0;
    const cost = calculateCost(inputTokens, outputTokens);

    // Use batch write for atomicity
    const batch = writeBatch(db);

    // Update session with end time
    batch.update(sessionRef, {
      endTime: Timestamp.fromDate(now),
      durationSeconds,
      sessionHandle: sessionHandle || data.sessionHandle || null,
      updatedAt: serverTimestamp()
    });

    // Update user's aggregate tokenUsage field
    const userRef = doc(db, 'users', userId);
    const monthKey = getMonthKey(now);

    batch.set(userRef, {
      tokenUsage: {
        totalInputTokens: increment(inputTokens),
        totalOutputTokens: increment(outputTokens),
        totalCost: increment(cost),
        sessionCount: increment(1),
        lastSessionAt: Timestamp.fromDate(now),
        [`monthlyTokens.${monthKey}`]: increment(inputTokens + outputTokens),
        [`monthlyCost.${monthKey}`]: increment(cost),
      }
    }, { merge: true });

    await batch.commit();
    console.log(`[TokenUsage] Finalized session: ${sessionId} (${durationSeconds}s, $${cost.toFixed(4)})`);
  } catch (error) {
    console.error('[TokenUsage] Failed to finalize session:', error);

    // Fallback: try updating user aggregate separately
    try {
      await updateUserAggregateLegacy(userId, 0, 0);
    } catch {
      // Ignore fallback errors
    }
  }
}

/**
 * Legacy: Update user aggregate in separate collection (for backwards compatibility)
 * @deprecated Use the batch write in finalizeSessionUsage instead
 */
async function updateUserAggregateLegacy(
  userId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  if (!db || (inputTokens === 0 && outputTokens === 0)) return;

  const now = new Date();
  const monthKey = getMonthKey(now);
  const cost = calculateCost(inputTokens, outputTokens);

  try {
    const docRef = doc(db, 'userTokenAggregates', userId);
    const existingDoc = await getDoc(docRef);

    if (existingDoc.exists()) {
      await updateDoc(docRef, {
        totalInputTokens: increment(inputTokens),
        totalOutputTokens: increment(outputTokens),
        totalCost: increment(cost),
        sessionCount: increment(1),
        lastSessionAt: Timestamp.fromDate(now),
        [`monthlyUsage.${monthKey}`]: increment(inputTokens + outputTokens),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(docRef, {
        userId,
        totalInputTokens: inputTokens,
        totalOutputTokens: outputTokens,
        totalCost: cost,
        sessionCount: 1,
        lastSessionAt: Timestamp.fromDate(now),
        monthlyUsage: { [monthKey]: inputTokens + outputTokens },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('[TokenUsage] Failed to update user aggregate:', error);
  }
}

/**
 * Get user's token usage statistics from user document
 */
export async function getUserUsageStats(userId: string): Promise<{
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  sessionCount: number;
  monthlyTokens: Record<string, number>;
  monthlyCost: Record<string, number>;
} | null> {
  if (!db) return null;

  try {
    // First try user document (new structure)
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists() && userDoc.data()?.tokenUsage) {
      const data = userDoc.data().tokenUsage;
      return {
        totalInputTokens: data.totalInputTokens || 0,
        totalOutputTokens: data.totalOutputTokens || 0,
        totalCost: data.totalCost || 0,
        sessionCount: data.sessionCount || 0,
        monthlyTokens: data.monthlyTokens || {},
        monthlyCost: data.monthlyCost || {}
      };
    }

    // Fallback to old userTokenAggregates collection
    const docRef = doc(db, 'userTokenAggregates', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      totalInputTokens: data.totalInputTokens || 0,
      totalOutputTokens: data.totalOutputTokens || 0,
      totalCost: data.totalCost || 0,
      sessionCount: data.sessionCount || 0,
      monthlyTokens: data.monthlyUsage || {},
      monthlyCost: {}
    };
  } catch (error) {
    console.error('[TokenUsage] Failed to get user stats:', error);
    return null;
  }
}
