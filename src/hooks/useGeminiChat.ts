/**
 * Hook for Gemini Live API Chat Integration (Direct Connection)
 *
 * Features:
 * - Direct client-to-Gemini connection using ephemeral tokens
 * - Affective dialog (emotion-aware responses)
 * - Always-listening mode with automatic VAD
 * - Session pause/resume (within 2hr window)
 * - Token usage tracking in Firebase
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GeminiDirectClient } from '../services/geminiDirectClient';
import { generateSystemPrompt } from '../services/promptGenerator';
import {
  createSessionUsage,
  updateSessionUsage,
  finalizeSessionUsage
} from '../services/firebase/tokenUsage';
import type { AIRole } from '../types/ai-role';
import type { UsageMetadata } from '../types/gemini';

export interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  isWhisper: boolean;
  translation?: string;
  audioData?: string;
}

export interface UseGeminiChatResult {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Listening state (always true when connected, unless muted)
  isListening: boolean;
  isMuted: boolean;

  // Pause state
  isPaused: boolean;
  canResume: boolean;

  // Playback state
  isPlaying: boolean;

  // Token usage
  tokenUsage: UsageMetadata;

  // Messages
  messages: ChatMessage[];

  // Actions
  toggleMute: () => void;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  sendTextMessage: (text: string) => void;
  clearMessages: () => void;
  reconnect: () => void;
  startNewSession: () => void;
  updateSystemPrompt: (role: AIRole) => void;
}

export function useGeminiChat(
  initialRole?: AIRole,
  userId?: string
): UseGeminiChatResult {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Always-listening state
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Pause state
  const [isPaused, setIsPaused] = useState(false);
  const [canResume, setCanResume] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);

  // Token usage
  const [tokenUsage, setTokenUsage] = useState<UsageMetadata>({
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  });

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Refs
  const clientRef = useRef<GeminiDirectClient | null>(null);
  const roleRef = useRef<AIRole | undefined>(initialRole);
  const messageIdRef = useRef(0);
  const isStreamingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef(userId || `user_${Date.now()}`);

  /**
   * Generate next message ID
   */
  const getNextMessageId = useCallback(() => {
    messageIdRef.current += 1;
    return messageIdRef.current;
  }, []);

  /**
   * Add message to chat
   */
  const addMessage = useCallback((
    text: string,
    isUser: boolean,
    isWhisper: boolean = false,
    translation?: string,
    audioData?: string
  ) => {
    const message: ChatMessage = {
      id: getNextMessageId(),
      text,
      isUser,
      isWhisper,
      translation,
      audioData
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, [getNextMessageId]);

  /**
   * Play audio response
   */
  const playAudioResponse = useCallback(async (audioData: ArrayBuffer) => {
    try {
      const audioManager = (await import('../services/webAudioBridge')).getWebAudioManager();
      await audioManager.initialize();

      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(audioData);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      setIsPlaying(true);
      await audioManager.playAudioChunk(base64);
      setIsPlaying(false);
    } catch (error) {
      console.error('[Audio] Playback error:', error);
      setIsPlaying(false);
    }
  }, []);

  /**
   * Start streaming audio to Gemini
   */
  const startAudioStreaming = useCallback(async () => {
    if (isStreamingRef.current || !clientRef.current?.connected) {
      return;
    }

    try {
      const audioManager = (await import('../services/webAudioBridge')).getWebAudioManager();
      await audioManager.initialize();
      await audioManager.startRecording((base64Data: string) => {
        if (!isMuted && clientRef.current?.connected) {
          clientRef.current.sendAudioBase64(base64Data);
        }
      });

      isStreamingRef.current = true;
      setIsListening(true);
      console.log('[Audio] Started streaming');
    } catch (error) {
      console.error('[Audio] Failed to start streaming:', error);
      setConnectionError('Microphone access denied');
    }
  }, [isMuted]);

  /**
   * Stop streaming audio
   */
  const stopAudioStreaming = useCallback(async () => {
    if (!isStreamingRef.current) return;

    try {
      const audioManager = (await import('../services/webAudioBridge')).getWebAudioManager();
      audioManager.stopRecording();
    } catch {
      // Ignore errors during cleanup
    }

    isStreamingRef.current = false;
    setIsListening(false);
    console.log('[Audio] Stopped streaming');
  }, []);

  /**
   * Initialize and connect to Gemini
   */
  const connect = useCallback(async () => {
    if (clientRef.current?.connected) {
      console.log('[Gemini] Already connected');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    // Build system prompt
    const systemPrompt = roleRef.current
      ? generateSystemPrompt(roleRef.current)
      : undefined;

    // Create session in Firebase
    sessionIdRef.current = await createSessionUsage(userIdRef.current);

    // Create the direct client
    const client = new GeminiDirectClient({
      userId: userIdRef.current,
      systemPrompt,
      callbacks: {
        onConnected: () => {
          console.log('[Gemini] Connected');
          setIsConnected(true);
          setIsConnecting(false);
          setConnectionError(null);
          setIsPaused(false);
          startAudioStreaming();
        },
        onDisconnected: () => {
          console.log('[Gemini] Disconnected');
          setIsConnected(false);
          setIsListening(false);
          stopAudioStreaming();
        },
        onAudio: (audioData: ArrayBuffer) => {
          playAudioResponse(audioData);
        },
        onText: (text: string) => {
          console.log('[Gemini] Received text:', text);
          addMessage(text, false, false);
        },
        onTurnComplete: () => {
          console.log('[Gemini] Turn complete');
        },
        onSessionUpdate: (_handle: string) => {
          console.log('[Gemini] Session handle updated');
          setCanResume(true);
        },
        onGoAway: (timeRemaining: number) => {
          console.log(`[Gemini] GoAway: ${timeRemaining}s remaining`);
        },
        onError: (error: Error) => {
          console.error('[Gemini] Error:', error);
          setConnectionError(error.message);
          setIsConnecting(false);
        },
        onUsageMetadata: (metadata: UsageMetadata) => {
          // Update local state
          setTokenUsage(prev => ({
            inputTokens: prev.inputTokens + metadata.inputTokens,
            outputTokens: prev.outputTokens + metadata.outputTokens,
            totalTokens: prev.totalTokens + metadata.totalTokens
          }));

          // Update Firebase
          if (sessionIdRef.current) {
            updateSessionUsage(sessionIdRef.current, metadata);
          }
        }
      }
    });

    clientRef.current = client;
    setCanResume(client.canResume);

    try {
      await client.connect();
    } catch (error) {
      console.error('[Gemini] Connection failed:', error);
      setConnectionError((error as Error).message);
      setIsConnecting(false);
    }
  }, [startAudioStreaming, stopAudioStreaming, playAudioResponse, addMessage]);

  /**
   * Pause session - keeps session handle for resume
   */
  const pauseSession = useCallback(async () => {
    if (!clientRef.current) return;

    console.log('[Gemini] Pausing session...');
    console.log('[Gemini] Current message count:', messages.length);
    await stopAudioStreaming();
    await clientRef.current.pause();

    setIsPaused(true);
    setIsConnected(false);
    setIsListening(false);
    setCanResume(true);

    // Finalize current session in Firebase
    if (sessionIdRef.current) {
      await finalizeSessionUsage(
        sessionIdRef.current,
        userIdRef.current,
        clientRef.current.currentSessionHandle || undefined
      );
    }
    console.log('[Gemini] Session paused. Messages preserved:', messages.length);
  }, [stopAudioStreaming, messages.length]);

  /**
   * Resume a paused session
   */
  const resumeSession = useCallback(async () => {
    if (!clientRef.current) return;

    console.log('[Gemini] Resuming session...');
    console.log('[Gemini] Messages before resume:', messages.length);
    console.log('[Gemini] Session handle available:', clientRef.current.currentSessionHandle ? 'yes' : 'no');

    // Create new session tracking
    sessionIdRef.current = await createSessionUsage(
      userIdRef.current,
      clientRef.current.currentSessionHandle || undefined
    );

    // Reset token usage for new session (but NOT messages!)
    setTokenUsage({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });

    setIsConnecting(true);
    await clientRef.current.resume();
    console.log('[Gemini] Resume initiated. Messages still:', messages.length);
  }, [messages.length]);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      console.log(`[Audio] ${newMuted ? 'Muted' : 'Unmuted'}`);
      return newMuted;
    });
  }, []);

  /**
   * Send text message
   */
  const sendTextMessage = useCallback((text: string) => {
    if (!isConnected || !clientRef.current) {
      console.warn('[Gemini] Not connected');
      return;
    }

    addMessage(text, true, false);
    clientRef.current.sendText(text);
  }, [isConnected, addMessage]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    messageIdRef.current = 0;
  }, []);

  /**
   * Reconnect to Gemini
   */
  const reconnect = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect();
      clientRef.current = null;
    }
    await stopAudioStreaming();
    await connect();
  }, [connect, stopAudioStreaming]);

  /**
   * Start a completely new session (clear stored handle)
   */
  const startNewSession = useCallback(async () => {
    // Finalize old session
    if (sessionIdRef.current && clientRef.current) {
      await finalizeSessionUsage(
        sessionIdRef.current,
        userIdRef.current,
        clientRef.current.currentSessionHandle || undefined
      );
    }

    // Clear stored session handle
    if (clientRef.current) {
      clientRef.current.clearStoredSessionHandle();
    }

    // Reset state
    clearMessages();
    setTokenUsage({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
    setCanResume(false);

    // Reconnect fresh
    await reconnect();
  }, [clearMessages, reconnect]);

  /**
   * Update system prompt with new role
   */
  const updateSystemPrompt = useCallback((role: AIRole) => {
    roleRef.current = role;
    reconnect();
  }, [reconnect]);

  /**
   * Connect on mount
   */
  useEffect(() => {
    connect();

    return () => {
      stopAudioStreaming();

      // Finalize session on unmount
      if (sessionIdRef.current && clientRef.current) {
        finalizeSessionUsage(
          sessionIdRef.current,
          userIdRef.current,
          clientRef.current.currentSessionHandle || undefined
        );
      }

      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  /**
   * Update role ref when initialRole changes
   */
  useEffect(() => {
    if (initialRole) {
      roleRef.current = initialRole;
    }
  }, [initialRole]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,

    // Listening state
    isListening,
    isMuted,

    // Pause state
    isPaused,
    canResume,

    // Playback state
    isPlaying,

    // Token usage
    tokenUsage,

    // Messages
    messages,

    // Actions
    toggleMute,
    pauseSession,
    resumeSession,
    sendTextMessage,
    clearMessages,
    reconnect,
    startNewSession,
    updateSystemPrompt
  };
}
