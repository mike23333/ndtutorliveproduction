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
import { DEFAULT_FUNCTION_CALLING_INSTRUCTIONS } from '../types/functions';
import {
  createSessionUsage,
  updateSessionUsage,
  finalizeSessionUsage
} from '../services/firebase/tokenUsage';
import {
  saveStruggleItem,
  updateUserPreference,
  saveSessionSummary,
} from '../services/firebase/sessionData';
import type { AIRole } from '../types/ai-role';
import type { UsageMetadata, GeminiFunctionCall, GeminiFunctionResponse } from '../types/gemini';
import type {
  SaveStruggleItemParams,
  UpdateUserProfileParams,
  ShowSessionSummaryParams,
} from '../types/functions';
import type { BadgeDefinition } from '../types/badges';

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

  // Session summary (from function call)
  sessionSummary: ShowSessionSummaryParams | null;

  // Newly earned badges (from session completion)
  newBadges: BadgeDefinition[];

  // Session timing
  sessionStartTime: Date | null;

  // Actions
  toggleMute: () => void;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  sendTextMessage: (text: string) => void;
  clearMessages: () => void;
  reconnect: () => void;
  startNewSession: () => void;
  updateSystemPrompt: (role: AIRole) => void;
  triggerSessionEnd: () => void;
  clearSessionSummary: () => void;
  clearNewBadges: () => void;
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

  // Session summary state (from show_session_summary function call)
  const [sessionSummary, setSessionSummary] = useState<ShowSessionSummaryParams | null>(null);

  // Newly earned badges state
  const [newBadges, setNewBadges] = useState<BadgeDefinition[]>([]);

  // Session timing
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Refs
  const clientRef = useRef<GeminiDirectClient | null>(null);
  const roleRef = useRef<AIRole | undefined>(initialRole);
  const messageIdRef = useRef(0);
  const isStreamingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef(userId || `user_${Date.now()}`);
  const missionIdRef = useRef<string | null>(null);

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
   * Handle function calls from Gemini
   */
  const handleToolCalls = useCallback(async (
    functionCalls: GeminiFunctionCall[]
  ): Promise<GeminiFunctionResponse[]> => {
    const responses: GeminiFunctionResponse[] = [];

    for (const fc of functionCalls) {
      console.log('[Function] Processing:', fc.name, fc.args);

      try {
        switch (fc.name) {
          case 'save_struggle_item': {
            const params = fc.args as unknown as SaveStruggleItemParams;
            if (sessionIdRef.current) {
              await saveStruggleItem(
                sessionIdRef.current,
                userIdRef.current,
                params,
                missionIdRef.current || undefined
              );
            }
            responses.push({
              id: fc.id,
              name: fc.name,
              response: { result: 'Struggle item saved successfully' }
            });
            break;
          }

          case 'update_user_profile': {
            const params = fc.args as unknown as UpdateUserProfileParams;
            await updateUserPreference(userIdRef.current, params);
            responses.push({
              id: fc.id,
              name: fc.name,
              response: { result: 'User profile updated successfully' }
            });
            break;
          }

          case 'show_session_summary': {
            const params = fc.args as unknown as ShowSessionSummaryParams;
            console.log('[Function] Session summary received:', params);

            // Calculate session duration
            const durationSeconds = sessionStartTime
              ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)
              : 0;

            // Save to Firestore and check for badges
            if (sessionIdRef.current) {
              const result = await saveSessionSummary(
                sessionIdRef.current,
                userIdRef.current,
                missionIdRef.current || '',
                durationSeconds,
                params
              );

              // Set newly earned badges if any
              if (result.newBadges.length > 0) {
                setNewBadges(result.newBadges);
                console.log('[Function] New badges earned:', result.newBadges.map(b => b.name).join(', '));
              }
            }

            // Set state to trigger UI modal
            setSessionSummary(params);

            responses.push({
              id: fc.id,
              name: fc.name,
              response: { result: 'Session summary displayed' }
            });

            // Disconnect after summary is complete - session is over
            console.log('[Function] Session complete, disconnecting...');
            setTimeout(async () => {
              await stopAudioStreaming();
              if (clientRef.current) {
                await clientRef.current.disconnect();
                setIsConnected(false);
                setIsListening(false);
              }
            }, 500); // Small delay to ensure response is sent

            break;
          }

          default:
            console.warn('[Function] Unknown function:', fc.name);
            responses.push({
              id: fc.id,
              name: fc.name,
              response: { result: 'Unknown function', error: 'Function not implemented' }
            });
        }
      } catch (error) {
        console.error('[Function] Error processing', fc.name, ':', error);
        responses.push({
          id: fc.id,
          name: fc.name,
          response: { result: 'Error', error: String(error) }
        });
      }
    }

    return responses;
  }, [sessionStartTime, stopAudioStreaming]);

  /**
   * Trigger end of session - sends prompt to Gemini to summarize
   */
  const triggerSessionEnd = useCallback(() => {
    if (!isConnected || !clientRef.current) {
      console.warn('[Gemini] Cannot trigger session end - not connected');
      return;
    }

    console.log('[Gemini] Triggering session end...');

    const endPrompt = `The tutoring session is now ending. Please provide a session summary by calling the show_session_summary function.

Include in your summary:
1. 2-4 specific things the student did well during our conversation
2. 2-3 areas they should focus on practicing
3. A star rating from 1-5 based on their overall performance
4. A brief encouraging summary paragraph

Base your assessment on our entire conversation. Call the show_session_summary function now.`;

    clientRef.current.sendText(endPrompt);
  }, [isConnected]);

  /**
   * Clear session summary (after modal is closed)
   */
  const clearSessionSummary = useCallback(() => {
    setSessionSummary(null);
  }, []);

  /**
   * Clear newly earned badges (after badge modal is closed)
   */
  const clearNewBadges = useCallback(() => {
    setNewBadges([]);
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

    // Use the raw system prompt from the role (teacher's custom prompt)
    // Only append function calling instructions if enabled
    let systemPrompt: string | undefined;
    if (roleRef.current?.systemPrompt) {
      systemPrompt = roleRef.current.systemPrompt;

      // Append function calling instructions if enabled
      if (roleRef.current.functionCallingEnabled !== false) {
        const fcInstructions = roleRef.current.functionCallingInstructions || DEFAULT_FUNCTION_CALLING_INSTRUCTIONS;
        systemPrompt += '\n\n# FUNCTION CALLING\n' + fcInstructions;
      }

      console.log('[Gemini] Using system prompt:', systemPrompt.substring(0, 200) + '...');
    }

    // Store mission ID from role if available
    if (roleRef.current?.missionId) {
      missionIdRef.current = roleRef.current.missionId;
    }

    // Create session in Firebase with missionId and teacherId for cost tracking
    sessionIdRef.current = await createSessionUsage(
      userIdRef.current,
      undefined, // sessionHandle
      missionIdRef.current || undefined,
      roleRef.current?.teacherId || undefined
    );

    // Determine if function calling should be enabled
    const enableFunctionCalling = roleRef.current?.functionCallingEnabled !== false;

    // Create the direct client
    const client = new GeminiDirectClient({
      userId: userIdRef.current,
      systemPrompt,
      enableFunctionCalling,
      callbacks: {
        onConnected: () => {
          console.log('[Gemini] Connected');
          setIsConnected(true);
          setIsConnecting(false);
          setConnectionError(null);
          setIsPaused(false);
          setSessionStartTime(new Date());
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

          // Update Firebase with userId for new subcollection structure
          if (sessionIdRef.current) {
            updateSessionUsage(sessionIdRef.current, metadata, userIdRef.current);
          }
        },
        onToolCall: handleToolCalls
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

    // Create new session tracking with missionId and teacherId
    sessionIdRef.current = await createSessionUsage(
      userIdRef.current,
      clientRef.current.currentSessionHandle || undefined,
      missionIdRef.current || undefined,
      roleRef.current?.teacherId || undefined
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
   * Connect when role is available
   */
  useEffect(() => {
    // Only connect when we have a valid role with systemPrompt
    if (!initialRole?.systemPrompt) {
      console.log('[Gemini] Waiting for role with systemPrompt...');
      return;
    }

    // Update role ref BEFORE connecting
    roleRef.current = initialRole;
    console.log('[Gemini] Role set, connecting with systemPrompt:', initialRole.systemPrompt.substring(0, 100) + '...');

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
  }, [initialRole?.systemPrompt]);

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

    // Session summary (from function call)
    sessionSummary,

    // Newly earned badges
    newBadges,

    // Session timing
    sessionStartTime,

    // Actions
    toggleMute,
    pauseSession,
    resumeSession,
    sendTextMessage,
    clearMessages,
    reconnect,
    startNewSession,
    updateSystemPrompt,
    triggerSessionEnd,
    clearSessionSummary,
    clearNewBadges
  };
}
