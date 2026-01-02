/**
 * ChatPage - Main roleplay conversation interface
 *
 * Integrates with Gemini Live API for real-time voice conversations
 * with AI roleplay characters and tutor mode support.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { z } from 'zod';
import { AppColors } from '../theme/colors';
import { CoffeeIcon } from '../theme/icons';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { useUserId, useAuth } from '../hooks/useAuth';
import { getLanguageService } from '../services/languageService';
import { completeReviewLesson, setCurrentLesson, savePracticeTimeOnly } from '../services/firebase/sessionData';
import {
  canStartSession,
  recordSessionUsage,
  resetWeekIfNeeded,
  getUserDocument,
  type UsageStats,
} from '../services/firebase/subscriptionUsage';
import type { UserDocument } from '../types/firestore';
import { updateCustomLessonPracticed } from '../services/firebase/customLessons';
import type { AIRole, StudentLevel, ToneType, PersonaType } from '../types/ai-role';
import { LEVEL_CONFIGS } from '../types/ai-role';
import { ChatErrorBoundary } from '../components/ChatErrorBoundary';
// MED-006: logger utility available for future console.log replacements
// import { logger } from '../utils/logger';

// Modular chat components
import {
  ChatBubble,
  ScenarioHeader,
  ModeIndicator,
  ChatControlBar,
} from '../components/chat';

// Tasks panel component
import { TasksPanel, type TaskItem } from '../components/chat/TasksPanel';

// Session timer and summary components
import { SessionTimerCompact } from '../components/chat/SessionTimer';
import { StarAnimation } from '../components/chat/StarAnimation';

// Subscription usage components
import { UsageWarningBanner } from '../components/chat/UsageWarningBanner';
import { UsageBlockedModal } from '../components/chat/UsageBlockedModal';

// Badge components
import { BadgeEarnedModal } from '../components/badges';

// First session celebration (onboarding)
import { FirstSessionCelebration } from '../components/onboarding';

// Audio playback for review lessons
import { AudioWaveformPlayer } from '../components/AudioWaveformPlayer';

// Role icons mapping
const ROLE_ICONS: Record<string, React.ReactNode> = {
  barista: <CoffeeIcon />,
  hotel: <span style={{ fontSize: '32px' }}>🏨</span>,
  shop: <span style={{ fontSize: '32px' }}>🛍️</span>,
  tutor: <span style={{ fontSize: '32px' }}>👨‍🏫</span>,
  grammar: <span style={{ fontSize: '32px' }}>📚</span>,
  tourist: <span style={{ fontSize: '32px' }}>🗺️</span>,
};

// Role config from session storage
interface RoleConfig {
  id: string;
  name: string;
  icon: string;
  scenario: string;
  persona: 'actor' | 'tutor';
  tone: string;
  level: string;
  color: string;
  // New fields for enhanced sessions
  systemPrompt?: string;
  durationMinutes?: number;
  functionCallingEnabled?: boolean;
  functionCallingInstructions?: string;
  // Weekly review fields
  isReviewLesson?: boolean;
  reviewId?: string;
  // Custom lesson fields
  isCustomLesson?: boolean;
  customLessonId?: string;
  // Quick practice (pronunciation coach) - no stats tracking
  isQuickPractice?: boolean;
  // Cost tracking
  teacherId?: string;
  // Lesson tasks
  tasks?: Array<{ id: string; text: string }>;
  // Teacher settings for translation
  allowTranslation?: boolean;
}

// Zod schema for validating sessionStorage data (HIGH-005)
// Minimal validation - just ensure it's an object with required fields
// Use passthrough() to allow additional fields that may exist in the config
const RoleConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().optional().default(''),
  scenario: z.string().optional().default(''),
  persona: z.enum(['actor', 'tutor']).optional().default('actor'),
  tone: z.string().optional().default(''),
  level: z.string().optional().default(''),
  color: z.string().optional().default('#a855f7'),
  systemPrompt: z.string().optional(),
  durationMinutes: z.number().positive().optional(),
  functionCallingEnabled: z.boolean().optional(),
  functionCallingInstructions: z.string().optional(),
  isReviewLesson: z.boolean().optional(),
  reviewId: z.string().optional(),
  isCustomLesson: z.boolean().optional(),
  customLessonId: z.string().optional(),
  isQuickPractice: z.boolean().optional(),
  teacherId: z.string().optional(),
  tasks: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  allowTranslation: z.boolean().optional(),
}).passthrough(); // Allow additional fields from sessionStorage

// Message type for chat display
interface Message {
  id: number;
  text: string;
  isUser: boolean;
  isWhisper: boolean;
  translation?: string;
  audioData?: string; // base64 encoded audio for replay
}

/**
 * Convert RoleConfig to AIRole for Gemini integration
 */
