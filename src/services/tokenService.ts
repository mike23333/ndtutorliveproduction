/**
 * Token Service for fetching ephemeral tokens from the backend
 *
 * Handles token caching, auto-refresh, and deduplication of concurrent requests.
 */

import type { EphemeralToken, TokenResponse } from '../types/gemini';

/** Lesson task for auto-injection of tool instructions */
interface LessonTask {
  id: string;
  text: string;
}

interface TokenCache {
  token: EphemeralToken | null;
  refreshPromise: Promise<EphemeralToken> | null;
  systemPrompt: string | null; // Track which prompt the token was created for
  voiceName: string | null; // Track which voice the token was created for
  tasksHash: string | null; // Track tasks for cache invalidation
  isReviewLesson: boolean | null; // Track lesson type
}

export class TokenService {
  private apiUrl: string;
  private cache: TokenCache = {
    token: null,
    refreshPromise: null,
    systemPrompt: null,
    voiceName: null,
    tasksHash: null,
    isReviewLesson: null
  };
  private refreshBuffer = 5 * 60 * 1000; // Refresh 5 minutes before expiry

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:8080';
  }

  /**
   * Generate a simple hash for tasks to detect changes
   */
  private hashTasks(tasks?: LessonTask[]): string {
    if (!tasks || tasks.length === 0) return '';
    return tasks.map(t => `${t.id}:${t.text}`).join('|');
  }

  /**
   * Get a valid ephemeral token, fetching a new one if needed
   */
  async getToken(
    userId: string,
    systemPrompt?: string,
    forceRefresh = false,
    voiceName?: string,
    tasks?: LessonTask[],
    isReviewLesson?: boolean
  ): Promise<EphemeralToken> {
    // Check cache validity - must also match prompt, voice, tasks, and lesson type
    const promptChanged = systemPrompt !== this.cache.systemPrompt;
    const voiceChanged = voiceName !== this.cache.voiceName;
    const tasksHash = this.hashTasks(tasks);
    const tasksChanged = tasksHash !== this.cache.tasksHash;
    const lessonTypeChanged = isReviewLesson !== this.cache.isReviewLesson;

    if (promptChanged) {
      console.log('[TokenService] System prompt changed, invalidating cache');
    }
    if (tasksChanged) {
      console.log('[TokenService] Tasks changed, invalidating cache');
    }

    if (!forceRefresh && !promptChanged && !voiceChanged && !tasksChanged && !lessonTypeChanged && this.cache.token) {
      const expiresIn = this.cache.token.expiresAt.getTime() - Date.now();
      if (expiresIn > this.refreshBuffer) {
        console.log('[TokenService] Using cached token');
        return this.cache.token;
      }
    }

    // Deduplicate concurrent refresh requests
    if (this.cache.refreshPromise) {
      console.log('[TokenService] Waiting for existing refresh');
      return this.cache.refreshPromise;
    }

    // Fetch new token
    this.cache.refreshPromise = this.fetchToken(userId, systemPrompt, voiceName, tasks, isReviewLesson);

    try {
      this.cache.token = await this.cache.refreshPromise;
      this.cache.systemPrompt = systemPrompt || null;
      this.cache.voiceName = voiceName || null;
      this.cache.tasksHash = tasksHash;
      this.cache.isReviewLesson = isReviewLesson || null;
      return this.cache.token;
    } finally {
      this.cache.refreshPromise = null;
    }
  }

  /**
   * Fetch a new token from the backend
   */
  private async fetchToken(
    userId: string,
    systemPrompt?: string,
    voiceName?: string,
    tasks?: LessonTask[],
    isReviewLesson?: boolean
  ): Promise<EphemeralToken> {
    const response = await fetch(`${this.apiUrl}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        systemPrompt,
        tasks: tasks || null,
        isReviewLesson: isReviewLesson || false,
        expireMinutes: 30,
        lockConfig: true,
        voiceName
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token fetch failed: ${response.status} - ${errorText}`);
    }

    const data: TokenResponse = await response.json();

    return {
      token: data.token,
      expiresAt: new Date(data.expiresAt),
      newSessionExpiresAt: new Date(data.newSessionExpiresAt),
      model: data.model
    };
  }

  /**
   * Clear the token cache (e.g., on logout or error)
   */
  clearCache(): void {
    this.cache = {
      token: null,
      refreshPromise: null,
      systemPrompt: null,
      voiceName: null,
      tasksHash: null,
      isReviewLesson: null
    };
  }

  /**
   * Check if we have a valid cached token
   */
  hasValidToken(): boolean {
    if (!this.cache.token) return false;
    const expiresIn = this.cache.token.expiresAt.getTime() - Date.now();
    return expiresIn > this.refreshBuffer;
  }
}

// Singleton instance
let tokenServiceInstance: TokenService | null = null;

export function getTokenService(): TokenService {
  if (!tokenServiceInstance) {
    tokenServiceInstance = new TokenService();
  }
  return tokenServiceInstance;
}
