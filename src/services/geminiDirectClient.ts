/**
 * Direct Gemini Live API Client
 *
 * Connects directly to Gemini Live API using ephemeral tokens.
 * Features:
 * - Affective dialog (emotion-aware responses)
 * - Session resumption (pause/resume within 2hr)
 * - Automatic VAD (always-listening mode)
 * - Context window compression
 * - Token usage tracking
 */

import { GoogleGenAI, Modality } from '@google/genai';
import { getTokenService } from './tokenService';
import type { GeminiClientConfig, UsageMetadata, GeminiClientCallbacks } from '../types/gemini';

// Session handle storage keys
const SESSION_HANDLE_KEY = 'gemini_direct_session_handle';
const SESSION_HANDLE_TIMESTAMP_KEY = 'gemini_direct_session_timestamp';
const SESSION_RESUME_WINDOW = 2 * 60 * 60 * 1000; // 2 hours

export class GeminiDirectClient {
  private client: GoogleGenAI | null = null;
  private session: any = null; // LiveSession type from SDK
  private config: GeminiClientConfig;
  private callbacks: Partial<GeminiClientCallbacks>;
  private tokenService = getTokenService();

  private isConnected = false;
  private shouldReconnect = true;
  private isPaused = false;
  private sessionHandle: string | null = null;

