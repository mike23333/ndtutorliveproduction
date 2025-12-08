/**
 * Firebase Token Usage Tracking Service
 *
 * Tracks token consumption per session and aggregates user-level statistics
 * for cost analysis (weekly/monthly usage).
 */

import {
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { UsageMetadata } from '../../types/gemini';

// Cost estimation based on Gemini pricing (adjust as needed)
const COST_PER_1K_INPUT_TOKENS = 0.00025;
const COST_PER_1K_OUTPUT_TOKENS = 0.0005;

/**
 * Calculate estimated cost from token counts
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1000) * COST_PER_1K_INPUT_TOKENS +
    (outputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS
  );
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get week key for aggregation (e.g., "2024-W02")
 */
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Get month key for aggregation (e.g., "2024-01")
 */
function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

/**
 * Create a new session usage record
 */
export async function createSessionUsage(
  userId: string,
  sessionHandle?: string
): Promise<string> {
  if (!db) {
    console.warn('[TokenUsage] Firestore not initialized');
    return generateSessionId();
  }

  const sessionId = generateSessionId();
  const now = new Date();

  try {
    const docRef = doc(db, 'tokenUsage', sessionId);
    await setDoc(docRef, {
      sessionId,
      userId,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      costEstimate: 0,
      startTime: Timestamp.fromDate(now),
      sessionHandle: sessionHandle || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`[TokenUsage] Created session: ${sessionId}`);
    return sessionId;
  } catch (error) {
    console.error('[TokenUsage] Failed to create session:', error);
    return sessionId; // Return ID anyway for local tracking
  }
}

/**
 * Update session usage with new token counts (incremental)
 */
export async function updateSessionUsage(
  sessionId: string,
  metadata: UsageMetadata
): Promise<void> {
  if (!db) return;

  const { inputTokens, outputTokens } = metadata;
  if (inputTokens === 0 && outputTokens === 0) return;

  const costDelta = calculateCost(inputTokens, outputTokens);

  try {
    const docRef = doc(db, 'tokenUsage', sessionId);
    await updateDoc(docRef, {
      inputTokens: increment(inputTokens),
      outputTokens: increment(outputTokens),
      totalTokens: increment(inputTokens + outputTokens),
      costEstimate: increment(costDelta),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('[TokenUsage] Failed to update session:', error);
  }
}

/**
 * Finalize session - set end time, duration, and update user aggregates
 */
export async function finalizeSessionUsage(
  sessionId: string,
  userId: string,
  sessionHandle?: string
): Promise<void> {
  if (!db) return;

  const now = new Date();

  try {
    const docRef = doc(db, 'tokenUsage', sessionId);
    const sessionDoc = await getDoc(docRef);

    if (!sessionDoc.exists()) {
      console.warn(`[TokenUsage] Session not found: ${sessionId}`);
      return;
    }

    const data = sessionDoc.data();
    const startTime = data.startTime?.toDate() || now;
    const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    // Update session with end time and duration
    await updateDoc(docRef, {
      endTime: Timestamp.fromDate(now),
      durationSeconds,
      sessionHandle: sessionHandle || data.sessionHandle || null,
      updatedAt: serverTimestamp()
    });

    // Update user aggregate
    await updateUserAggregate(
      userId,
      data.inputTokens || 0,
      data.outputTokens || 0
    );

    console.log(`[TokenUsage] Finalized session: ${sessionId} (${durationSeconds}s)`);
  } catch (error) {
    console.error('[TokenUsage] Failed to finalize session:', error);
  }
}

/**
 * Update user-level token usage aggregates
 */
async function updateUserAggregate(
  userId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  if (!db || (inputTokens === 0 && outputTokens === 0)) return;

  const now = new Date();
  const weekKey = getWeekKey(now);
  const monthKey = getMonthKey(now);
  const cost = calculateCost(inputTokens, outputTokens);

  try {
    const docRef = doc(db, 'userTokenAggregates', userId);
    const existingDoc = await getDoc(docRef);

    if (existingDoc.exists()) {
      // Update existing aggregate
      await updateDoc(docRef, {
        totalInputTokens: increment(inputTokens),
        totalOutputTokens: increment(outputTokens),
        totalCost: increment(cost),
        sessionCount: increment(1),
        lastSessionAt: Timestamp.fromDate(now),
        [`weeklyUsage.${weekKey}`]: increment(inputTokens + outputTokens),
        [`monthlyUsage.${monthKey}`]: increment(inputTokens + outputTokens),
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new aggregate
      await setDoc(docRef, {
        userId,
        totalInputTokens: inputTokens,
        totalOutputTokens: outputTokens,
        totalCost: cost,
        sessionCount: 1,
        lastSessionAt: Timestamp.fromDate(now),
        weeklyUsage: { [weekKey]: inputTokens + outputTokens },
        monthlyUsage: { [monthKey]: inputTokens + outputTokens },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log(`[TokenUsage] Updated aggregate for user: ${userId}`);
  } catch (error) {
    console.error('[TokenUsage] Failed to update user aggregate:', error);
  }
}

/**
 * Get user's token usage statistics
 */
export async function getUserUsageStats(userId: string): Promise<{
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  sessionCount: number;
  weeklyUsage: Record<string, number>;
  monthlyUsage: Record<string, number>;
} | null> {
  if (!db) return null;

  try {
    const docRef = doc(db, 'userTokenAggregates', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      totalInputTokens: data.totalInputTokens || 0,
      totalOutputTokens: data.totalOutputTokens || 0,
      totalCost: data.totalCost || 0,
      sessionCount: data.sessionCount || 0,
      weeklyUsage: data.weeklyUsage || {},
      monthlyUsage: data.monthlyUsage || {}
    };
  } catch (error) {
    console.error('[TokenUsage] Failed to get user stats:', error);
    return null;
  }
}
