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
  saveReviewItem,
  updateUserPreference,
  saveSessionSummary,
  getReviewItem,
  markItemMastered,
  startReviewLesson,
} from '../services/firebase/sessionData';
import { getWebAudioManager } from '../services/webAudioBridge';
import type { AIRole } from '../types/ai-role';
import type { UsageMetadata, GeminiFunctionCall, GeminiFunctionResponse } from '../types/gemini';
import type {
  MarkForReviewParams,
  UpdateUserProfileParams,
  ShowSessionSummaryParams,
  MarkItemMasteredParams,
  PlayStudentAudioParams,
  MarkTaskCompleteParams,
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

// Audio playback request for play_student_audio function
export interface AudioPlaybackRequest {
  url: string;
  itemId: string;
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

  // Session timed out (Gemini didn't respond to end prompt)
  sessionTimedOut: boolean;

  // Audio playback for review lessons (play_student_audio function)
  audioToPlay: AudioPlaybackRequest | null;
  onAudioPlaybackComplete: () => void;
  onAudioPlaybackError: (error: Error) => void;

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
  userId?: string,
  onTaskComplete?: (taskId: string) => void
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

  // Session timeout state (when Gemini doesn't respond to end prompt)
  const [sessionTimedOut, setSessionTimedOut] = useState(false);

  // Audio playback state for play_student_audio function
  const [audioToPlay, setAudioToPlay] = useState<AudioPlaybackRequest | null>(null);

  // Refs
  const clientRef = useRef<GeminiDirectClient | null>(null);
  const roleRef = useRef<AIRole | undefined>(initialRole);
  const messageIdRef = useRef(0);
  const isStreamingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef(userId || `user_${Date.now()}`);
  const missionIdRef = useRef<string | null>(null);
  const sessionEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recentReviewItems = useRef<Map<string, number>>(new Map()); // Deduplication map: key -> timestamp
  const recentMasteryMarks = useRef<Map<string, number>>(new Map()); // Rate limiting for mark_item_mastered
  const audioPlaybackResolverRef = useRef<{ resolve: () => void; reject: (e: Error) => void } | null>(null);

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
   * Force end session - backup when Gemini doesn't respond to end prompt
   * This protects against continued billing if the LLM fails to call show_session_summary
   */
  const forceEndSession = useCallback(async () => {
    console.warn('[Gemini] Force ending session due to timeout');

    // Clear the timeout ref
    if (sessionEndTimeoutRef.current) {
      clearTimeout(sessionEndTimeoutRef.current);
      sessionEndTimeoutRef.current = null;
    }

    // Stop audio streaming
    await stopAudioStreaming();

    // Disconnect from Gemini
    if (clientRef.current) {
      await clientRef.current.disconnect();
    }

    // Finalize session in Firebase (important for billing tracking)
    if (sessionIdRef.current) {
      await finalizeSessionUsage(
        sessionIdRef.current,
        userIdRef.current,
        clientRef.current?.currentSessionHandle || undefined
      );
    }

    // Update state to signal timeout to ChatPage (no summary modal, just navigate)
    setSessionTimedOut(true);
    setIsConnected(false);
    setIsListening(false);

    console.log('[Gemini] Session force-ended successfully');
  }, [stopAudioStreaming]);

  /**
   * Callback for when audio playback completes successfully
   */
  const onAudioPlaybackComplete = useCallback(() => {
    console.log('[Gemini] Audio playback completed');
    setAudioToPlay(null);
    if (audioPlaybackResolverRef.current) {
      audioPlaybackResolverRef.current.resolve();
      audioPlaybackResolverRef.current = null;
    }
  }, []);

  /**
   * Callback for when audio playback fails
   */
  const onAudioPlaybackError = useCallback((error: Error) => {
    console.error('[Gemini] Audio playback error:', error);
    setAudioToPlay(null);
    if (audioPlaybackResolverRef.current) {
      audioPlaybackResolverRef.current.reject(error);
      audioPlaybackResolverRef.current = null;
    }
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
          case 'mark_for_review': {
            const params = fc.args as unknown as MarkForReviewParams;

            // Validate required fields (Gemini sometimes echoes back our response as a new call)
            if (!params.user_sentence || !params.error_type) {
              console.warn('[Function] Invalid mark_for_review params, skipping:', fc.args);
              responses.push({
                id: fc.id,
                name: fc.name,
                response: { result: 'Invalid parameters - skipped' }
              });
              break;
            }

            // Deduplication: Check if we've seen this exact error recently (within 30s)
            const dedupeKey = `${params.user_sentence}|${params.error_type}`;
            const now = Date.now();
            if (recentReviewItems.current.has(dedupeKey)) {
              const lastSeen = recentReviewItems.current.get(dedupeKey)!;
              if (now - lastSeen < 30000) { // 30 second window
                console.log('[Function] Skipping duplicate mark_for_review:', params.user_sentence.substring(0, 30));
                responses.push({
                  id: fc.id,
                  name: fc.name,
                  response: { result: 'Duplicate - already saved recently' }
                });
                break;
              }
            }
            recentReviewItems.current.set(dedupeKey, now);

            // Extract entire turn's audio (before any awaits to minimize latency)
            let audioBlob: Blob | null = null;
            try {
              const audioManager = getWebAudioManager();
              audioBlob = audioManager.extractErrorAudio(); // Entire turn
              console.log('[Function] Extracted error audio:',
                audioBlob ? `${(audioBlob.size / 1024).toFixed(1)} KB` : 'null');
            } catch (audioError) {
              console.warn('[Function] Audio extraction failed:', audioError);
              // Continue without audio - it's an enhancement, not required
            }

            if (sessionIdRef.current) {
              await saveReviewItem(
                sessionIdRef.current,
                userIdRef.current,
                params,
                missionIdRef.current || undefined,
                audioBlob // Pass extracted audio for background upload
              );
            }
            responses.push({
              id: fc.id,
              name: fc.name,
              response: { result: 'Review item saved successfully' }
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

            // Clear the backup timeout - Gemini responded successfully
            if (sessionEndTimeoutRef.current) {
              clearTimeout(sessionEndTimeoutRef.current);
              sessionEndTimeoutRef.current = null;
              console.log('[Function] Backup timeout cleared - Gemini responded');
            }

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

          case 'mark_item_mastered': {
            const params = fc.args as unknown as MarkItemMasteredParams;

            // Validate required fields
            if (!params.review_item_id || !params.confidence) {
              console.warn('[Function] Invalid mark_item_mastered params:', fc.args);
              responses.push({
                id: fc.id,
                name: fc.name,
                response: { result: 'Invalid parameters - skipped' }
              });
              break;
            }

            // Rate limiting: prevent marking same item multiple times in 10 seconds
            const now = Date.now();
            const lastMark = recentMasteryMarks.current.get(params.review_item_id);
            if (lastMark && now - lastMark < 10000) {
              console.log('[Function] Rate limiting mark_item_mastered:', params.review_item_id);
              responses.push({
                id: fc.id,
                name: fc.name,
                response: { result: 'Item recently marked - skipped' }
              });
              break;
            }
            recentMasteryMarks.current.set(params.review_item_id, now);

            await markItemMastered(
              userIdRef.current,
              params.review_item_id,
              params.confidence
            );

            responses.push({
              id: fc.id,
              name: fc.name,
              response: { result: `Item marked as mastered (confidence: ${params.confidence})` }
            });
            break;
          }

          case 'play_student_audio': {
            const params = fc.args as unknown as PlayStudentAudioParams;

            // Validate required fields
            if (!params.review_item_id) {
              console.warn('[Function] Invalid play_student_audio params:', fc.args);
              responses.push({
                id: fc.id,
                name: fc.name,
                response: { result: 'Invalid parameters - skipped' }
              });
              break;
            }

            // Fetch the review item to get the audio URL
            const reviewItem = await getReviewItem(userIdRef.current, params.review_item_id);

            if (!reviewItem) {
              console.warn('[Function] Review item not found:', params.review_item_id);
              responses.push({
                id: fc.id,
                name: fc.name,
                response: { result: 'Review item not found' }
              });
              break;
            }

            if (!reviewItem.audioUrl) {
              console.log('[Function] No audio available for item:', params.review_item_id);
              responses.push({
                id: fc.id,
                name: fc.name,
                response: { result: 'No audio available for this item' }
              });
              break;
            }

            // Create a promise that will be resolved when audio playback completes
            const playbackPromise = new Promise<void>((resolve, reject) => {
              audioPlaybackResolverRef.current = { resolve, reject };
            });

            // Signal UI to play audio
            console.log('[Function] Triggering audio playback for:', params.review_item_id);
            setAudioToPlay({ url: reviewItem.audioUrl, itemId: params.review_item_id });

            // Wait for playback to complete (with timeout)
            try {
              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Audio playback timeout')), 30000);
              });
              await Promise.race([playbackPromise, timeoutPromise]);

              responses.push({
                id: fc.id,
                name: fc.name,
                response: { result: 'Audio played successfully' }
              });
            } catch (playError) {
              console.error('[Function] Audio playback error:', playError);
              setAudioToPlay(null);
              audioPlaybackResolverRef.current = null;
              responses.push({
                id: fc.id,
                name: fc.name,
                response: { result: 'Audio playback failed', error: String(playError) }
              });
            }
            break;
          }

          case 'mark_task_complete': {
            const params = fc.args as unknown as MarkTaskCompleteParams;

            // Validate required fields
            if (!params.task_id) {
              console.warn('[Function] Invalid mark_task_complete params:', fc.args);
              responses.push({
                id: fc.id,
                name: fc.name,
                response: { result: 'Invalid parameters - skipped' }
              });
              break;
            }

            // Call the callback to update UI state
            if (onTaskComplete) {
              console.log('[Function] Marking task complete:', params.task_id);
              onTaskComplete(params.task_id);
            }

            responses.push({
              id: fc.id,
              name: fc.name,
              response: { result: 'Task marked complete' }
            });
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
  }, [sessionStartTime, stopAudioStreaming, onTaskComplete]);

  /**
   * Trigger end of session - sends prompt to Gemini to summarize
   * Includes a 30-second backup timeout to force-disconnect if Gemini doesn't respond
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

    // Start 30-second backup timeout to protect against billing if Gemini doesn't respond
    // This ensures the session ALWAYS terminates within 30 seconds of timer end
    if (sessionEndTimeoutRef.current) {
      clearTimeout(sessionEndTimeoutRef.current);
    }
    sessionEndTimeoutRef.current = setTimeout(() => {
      console.warn('[Gemini] Backup timeout fired - Gemini did not call show_session_summary within 30s');
      forceEndSession();
    }, 30000);

    console.log('[Gemini] Started 30s backup timeout');
  }, [isConnected, forceEndSession]);

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
    // Only append function calling instructions if enabled AND not a review lesson
    // (review lessons have their own function instructions built into the prompt)
    let systemPrompt: string | undefined;
    if (roleRef.current?.systemPrompt) {
      systemPrompt = roleRef.current.systemPrompt;

      // Append function calling instructions if enabled, but NOT for review lessons
      // Review lessons already have custom function instructions in the generated prompt
      if (roleRef.current.functionCallingEnabled !== false && !roleRef.current.isReviewLesson) {
        const fcInstructions = roleRef.current.functionCallingInstructions || DEFAULT_FUNCTION_CALLING_INSTRUCTIONS;
        systemPrompt += '\n\n# FUNCTION CALLING\n' + fcInstructions;
      }

      // Full prompt logging for debugging
      console.log('[Gemini] === FULL SYSTEM PROMPT ===');
      console.log(systemPrompt);
      console.log('[Gemini] === END PROMPT ===');
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

    // If this is a review lesson, mark it as in_progress
    if (roleRef.current?.isReviewLesson && roleRef.current?.reviewId && sessionIdRef.current) {
      await startReviewLesson(userIdRef.current, roleRef.current.reviewId, sessionIdRef.current);
    }

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
          // Clear the audio buffer to start fresh for user's next turn
          try {
            getWebAudioManager().clearTurnBuffer();
          } catch (e) {
            // Ignore - audio manager may not be ready
          }
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

      // Clear backup timeout on unmount
      if (sessionEndTimeoutRef.current) {
        clearTimeout(sessionEndTimeoutRef.current);
        sessionEndTimeoutRef.current = null;
      }

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

    // Session timed out (Gemini didn't respond)
    sessionTimedOut,

    // Audio playback for review lessons
    audioToPlay,
    onAudioPlaybackComplete,
    onAudioPlaybackError,

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
