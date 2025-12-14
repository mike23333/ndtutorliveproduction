/**
 * TypeScript Bridge to JavaScript Web Audio Handler
 * Provides type-safe interface for audio operations
 */

// Type definitions for JavaScript AudioHandler
declare global {
  interface Window {
    AudioHandler: new () => AudioHandlerInstance;
  }
}

interface AudioHandlerInstance {
  initAudioContext(): Promise<AudioContext>;
  startRecording(onDataCallback: (base64Data: string) => void): Promise<boolean>;
  stopRecording(): void;
  playChunk(base64Data: string): Promise<void>;
  destroy(): void;
  // Audio capture for error review
  extractAudioAsWav(): Blob | null;
  extractRecentAudioAsWav(maxSeconds?: number): Blob | null;
  clearTurnBuffer(): void;
}

export type AudioDataCallback = (base64Data: string) => void;

export class WebAudioManager {
  private audioHandler: AudioHandlerInstance | null = null;
  private audioDataCallbacks: Set<AudioDataCallback> = new Set();
  private isRecordingActive = false;

  constructor() {
    this.loadAudioHandler();
  }

  /**
   * Load the JavaScript AudioHandler
   */
  private loadAudioHandler(): void {
    // AudioHandler is loaded from public/audio_processor.js via script tag
    if (typeof window !== 'undefined' && window.AudioHandler) {
      this.audioHandler = new window.AudioHandler();
    } else {
      console.error('AudioHandler not loaded. Ensure audio_processor.js is included in index.html');
    }
  }

  /**
   * Initialize audio context (requires user gesture)
   */
  async initialize(): Promise<void> {
    if (!this.audioHandler) {
      throw new Error('AudioHandler not initialized');
    }

    try {
      await this.audioHandler.initAudioContext();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw new Error('Failed to initialize audio: ' + (error as Error).message);
    }
  }

  /**
   * Start recording from microphone
   * @param callback - Function to receive audio data chunks
   */
  async startRecording(callback: AudioDataCallback): Promise<void> {
    console.log('WebAudioManager.startRecording called, audioHandler:', !!this.audioHandler);

    if (!this.audioHandler) {
      throw new Error('AudioHandler not initialized');
    }

    if (this.isRecordingActive) {
      console.warn('Recording already active');
      return;
    }

    try {
      // Add callback to set
      this.audioDataCallbacks.add(callback);
      console.log('Starting recording with', this.audioDataCallbacks.size, 'callbacks');

      // Start recording with multiplexed callback
      await this.audioHandler.startRecording((base64Data: string) => {
        console.log('WebAudioBridge received audio data, size:', base64Data.length, 'callbacks:', this.audioDataCallbacks.size);
        // Call all registered callbacks
        this.audioDataCallbacks.forEach(cb => cb(base64Data));
      });

      console.log('Recording active, isRecordingActive:', this.isRecordingActive);
      this.isRecordingActive = true;
    } catch (error) {
      this.audioDataCallbacks.delete(callback);

      if ((error as Error).name === 'NotAllowedError') {
        throw new Error('Microphone permission denied');
      } else if ((error as Error).name === 'NotFoundError') {
        throw new Error('No microphone found');
      } else {
        throw new Error('Failed to start recording: ' + (error as Error).message);
      }
    }
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    if (!this.audioHandler) {
      return;
    }

    this.audioHandler.stopRecording();
    this.audioDataCallbacks.clear();
    this.isRecordingActive = false;
  }

  /**
   * Play audio chunk from Gemini
   * @param base64Audio - Base64-encoded PCM audio data
   */
  async playAudioChunk(base64Audio: string): Promise<void> {
    if (!this.audioHandler) {
      throw new Error('AudioHandler not initialized');
    }

    try {
      await this.audioHandler.playChunk(base64Audio);
    } catch (error) {
      console.error('Failed to play audio chunk:', error);
      throw new Error('Failed to play audio: ' + (error as Error).message);
    }
  }

  /**
   * Extract the entire turn's audio as WAV blob for error capture
   * Used when mark_for_review is triggered to capture the student's error
   * @returns WAV Blob or null if no data available
   */
  extractErrorAudio(): Blob | null {
    if (!this.audioHandler) {
      console.warn('WebAudioManager: AudioHandler not initialized for audio extraction');
      return null;
    }

    try {
      return this.audioHandler.extractAudioAsWav();
    } catch (error) {
      console.error('WebAudioManager: Failed to extract error audio:', error);
      return null;
    }
  }

  /**
   * Extract only the last N seconds of audio as WAV blob
   * Used for user message replay (faster than full turn)
   * @param maxSeconds Maximum seconds to extract (default 10)
   * @returns WAV Blob or null if no data available
   */
  extractRecentAudio(maxSeconds: number = 10): Blob | null {
    if (!this.audioHandler) {
      console.warn('WebAudioManager: AudioHandler not initialized for audio extraction');
      return null;
    }

    try {
      return this.audioHandler.extractRecentAudioAsWav(maxSeconds);
    } catch (error) {
      console.error('WebAudioManager: Failed to extract recent audio:', error);
      return null;
    }
  }

  /**
   * Clear the turn buffer - call when Gemini finishes responding
   * This marks the start of a new user turn
   */
  clearTurnBuffer(): void {
    if (!this.audioHandler) {
      return;
    }

    try {
      this.audioHandler.clearTurnBuffer();
    } catch (error) {
      console.error('WebAudioManager: Failed to clear turn buffer:', error);
    }
  }

  /**
   * Check if recording is active
   */
  get isRecording(): boolean {
    return this.isRecordingActive;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.audioHandler) {
      this.audioHandler.destroy();
      this.audioHandler = null;
    }
    this.audioDataCallbacks.clear();
    this.isRecordingActive = false;
  }
}

// Singleton instance
let webAudioManagerInstance: WebAudioManager | null = null;

/**
 * Get singleton instance of WebAudioManager
 */
export function getWebAudioManager(): WebAudioManager {
  if (!webAudioManagerInstance) {
    webAudioManagerInstance = new WebAudioManager();
  }
  return webAudioManagerInstance;
}

/**
 * Cleanup singleton instance
 */
export function destroyWebAudioManager(): void {
  if (webAudioManagerInstance) {
    webAudioManagerInstance.destroy();
    webAudioManagerInstance = null;
  }
}