  // Token usage tracking
  private tokenUsage: UsageMetadata = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };

  constructor(config: GeminiClientConfig) {
    this.config = config;
    this.callbacks = config.callbacks;
    this.sessionHandle = config.sessionHandle || this.getStoredSessionHandle();
  }

  /**
   * Connect to Gemini Live API
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('[GeminiClient] Already connected');
      return;
    }

    try {
      // Get ephemeral token from backend
      console.log('[GeminiClient] Getting ephemeral token...');
      const ephemeralToken = await this.tokenService.getToken(
        this.config.userId,
        this.config.systemPrompt
      );

      // Initialize client with ephemeral token as API key
      // Using v1alpha for ephemeral token and affective dialog support
      this.client = new GoogleGenAI({
        apiKey: ephemeralToken.token,
        httpOptions: { apiVersion: 'v1alpha' }
      });

      // Build live config
      const liveConfig = this.buildLiveConfig();

      console.log('[GeminiClient] Connecting to Gemini Live API...');
      console.log('[GeminiClient] Session handle for resume:', this.sessionHandle ? this.sessionHandle.substring(0, 30) + '...' : 'none');
      console.log('[GeminiClient] Config sessionResumption:', JSON.stringify(liveConfig.sessionResumption));

      // Connect to live session
      this.session = await this.client.live.connect({
        model: ephemeralToken.model,
        config: liveConfig,
        callbacks: {
          onopen: () => {
            console.log('[GeminiClient] WebSocket opened');
          },
          onmessage: (message: any) => {
            this.handleMessage(message);
          },
          onerror: (error: any) => {
            console.error('[GeminiClient] WebSocket error:', error);
            this.callbacks.onError?.(new Error(error?.message || 'WebSocket error'));
          },
          onclose: (event: any) => {
            console.log('[GeminiClient] WebSocket closed:', event?.reason);
            this.handleDisconnect();
          }
        }
      });

      this.isConnected = true;
      this.isPaused = false;
      console.log('[GeminiClient] Connected successfully');
      this.callbacks.onConnected?.();

    } catch (error) {
      console.error('[GeminiClient] Connection failed:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Build the Live API configuration
   */
  private buildLiveConfig(): any {
    return {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Aoede'
          }
        }
      },
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
          endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
          prefixPaddingMs: 200,
          silenceDurationMs: 500
        }
      },
      // Session resumption - pass handle if we have one
      sessionResumption: this.sessionHandle ? { handle: this.sessionHandle } : {},
      // Context window compression for longer sessions
      contextWindowCompression: {
        slidingWindow: {}
      },
      // System instruction if provided
      ...(this.config.systemPrompt && {
        systemInstruction: {
          parts: [{ text: this.config.systemPrompt }]
        }
      }),
      // Enable affective dialog for emotion-aware responses
      enableAffectiveDialog: true
    };
  }

  /**
   * Handle incoming messages from Gemini
   */
  private handleMessage(message: any): void {
    // Debug: log all messages to see what we're receiving
    console.log('[GeminiClient] Message received:', Object.keys(message));

    // Session resumption update - store new handle
    // Check for both resumable flag and newHandle
    if (message.sessionResumptionUpdate) {
      console.log('[GeminiClient] Session resumption update:', message.sessionResumptionUpdate);
      if (message.sessionResumptionUpdate.resumable && message.sessionResumptionUpdate.newHandle) {
        this.sessionHandle = message.sessionResumptionUpdate.newHandle;
        this.storeSessionHandle(this.sessionHandle!);
        this.callbacks.onSessionUpdate?.(this.sessionHandle!);
        console.log('[GeminiClient] Stored new session handle:', this.sessionHandle?.substring(0, 20) + '...');
      }
    }

    // GoAway notification - connection will close soon
    if (message.goAway) {
      const timeLeft = message.goAway.timeLeft || 60;
      console.log(`[GeminiClient] GoAway received, ${timeLeft}s remaining`);
      this.callbacks.onGoAway?.(timeLeft);
    }

    // Server content (audio/text responses)
    if (message.serverContent) {
      const content = message.serverContent;

      // Handle model turn parts
      if (content.modelTurn?.parts) {
        for (const part of content.modelTurn.parts) {
          // Audio response
          if (part.inlineData) {
            const audioData = this.base64ToArrayBuffer(part.inlineData.data);
            this.callbacks.onAudio?.(audioData);
          }
          // Text response
          if (part.text) {
            this.callbacks.onText?.(part.text);
          }
        }
      }

      // Turn complete
      if (content.turnComplete) {
        this.callbacks.onTurnComplete?.();
      }
    }

    // Audio data directly (some responses)
    if (message.data && !message.serverContent) {
      const audioData = this.base64ToArrayBuffer(message.data);
      this.callbacks.onAudio?.(audioData);
    }

    // Usage metadata for token tracking
    if (message.usageMetadata) {
      const metadata: UsageMetadata = {
        inputTokens: message.usageMetadata.inputTokens || 0,
        outputTokens: message.usageMetadata.outputTokens || 0,
        totalTokens: message.usageMetadata.totalTokens || 0
      };

      // Accumulate usage
      this.tokenUsage.inputTokens += metadata.inputTokens;
      this.tokenUsage.outputTokens += metadata.outputTokens;
      this.tokenUsage.totalTokens += metadata.totalTokens;

      this.callbacks.onUsageMetadata?.(metadata);
    }
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(): void {
    const wasConnected = this.isConnected;
    this.isConnected = false;
    this.session = null;

    if (wasConnected) {
      this.callbacks.onDisconnected?.();
    }

    // Auto-reconnect if not paused and should reconnect
    if (this.shouldReconnect && !this.isPaused) {
      console.log('[GeminiClient] Auto-reconnecting in 2s...');
      setTimeout(() => {
        if (this.shouldReconnect && !this.isPaused) {
          this.tokenService.clearCache(); // Get fresh token
          this.connect().catch(console.error);
        }
      }, 2000);
    }
  }

  /**
   * Send audio data to Gemini
   */
  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.session || !this.isConnected || this.isPaused) return;

    try {
      const base64Audio = this.arrayBufferToBase64(audioData);
      await this.session.sendRealtimeInput({
        audio: {
          data: base64Audio,
          mimeType: 'audio/pcm;rate=16000'
        }
      });
    } catch (error) {
      console.error('[GeminiClient] Error sending audio:', error);
    }
  }

  /**
   * Send audio as base64 string
   */
  async sendAudioBase64(base64Audio: string): Promise<void> {
    if (!this.session || !this.isConnected || this.isPaused) return;

    try {
      await this.session.sendRealtimeInput({
        audio: {
          data: base64Audio,
          mimeType: 'audio/pcm;rate=16000'
        }
      });
    } catch (error) {
      console.error('[GeminiClient] Error sending audio:', error);
    }
  }

  /**
   * Send text message to Gemini
   */
  async sendText(text: string): Promise<void> {
    if (!this.session || !this.isConnected || this.isPaused) return;

    try {
      await this.session.sendClientContent({
        turns: {
          role: 'user',
          parts: [{ text }]
        },
        turnComplete: true
      });
    } catch (error) {
      console.error('[GeminiClient] Error sending text:', error);
    }
  }

  /**
   * Pause session - disconnects but stores handle for resume
   */
  async pause(): Promise<void> {
    if (!this.isConnected) {
      console.log('[GeminiClient] Not connected, nothing to pause');
      return;
    }

    console.log('[GeminiClient] Pausing session...');
    console.log('[GeminiClient] Current session handle:', this.sessionHandle ? this.sessionHandle.substring(0, 30) + '...' : 'none');

    this.isPaused = true;
    this.shouldReconnect = false;

    // Store session handle for resume
    if (this.sessionHandle) {
      this.storeSessionHandle(this.sessionHandle);
      console.log('[GeminiClient] Session handle stored for resume');
    } else {
      console.warn('[GeminiClient] No session handle available to store!');
    }

    // Clear token cache so we get a fresh token on resume
    this.tokenService.clearCache();
    console.log('[GeminiClient] Token cache cleared for clean resume');

    // Close connection
    await this.disconnect();
  }

  /**
   * Resume a paused session
   */
  async resume(): Promise<void> {
    console.log('[GeminiClient] Resuming session...');

    // Check if we can resume
    const storedHandle = this.getStoredSessionHandle();
    console.log('[GeminiClient] Stored session handle:', storedHandle ? storedHandle.substring(0, 30) + '...' : 'none');

    if (storedHandle) {
      this.sessionHandle = storedHandle;
      console.log('[GeminiClient] Will attempt to resume with stored handle');
    } else {
      console.warn('[GeminiClient] No stored handle - will start new session');
    }

    this.isPaused = false;
    this.shouldReconnect = true;

    // IMPORTANT: Clear token cache to get a fresh token for resume
    // Each ephemeral token can only be used once (uses: 1)
    this.tokenService.clearCache();
    console.log('[GeminiClient] Cleared token cache for fresh token');

    // Reconnect with stored session handle
    await this.connect();
  }

  /**
   * Disconnect from Gemini
   */
  async disconnect(): Promise<void> {
    console.log('[GeminiClient] Disconnecting...');
    this.shouldReconnect = false;
    this.isConnected = false;

    if (this.session) {
      try {
        this.session.close();
      } catch {
        // Ignore close errors
      }
      this.session = null;
    }

    this.client = null;
  }

  /**
   * Store session handle to localStorage
   */
  private storeSessionHandle(handle: string): void {
    try {
      localStorage.setItem(SESSION_HANDLE_KEY, handle);
      localStorage.setItem(SESSION_HANDLE_TIMESTAMP_KEY, Date.now().toString());
    } catch {
      // localStorage might not be available
    }
  }

  /**
   * Get stored session handle if still valid (within 2hr window)
   */
  private getStoredSessionHandle(): string | null {
    try {
      const handle = localStorage.getItem(SESSION_HANDLE_KEY);
      const timestamp = localStorage.getItem(SESSION_HANDLE_TIMESTAMP_KEY);

      if (!handle || !timestamp) return null;

      // Check if handle is still valid (2hr window)
      const age = Date.now() - parseInt(timestamp, 10);
      if (age > SESSION_RESUME_WINDOW) {
        this.clearStoredSessionHandle();
        return null;
      }

      return handle;
    } catch {
      return null;
    }
  }

  /**
   * Clear stored session handle
   */
  clearStoredSessionHandle(): void {
    try {
      localStorage.removeItem(SESSION_HANDLE_KEY);
      localStorage.removeItem(SESSION_HANDLE_TIMESTAMP_KEY);
    } catch {
      // Ignore
    }
    this.sessionHandle = null;
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get paused(): boolean {
    return this.isPaused;
  }

  get currentSessionHandle(): string | null {
    return this.sessionHandle;
  }

  get canResume(): boolean {
    return this.getStoredSessionHandle() !== null;
  }

  get usage(): UsageMetadata {
    return { ...this.tokenUsage };
  }

  /**
   * Reset token usage counter
   */
  resetUsage(): void {
    this.tokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0
    };
  }
}
