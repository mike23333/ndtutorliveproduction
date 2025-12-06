/**
 * React Hook for Audio Recording
 * Manages microphone recording state and audio chunks
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { getWebAudioManager } from '../services/webAudioBridge';

export interface UseAudioRecorderResult {
  isRecording: boolean;
  audioChunks: string[];
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearChunks: () => void;
  error: string | null;
  isInitialized: boolean;
}

export function useAudioRecorder(): UseAudioRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const audioManagerRef = useRef(getWebAudioManager());
  const isMountedRef = useRef(true);

  /**
   * Initialize audio context on mount
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        // Note: Actual initialization happens on user gesture (startRecording)
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize audio recorder:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize audio');
      }
    };

    initialize();

    return () => {
      isMountedRef.current = false;
      // Cleanup on unmount
      if (audioManagerRef.current.isRecording) {
        audioManagerRef.current.stopRecording();
      }
    };
  }, []);

  /**
   * Start recording (requires user gesture for AudioContext)
   */
  const startRecording = useCallback(async () => {
    console.log('useAudioRecorder.startRecording called, isInitialized:', isInitialized, 'isRecording:', isRecording);

    if (!isInitialized) {
      setError('Audio recorder not initialized');
      return;
    }

    if (isRecording) {
      console.warn('Already recording');
      return;
    }

    try {
      setError(null);

      // Initialize audio context (requires user gesture)
      console.log('Initializing audio context...');
      await audioManagerRef.current.initialize();
      console.log('Audio context initialized');

      // Start recording with callback
      console.log('Starting audio recording...');
      await audioManagerRef.current.startRecording((base64Data: string) => {
        console.log('Audio chunk received, size:', base64Data.length);
        if (isMountedRef.current) {
          setAudioChunks((prev: string[]) => [...prev, base64Data]);
        }
      });

      console.log('Recording started successfully');
      if (isMountedRef.current) {
        setIsRecording(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      console.error('Recording error:', err);

      if (isMountedRef.current) {
        setError(errorMessage);
        setIsRecording(false);
      }

      // Handle specific error cases
      if (errorMessage.includes('permission denied')) {
        // Microphone permission denied
        alert('Microphone permission is required for voice interaction. Please allow microphone access and try again.');
      } else if (errorMessage.includes('No microphone found')) {
        alert('No microphone detected. Please connect a microphone and try again.');
      }
    }
  }, [isInitialized, isRecording]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (!isRecording) {
      return;
    }

    try {
      audioManagerRef.current.stopRecording();

      if (isMountedRef.current) {
        setIsRecording(false);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to stop recording');
      }
    }
  }, [isRecording]);

  /**
   * Clear audio chunks
   */
  const clearChunks = useCallback(() => {
    setAudioChunks([]);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Destroy audio manager when component unmounts
      // Note: This might affect other components using the same instance
      // Consider component lifecycle carefully
    };
  }, []);

  return {
    isRecording,
    audioChunks,
    startRecording,
    stopRecording,
    clearChunks,
    error,
    isInitialized
  };
}

/**
 * Hook for playing audio responses
 */
export function useAudioPlayer() {
  const audioManagerRef = useRef(getWebAudioManager());
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      setError(null);
      setIsPlaying(true);

      await audioManagerRef.current.playAudioChunk(base64Audio);

      // Note: Audio might continue playing after this
      // Consider tracking playback state more accurately
      setIsPlaying(false);
    } catch (err) {
      console.error('Failed to play audio:', err);
      setError(err instanceof Error ? err.message : 'Failed to play audio');
      setIsPlaying(false);
    }
  }, []);

  return {
    playAudio,
    isPlaying,
    error
  };
}