function convertToAIRole(config: RoleConfig, targetVocab: string[]): AIRole {
  const level = (config.level || 'B1') as StudentLevel;
  // Use systemPrompt if provided, otherwise generate from scenario
  const systemPrompt = config.systemPrompt ||
    `You are ${config.name}. ${config.scenario ? `Scenario: ${config.scenario}` : ''}`;

  return {
    id: config.id,
    missionId: config.id, // Mission ID for session tracking
    teacherId: config.teacherId, // Teacher ID for cost tracking
    name: config.name,
    persona: config.persona as PersonaType,
    systemPrompt,
    tone: (config.tone?.toLowerCase() || 'friendly') as ToneType,
    level,
    levelConfig: LEVEL_CONFIGS[level],
    scenario: config.scenario,
    targetVocabulary: targetVocab,
    isCustom: false,
    icon: config.icon,
    color: config.color,
    // New fields for function calling
    functionCallingEnabled: config.functionCallingEnabled ?? true,
    functionCallingInstructions: config.functionCallingInstructions,
    durationMinutes: config.durationMinutes,
    // Review lesson fields
    isReviewLesson: config.isReviewLesson,
    reviewId: config.reviewId,
    // Lesson tasks
    tasks: config.tasks,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export default function ChatPage() {
  const navigate = useNavigate();
  useParams(); // roleId available from URL if needed
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = useUserId(); // Get authenticated user ID
  const { userDocument } = useAuth(); // Get user document for target language

  // State
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [aiRole, setAiRole] = useState<AIRole | null>(null);

  // Translation state - track which messages are being translated and their translations
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<number>>(new Set());

  // Tasks state
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksCollapsed, setTasksCollapsed] = useState(false);

  // Handle task completion from Gemini tool call
  const handleTaskComplete = useCallback((taskId: string) => {
    console.log('[ChatPage] Task completed:', taskId);
    setTasks(prev => {
      console.log('[ChatPage] Current tasks before update:', JSON.stringify(prev));
      const updated = prev.map(t => {
        // Handle both formats: "task-1" (from Gemini) or "1" or 1 (from config)
        const taskIdStr = String(t.id);
        const incomingId = taskId.replace('task-', ''); // "task-1" -> "1"
        const matches = taskIdStr === taskId || taskIdStr === incomingId || `task-${taskIdStr}` === taskId;
        return matches ? { ...t, completed: true } : t;
      });
      console.log('[ChatPage] Tasks after update:', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Initialize Gemini chat hook (direct connection with ephemeral tokens)
  const {
    isConnected,
    isConnecting,
    connectionError,
    isListening,
    isMuted,
    isPlaying,
    isPaused,
    messages: geminiMessages,
    sessionSummary,
    newBadges,
    sessionTimedOut,
    resumptionFailed,
    reconnect,
    triggerSessionEnd,
    clearSessionSummary,
    clearNewBadges,
    sendTextMessage,
    toggleMute,
    // Audio playback for review lessons
    audioToPlay,
    onAudioPlaybackComplete,
    onAudioPlaybackError,
  } = useGeminiChat(aiRole || undefined, userId || undefined, handleTaskComplete, userDocument?.preferredVoice, userDocument !== null);

  // Session timer state
  const [showSummary, setShowSummary] = useState(false);
  const [isSavingSummary, setIsSavingSummary] = useState(false); // MED-005: Loading state
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showFirstSessionCelebration, setShowFirstSessionCelebration] = useState(false);
  const [isFirstSession, setIsFirstSession] = useState(false);
  const [isReplayingAudio, setIsReplayingAudio] = useState(false);
  const sessionDuration = roleConfig?.durationMinutes || 15;

  // Subscription usage state
  const [, setUserDocument] = useState<UserDocument | null>(null);
  const [usageBlockedMessage, setUsageBlockedMessage] = useState<string | null>(null);
  const [showUsageWarning, setShowUsageWarning] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Track if we've already sent the initial "Hi" message
  const hasSentInitialHi = useRef(false);

  // Track if we've already auto-collapsed tasks (only do it once)
  const hasAutoCollapsedTasks = useRef(false);

  // Track if we muted the mic for audio playback (so we can unmute afterward)
  const mutedForAudioPlayback = useRef(false);

  // Track current audio playback for stop functionality
  const currentAudioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Session timing tracking for practice time
  const sessionStartTimeRef = useRef<number | null>(null);
  const hasSavedPracticeTimeRef = useRef(false);

  // CRIT-001: Cleanup AudioContext on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (currentAudioSourceRef.current) {
        try {
          currentAudioSourceRef.current.stop();
        } catch {
          // Already stopped
        }
        currentAudioSourceRef.current = null;
      }
      if (currentAudioContextRef.current) {
        currentAudioContextRef.current.close();
        currentAudioContextRef.current = null;
      }
    };
  }, []);

  // Convert gemini messages to local Message format
  // Filter out the initial "Hi" message (auto-sent to start conversation)
  const messages: Message[] = useMemo(() => {
    // Find and skip the first user message if it's the auto-sent "Hi"
    let skipFirstHi = true;
    return geminiMessages
      .filter(msg => {
        if (skipFirstHi && msg.isUser && msg.text.toLowerCase() === 'hi') {
          skipFirstHi = false; // Only skip the first one
          return false;
        }
        return true;
      })
      .map(msg => ({
        id: msg.id,
        text: msg.text,
        isUser: msg.isUser,
        isWhisper: msg.isWhisper,
        translation: msg.translation,
        audioData: msg.audioData // Include audio data for replay
      }));
  }, [geminiMessages]);

  // Load role config from session storage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('currentRole');
      if (!stored) {
        navigate('/');
        return;
      }

      // Parse sessionStorage data
      const parsed = JSON.parse(stored);

      // HIGH-005: Soft validation - log warnings but always continue
      const result = RoleConfigSchema.safeParse(parsed);
      if (!result.success) {
        console.warn('[ChatPage] Role config validation notes:', result.error.issues);
      }

      // Use parsed data directly (validation is informational only)
      const config = parsed as RoleConfig;
      setRoleConfig(config);

      // Convert to AIRole for Gemini
      const role = convertToAIRole(config, []);
      setAiRole(role);

      // Initialize tasks if present
      console.log('[ChatPage] Config tasks from sessionStorage:', config.tasks);
      if (config.tasks?.length) {
        const initialTasks = config.tasks.map(t => ({ ...t, completed: false }));
        console.log('[ChatPage] ✅ Initializing tasks:', JSON.stringify(initialTasks));
        setTasks(initialTasks);
      } else {
        console.log('[ChatPage] ⚠️ No tasks in config');
      }

      // Check if this is the user's first session (from sessionStorage flag)
      const firstSessionFlag = sessionStorage.getItem('isFirstSession');
      if (firstSessionFlag === 'true') {
        setIsFirstSession(true);
        sessionStorage.removeItem('isFirstSession'); // Clear the flag
      }
    } catch (error) {
      console.error('[ChatPage] Error parsing role config:', error);
      sessionStorage.removeItem('currentRole');
      navigate('/');
    }
  }, [navigate]);

  // Fetch user document and check subscription status on mount
  useEffect(() => {
    async function checkSubscriptionStatus() {
      if (!userId) return;

      try {
        // Fetch user document
        const userDoc = await getUserDocument(userId);
        setUserDocument(userDoc);

        // Reset week usage if needed (new week started)
        await resetWeekIfNeeded(userId, userDoc);

        // Check if user can start a session
        const { canStart, reason, usageStats: stats } = canStartSession(userDoc);
        setUsageStats(stats);

        if (!canStart && reason) {
          setUsageBlockedMessage(reason);
        } else if (stats.showWarning) {
          // Show warning if at 10% or less remaining
          setShowUsageWarning(true);
        }
      } catch (error) {
        console.error('[ChatPage] Error checking subscription status:', error);
      }
    }

    checkSubscriptionStatus();
  }, [userId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-collapse tasks after first AI message to maximize chat space (only once)
  useEffect(() => {
    if (tasks.length > 0 && !hasAutoCollapsedTasks.current) {
      const hasAIMessage = messages.some(m => !m.isUser);
      if (hasAIMessage) {
        hasAutoCollapsedTasks.current = true;
        setTasksCollapsed(true);
      }
    }
  }, [messages, tasks.length]);

  // Show summary modal when session summary is received
  useEffect(() => {
    if (sessionSummary) {
      setShowSummary(true);
    }
  }, [sessionSummary]);

  // Show first session celebration or badge modal when session completes
  useEffect(() => {
    // Show first session celebration after summary closes for first-time users
    if (!showSummary && sessionSummary && isFirstSession && !showFirstSessionCelebration && !showBadgeModal) {
      setShowFirstSessionCelebration(true);
    }
    // Show badge modal after summary closes (and after first session celebration if applicable)
    else if (newBadges.length > 0 && !showSummary && !showFirstSessionCelebration) {
      setShowBadgeModal(true);
    }
  }, [newBadges, showSummary, isFirstSession, sessionSummary, showFirstSessionCelebration, showBadgeModal]);

  // Handle session timeout - Gemini didn't respond to end prompt within 30s
  // Navigate home with a toast (no summary modal since we don't have summary data)
  useEffect(() => {
    if (sessionTimedOut) {
      toast.success('Session complete - Great practice!', {
        duration: 3000,
        position: 'top-center',
      });
      // Small delay to let the toast appear before navigation
      const timer = setTimeout(() => {
        navigate('/');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sessionTimedOut, navigate]);

  // Safety net: Save practice time on beforeunload (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Skip if already saved, quick practice, or session completed normally
      if (hasSavedPracticeTimeRef.current) return;
      if (roleConfig?.isQuickPractice) return;
      if (sessionSummary) return;
      if (!userId || !sessionStartTimeRef.current) return;

      const elapsedSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      if (elapsedSeconds < 5) return;

      // Mark as saved to prevent double-counting if user returns
      hasSavedPracticeTimeRef.current = true;

      // Use sendBeacon for reliable delivery on page close
      // Note: This is best-effort - Firestore SDK doesn't support sendBeacon directly
      // The main handleClose path is more reliable
      console.log('[ChatPage] beforeunload - attempting to save', elapsedSeconds, 'seconds');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [userId, roleConfig?.isQuickPractice, sessionSummary]);

  // Auto-send "Hi" when connection is established
  // This triggers the AI to start the conversation immediately
  // Also sets currentLesson for "Continue Learning" feature
  useEffect(() => {
    if (isConnected && !hasSentInitialHi.current && aiRole && roleConfig) {
      // Small delay to ensure connection is fully ready
      const timer = setTimeout(async () => {
        console.log('[ChatPage] Auto-sending initial Hi to start conversation');
        sendTextMessage('Hi');
        hasSentInitialHi.current = true;

        // Track session start time for practice time calculation
        sessionStartTimeRef.current = Date.now();
        console.log('[ChatPage] Session started at:', new Date().toISOString());

        // Track current lesson for "Continue Learning" (skip for quick practice)
        if (userId && !roleConfig.isQuickPractice) {
          try {
            // Extract image URL from the role config (different sources have different fields)
            const imageUrl = (roleConfig as any).imageUrl || undefined;
            await setCurrentLesson(userId, {
              missionId: roleConfig.id,
              title: roleConfig.name,
              imageUrl,
            });
            console.log('[ChatPage] Set current lesson:', roleConfig.name);
          } catch (error) {
            console.warn('[ChatPage] Could not set current lesson:', error);
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isConnected, aiRole, roleConfig, sendTextMessage, userId]);

  // Handle timer end - trigger session end
  const handleTimerEnd = useCallback(() => {
    console.log('[ChatPage] Timer ended, triggering session summary');
    triggerSessionEnd();
  }, [triggerSessionEnd]);

  // Handle badge modal close
  const handleBadgeModalClose = useCallback(() => {
    setShowBadgeModal(false);
    clearNewBadges();
  }, [clearNewBadges]);

  // Handle first session celebration close
  const handleFirstSessionCelebrationClose = useCallback(() => {
    setShowFirstSessionCelebration(false);
    // After closing first session celebration, check for badges
    if (newBadges.length > 0) {
      setShowBadgeModal(true);
    } else {
      // Navigate home if no badges to show
      navigate('/');
    }
  }, [newBadges, navigate]);

  // Handle audio playback mute (called before playback starts)
  const handleAudioMuteRequired = useCallback(() => {
    if (!isMuted) {
      console.log('[ChatPage] Muting mic for audio playback');
      toggleMute();
      mutedForAudioPlayback.current = true;
    }
  }, [isMuted, toggleMute]);

  // Handle audio playback unmute (called after playback ends)
  const handleAudioUnmuteAllowed = useCallback(() => {
    if (mutedForAudioPlayback.current && isMuted) {
      console.log('[ChatPage] Unmuting mic after audio playback');
      toggleMute();
      mutedForAudioPlayback.current = false;
    }
  }, [isMuted, toggleMute]);

  // Stop current audio replay and unmute
  const stopReplay = useCallback(() => {
    console.log('[ChatPage] Stopping audio replay');

    // Stop AudioBufferSourceNode if playing
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch {
        // Already stopped
      }
      currentAudioSourceRef.current = null;
    }

    // Close AudioContext
    if (currentAudioContextRef.current) {
      currentAudioContextRef.current.close();
      currentAudioContextRef.current = null;
    }

    setIsReplayingAudio(false);

    // Unmute mic if we muted it
    if (mutedForAudioPlayback.current) {
      toggleMute();
      mutedForAudioPlayback.current = false;
    }
  }, [toggleMute]);

  // Handle translate button click on chat bubble
  const handleTranslate = useCallback(async (msg: Message) => {
    // Skip if already translated or currently translating
    if (translations[msg.id] || translatingIds.has(msg.id)) {
      return;
    }

    // Get target language from user profile (default to Ukrainian)
    const targetLanguage = userDocument?.targetLanguage || 'uk-UA';

    // Mark as translating
    setTranslatingIds(prev => new Set(prev).add(msg.id));

    try {
      const languageService = getLanguageService();
      const result = await languageService.translate(msg.text, targetLanguage);

      // Store translation
      setTranslations(prev => ({
        ...prev,
        [msg.id]: result.translatedText,
      }));
    } catch (error) {
      console.error('[ChatPage] Translation error:', error);
      toast.error('Translation failed. Please try again.', {
        duration: 3000,
        position: 'top-center',
      });
    } finally {
      // Remove from translating set
      setTranslatingIds(prev => {
        const next = new Set(prev);
        next.delete(msg.id);
        return next;
      });
    }
  }, [translations, translatingIds, userDocument?.targetLanguage]);

  // Handle replay button click on chat bubble
  const handleReplay = useCallback(async (msg: Message) => {
    // If already replaying, stop the current playback
    if (isReplayingAudio) {
      console.log('[ChatPage] Stopping current replay');
      stopReplay();
      return;
    }

    if (!msg.audioData) {
      console.log('[ChatPage] No audio data for message:', msg.id);
      return;
    }

    console.log('[ChatPage] Replaying audio for message:', msg.id, 'isUser:', msg.isUser);

    // Mute mic during playback to avoid feedback
    if (!isMuted) {
      toggleMute();
      mutedForAudioPlayback.current = true;
    }

    setIsReplayingAudio(true);

    try {
      // Create AudioContext for playback
      const ctx = new AudioContext();
      currentAudioContextRef.current = ctx;

      if (msg.isUser) {
        // User audio is WAV format - parse manually for speed (skip slow decodeAudioData)
        console.log('[ChatPage] Playing user WAV audio');
        const binary = atob(msg.audioData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        // Parse WAV header to get sample rate and data offset
        // Standard WAV: 44-byte header, data starts at offset 44
        const view = new DataView(bytes.buffer);
        const sampleRate = view.getUint32(24, true); // Sample rate at byte 24
        const dataOffset = 44; // Standard WAV header size

        // Extract PCM data (16-bit signed integers)
        const pcmData = new Int16Array(bytes.buffer, dataOffset);

        // Convert to Float32 for Web Audio
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] < 0 ? pcmData[i] / 0x8000 : pcmData[i] / 0x7FFF;
        }

        // Create audio buffer at the WAV's sample rate (16kHz)
        const audioBuffer = ctx.createBuffer(1, floatData.length, sampleRate);
        audioBuffer.getChannelData(0).set(floatData);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        currentAudioSourceRef.current = source;

        await new Promise<void>((resolve) => {
          source.onended = () => {
            resolve();
          };
          source.start(0);
        });
      } else {
        // AI audio is PCM format - decode manually and play
        console.log('[ChatPage] Playing AI PCM audio');
        const binary = atob(msg.audioData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        // Convert PCM 16-bit to Float32 for Web Audio
        const pcmData = new Int16Array(bytes.buffer);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] < 0 ? pcmData[i] / 0x8000 : pcmData[i] / 0x7FFF;
        }

        // Create audio buffer at 24kHz (Gemini's output rate)
        const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
        audioBuffer.getChannelData(0).set(floatData);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        currentAudioSourceRef.current = source;

        await new Promise<void>((resolve) => {
          source.onended = () => {
            resolve();
          };
          source.start(0);
        });
      }

      console.log('[ChatPage] Audio replay completed');
    } catch (error) {
      console.error('[ChatPage] Replay error:', error);
    } finally {
      // Clean up refs
      currentAudioSourceRef.current = null;
      if (currentAudioContextRef.current) {
        currentAudioContextRef.current.close();
        currentAudioContextRef.current = null;
      }

      setIsReplayingAudio(false);

      // Unmute mic after playback if we muted it
      if (mutedForAudioPlayback.current) {
        toggleMute();
        mutedForAudioPlayback.current = false;
      }
    }
  }, [isMuted, toggleMute, isReplayingAudio, stopReplay]);

  // Handle continue after summary - navigate home (MED-005: with loading state)
  const handleSummaryContinue = useCallback(async () => {
    if (isSavingSummary) return; // Prevent double-click
    setIsSavingSummary(true);

    try {
      setShowSummary(false);
      clearSessionSummary();

      // If this is a review lesson, mark it as completed
      if (roleConfig?.isReviewLesson && roleConfig?.reviewId && userId && sessionSummary) {
        try {
          // Extract stars from summary (the AI gives a 1-5 rating)
          const stars = sessionSummary.stars || 3;
          // Generate a session ID for tracking
          const sessionId = `review-session-${Date.now()}`;
          await completeReviewLesson(userId, roleConfig.reviewId, sessionId, stars);
          console.log('[ChatPage] Review lesson completed:', roleConfig.reviewId);
        } catch (error) {
          console.error('[ChatPage] Error completing review lesson:', error);
        }
      }

      // If this is a custom lesson, update practice count
      if (roleConfig?.isCustomLesson && roleConfig?.customLessonId && userId) {
        try {
          await updateCustomLessonPracticed(userId, roleConfig.customLessonId);
          console.log('[ChatPage] Custom lesson practiced:', roleConfig.customLessonId);
        } catch (error) {
          console.error('[ChatPage] Error updating custom lesson practice:', error);
        }
      }

      // Note: isQuickPractice (pronunciation coach) doesn't save any stats

      // Save session data (best effort - don't block navigation)
      try {
        const sessionData = {
          roleConfig,
          messages,
          duration: sessionDuration * 60,
          endTime: new Date().toISOString(),
          summary: sessionSummary,
        };
        sessionStorage.setItem('lastSession', JSON.stringify(sessionData));
      } catch (e) {
        console.warn('[ChatPage] Could not save session to storage:', e);
      }

      // Navigate home - must happen regardless of session storage success
      navigate('/');
    } finally {
      setIsSavingSummary(false);
    }
  }, [isSavingSummary, clearSessionSummary, navigate, messages, roleConfig, sessionDuration, sessionSummary, userId]);

  // Derive connection state for LiveButton
  const getConnectionState = (): 'disconnected' | 'connecting' | 'listening' | 'ai_speaking' | 'muted' | 'paused' => {
    if (isPaused) return 'paused';
    if (!isConnected && !isConnecting) return 'disconnected';
    if (isConnecting) return 'connecting';
    if (isMuted) return 'muted';
    if (isPlaying) return 'ai_speaking';
    if (isListening) return 'listening';
    return 'disconnected';
  };

  const connectionState = getConnectionState();


  // Save partial practice time for incomplete sessions (X button or mic stop)
  const savePartialPracticeTime = useCallback(async () => {
    // Prevent double-saves
    if (hasSavedPracticeTimeRef.current) return;

    // Skip for quick practice (no stats tracking)
    if (roleConfig?.isQuickPractice) return;

    // Skip if session completed normally (time already saved via saveSessionSummary)
    if (sessionSummary) return;

    if (!userId || !sessionStartTimeRef.current) return;

    const elapsedSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);

    // Don't save trivial sessions (< 5 seconds)
    if (elapsedSeconds < 5) return;

    hasSavedPracticeTimeRef.current = true;

    try {
      await savePracticeTimeOnly(userId, elapsedSeconds);
      // Also record subscription usage (for weekly limits)
      await recordSessionUsage(userId, elapsedSeconds);
      console.log('[ChatPage] Saved partial practice time:', elapsedSeconds, 'seconds');
    } catch (error) {
      console.error('[ChatPage] Failed to save practice time:', error);
    }
  }, [userId, roleConfig?.isQuickPractice, sessionSummary]);

  const handleClose = useCallback(async () => {
    // Confirm if user has meaningful progress (> 2 messages)
    if (messages.length > 2 && !sessionSummary) {
      const confirmed = window.confirm('End this session? Your practice time will be saved.');
      if (!confirmed) return;
    }

    // Save partial time before navigating
    await savePartialPracticeTime();

    const elapsedSeconds = sessionStartTimeRef.current
      ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
      : 120;

    const sessionData = {
      roleConfig,
      messages,
      duration: elapsedSeconds,
      endTime: new Date().toISOString(),
    };
    sessionStorage.setItem('lastSession', JSON.stringify(sessionData));
    navigate('/');
  }, [savePartialPracticeTime, roleConfig, messages, navigate, sessionSummary]);

  // Loading state
  if (!roleConfig) {
    return (
      <div style={{
        minHeight: '100vh',
        background: AppColors.bgPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: AppColors.textPrimary,
      }}>
        Loading...
      </div>
    );
  }

  // HIGH-002: Wrap with error boundary for graceful error handling
  return (
    <ChatErrorBoundary>
      <div style={{
        height: '100vh',
        width: '100%',
        background: AppColors.bgPrimary,
        color: AppColors.textPrimary,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '100%',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(216, 180, 254, 0.3); border-radius: 4px; }
      `}</style>

      {/* Subscription Usage Warning Banner */}
      {showUsageWarning && usageStats && !usageBlockedMessage && (
        <UsageWarningBanner
          remainingSeconds={usageStats.remainingSeconds}
          planName={usageStats.plan.name}
          onDismiss={() => setShowUsageWarning(false)}
        />
      )}

      {/* Subscription Usage Blocked Modal */}
      {usageBlockedMessage && (
        <UsageBlockedModal
          message={usageBlockedMessage}
          onGoBack={() => navigate('/')}
        />
      )}

      {/* Session Resumption Failed Toast */}
      {resumptionFailed && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(251, 191, 36, 0.95)',
          color: '#1e1b4b',
          padding: '12px 20px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 500,
        }}>
          <span>⚠️</span>
          <span>Connection lost - conversation restarted</span>
        </div>
      )}

      {/* Header with scenario info and connection status - flexShrink: 0 to prevent scrolling off */}
      <div style={{ flexShrink: 0 }}>
      <ScenarioHeader
        scenario={roleConfig.name}
        tone={roleConfig.tone || 'friendly'}
        level={roleConfig.level}
        icon={ROLE_ICONS[roleConfig.id] || <CoffeeIcon />}
        isConnected={isConnected}
        isConnecting={isConnecting}
        connectionError={connectionError}
        onClose={handleClose}
        onReconnect={reconnect}
        timerElement={
          roleConfig.durationMinutes && roleConfig.durationMinutes > 0 ? (
            <SessionTimerCompact
              durationMinutes={roleConfig.durationMinutes}
              onTimeUp={handleTimerEnd}
              isPaused={isPaused}
              isVisible={isConnected && !showSummary}
            />
          ) : undefined
        }
      />
      </div>

      {/* Tasks panel - only show if tasks exist - flexShrink: 0 to prevent scrolling off */}
      {tasks.length > 0 && (
        <div style={{ padding: '0 16px', marginTop: '8px', flexShrink: 0 }}>
          <TasksPanel
            tasks={tasks}
            isCollapsed={tasksCollapsed}
            onToggleCollapse={() => setTasksCollapsed(prev => !prev)}
          />
        </div>
      )}


      {/* Mode indicator - flexShrink: 0 to prevent scrolling off */}
      <div style={{ flexShrink: 0 }}>
        <ModeIndicator
          isWhisperMode={false}
          isRecording={isListening && !isMuted}
          isPlaying={isPlaying}
        />
      </div>

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        paddingBottom: '240px', // Space for fixed control bar
        minHeight: '300px',
      }}>

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.text}
            isUser={msg.isUser}
            isWhisper={msg.isWhisper}
            translation={translations[msg.id] || msg.translation}
            audioData={msg.audioData}
            onTranslate={() => handleTranslate(msg)}
            onReplay={() => handleReplay(msg)}
            showTranslateButton={roleConfig?.allowTranslation !== false}
            isTranslating={translatingIds.has(msg.id)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Control Bar - single button */}
      <ChatControlBar
        connectionState={connectionState}
        isPlaying={isPlaying}
        onStop={handleClose}
      />

      {/* Session Summary Modal */}
      {sessionSummary && (
        <StarAnimation
          summary={sessionSummary}
          onContinue={handleSummaryContinue}
          isVisible={showSummary}
          isLoading={isSavingSummary}
        />
      )}

      {/* Badge Earned Modal - shows after summary closes */}
      {showBadgeModal && newBadges.length > 0 && (
        <BadgeEarnedModal
          badges={newBadges}
          onClose={handleBadgeModalClose}
        />
      )}

      {/* First Session Celebration - shows for first-time users */}
      {showFirstSessionCelebration && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: AppColors.bgPrimary,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FirstSessionCelebration
            starsEarned={sessionSummary?.stars || 3}
            onGoHome={handleFirstSessionCelebrationClose}
          />
        </div>
      )}

      {/* Audio Waveform Player - plays student's recorded audio during review lessons */}
      {audioToPlay && (
        <AudioWaveformPlayer
          audioUrl={audioToPlay.url}
          onPlayComplete={onAudioPlaybackComplete}
          onError={onAudioPlaybackError}
          onMuteRequired={handleAudioMuteRequired}
          onUnmuteAllowed={handleAudioUnmuteAllowed}
        />
      )}

        {/* Toast notifications for session timeout */}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(30, 20, 50, 0.95)',
              border: '1px solid rgba(216, 180, 254, 0.3)',
              color: '#F5E6FA',
            },
          }}
        />
      </div>
    </ChatErrorBoundary>
  );
}
