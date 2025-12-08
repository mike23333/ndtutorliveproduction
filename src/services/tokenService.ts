/**
 * Token Service for fetching ephemeral tokens from the backend
 *
 * Handles token caching, auto-refresh, and deduplication of concurrent requests.
 */

import type { EphemeralToken, TokenResponse } from '../types/gemini';

interface TokenCache {
  token: EphemeralToken | null;
  refreshPromise: Promise<EphemeralToken> | null;
}

export class TokenService {
  private apiUrl: string;
  private cache: TokenCache = { token: null, refreshPromise: null };
  private refreshBuffer = 5 * 60 * 1000; // Refresh 5 minutes before expiry

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:8080';
  }

  /**
   * Get a valid ephemeral token, fetching a new one if needed
   */
  async getToken(userId: string, systemPrompt?: string, forceRefresh = false): Promise<EphemeralToken> {
    // Check cache validity
    if (!forceRefresh && this.cache.token) {
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
    console.log('[TokenService] Fetching new token');
    this.cache.refreshPromise = this.fetchToken(userId, systemPrompt);

    try {
      this.cache.token = await this.cache.refreshPromise;
      return this.cache.token;
    } finally {
      this.cache.refreshPromise = null;
    }
  }

  /**
   * Fetch a new token from the backend
   */
  private async fetchToken(userId: string, systemPrompt?: string): Promise<EphemeralToken> {
    const response = await fetch(`${this.apiUrl}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        systemPrompt,
        expireMinutes: 30,
        lockConfig: true
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
    this.cache = { token: null, refreshPromise: null };
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
