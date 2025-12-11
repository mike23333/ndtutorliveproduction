/**
 * ChatPage - Main roleplay conversation interface
 *
 * Integrates with Gemini Live API for real-time voice conversations
 * with AI roleplay characters and tutor mode support.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { AppColors } from '../theme/colors';
import { CoffeeIcon } from '../theme/icons';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { useUserId } from '../hooks/useAuth';
import { completeReviewLesson, setCurrentLesson } from '../services/firebase/sessionData';
import { updateCustomLessonPracticed } from '../services/firebase/customLessons';
import type { AIRole, StudentLevel, ToneType, PersonaType } from '../types/ai-role';
import { LEVEL_CONFIGS } from '../types/ai-role';

// Modular chat components
import {
  ChatBubble,
  ScenarioHeader,
  VocabTracker,
  ModeIndicator,
  ChatControlBar,
  type VocabWord
} from '../components/chat';

// Tasks panel component
import { TasksPanel, type TaskItem } from '../components/chat/TasksPanel';

// Session timer and summary components
import { SessionTimerCompact } from '../components/chat/SessionTimer';
import { StarAnimation } from '../components/chat/StarAnimation';

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
}

// Message type for chat display
interface Message {
  id: number;
  text: string;
  isUser: boolean;
  isWhisper: boolean;
  translation?: string;
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

/**
 * Get default vocabulary for a scenario
 */
function getDefaultVocab(roleId: string): VocabWord[] {
  const vocabMap: Record<string, string[]> = {
    barista: ['medium', 'latte', 'receipt'],
    hotel: ['reservation', 'check-in', 'room'],
    shop: ['price', 'discount', 'cash'],
    tourist: ['station', 'directions', 'left'],
    tutor: ['grammar', 'pronunciation', 'practice'],
    grammar: ['tense', 'verb', 'correct'],
  };

  const words = vocabMap[roleId] || ['hello', 'please', 'thank you'];
  return words.map(word => ({ word, used: false }));
}

export default function ChatPage() {
  const navigate = useNavigate();
  useParams(); // roleId available from URL if needed
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = useUserId(); // Get authenticated user ID

  // State
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [aiRole, setAiRole] = useState<AIRole | null>(null);
  const [progress, setProgress] = useState(15);
  const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);

  // Tasks state
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksCollapsed, setTasksCollapsed] = useState(false);

  // Handle task completion from Gemini tool call
  const handleTaskComplete = useCallback((taskId: string) => {
    console.log('[ChatPage] Task completed:', taskId);
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: true } : t
    ));
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
  } = useGeminiChat(aiRole || undefined, userId || undefined, handleTaskComplete);

  // Session timer state
  const [showSummary, setShowSummary] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showFirstSessionCelebration, setShowFirstSessionCelebration] = useState(false);
  const [isFirstSession, setIsFirstSession] = useState(false);
  const sessionDuration = roleConfig?.durationMinutes || 15;

  // Track if we've already sent the initial "Hi" message
  const hasSentInitialHi = useRef(false);

  // Track if we muted the mic for audio playback (so we can unmute afterward)
  const mutedForAudioPlayback = useRef(false);

  // Convert gemini messages to local Message format
  const messages: Message[] = useMemo(() => {
    return geminiMessages.map(msg => ({
      id: msg.id,
      text: msg.text,
      isUser: msg.isUser,
      isWhisper: msg.isWhisper,
      translation: msg.translation
    }));
  }, [geminiMessages]);

  // Load role config from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('currentRole');
    if (stored) {
      const config: RoleConfig = JSON.parse(stored);
      setRoleConfig(config);

      // Set default vocab based on scenario
      const defaultVocab = getDefaultVocab(config.id);
      setVocabWords(defaultVocab);

      // Convert to AIRole for Gemini
      const role = convertToAIRole(config, defaultVocab.map(v => v.word));
      setAiRole(role);

      // Initialize tasks if present
      console.log('[ChatPage] Config tasks:', config.tasks);
      if (config.tasks?.length) {
        console.log('[ChatPage] Initializing tasks:', config.tasks);
        setTasks(config.tasks.map(t => ({ ...t, completed: false })));
      }

      // Check if this is the user's first session (from sessionStorage flag)
      const firstSessionFlag = sessionStorage.getItem('isFirstSession');
      if (firstSessionFlag === 'true') {
        setIsFirstSession(true);
        sessionStorage.removeItem('isFirstSession'); // Clear the flag
      }
    } else {
      navigate('/roles');
    }
  }, [navigate]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track vocab usage in messages
  useEffect(() => {
    const allText = messages.map(m => m.text.toLowerCase()).join(' ');
    setVocabWords(prev => prev.map(v => ({
      ...v,
      used: allText.includes(v.word.toLowerCase())
    })));
  }, [messages]);

  // Update progress based on vocab usage
  useEffect(() => {
    const usedCount = vocabWords.filter(v => v.used).length;
    setProgress(Math.min(15 + usedCount * 25, 100));
  }, [vocabWords]);

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

  // Handle continue after summary - navigate home
  const handleSummaryContinue = useCallback(async () => {
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

    // Save session data before navigating
    const sessionData = {
      roleConfig,
      messages,
      duration: sessionDuration * 60,
      endTime: new Date().toISOString(),
      summary: sessionSummary,
    };
    sessionStorage.setItem('lastSession', JSON.stringify(sessionData));
    navigate('/');
  }, [clearSessionSummary, navigate, messages, roleConfig, sessionDuration, sessionSummary, userId]);

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

  // Event handlers
  const handleSettings = () => {
    console.log('Settings clicked');
  };

  const handleClose = () => {
    const sessionData = {
      roleConfig,
      messages,
      duration: 120,
      endTime: new Date().toISOString(),
    };
    sessionStorage.setItem('lastSession', JSON.stringify(sessionData));
    navigate('/');
  };

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

  return (
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

      {/* Header with scenario info and connection status */}
      <ScenarioHeader
        scenario={roleConfig.name}
        tone={roleConfig.tone || 'friendly'}
        level={roleConfig.level}
        progress={progress}
        icon={ROLE_ICONS[roleConfig.id] || <CoffeeIcon />}
        isConnected={isConnected}
        isConnecting={isConnecting}
        connectionError={connectionError}
        onSettings={handleSettings}
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

      {/* Tasks panel - only show if tasks exist */}
      {tasks.length > 0 && (
        <div style={{ padding: '0 16px', marginTop: '8px' }}>
          <TasksPanel
            tasks={tasks}
            isCollapsed={tasksCollapsed}
            onToggleCollapse={() => setTasksCollapsed(prev => !prev)}
          />
        </div>
      )}

      {/* Vocab tracker */}
      <VocabTracker words={vocabWords} />

      {/* Mode indicator */}
      <ModeIndicator
        isWhisperMode={false}
        isRecording={isListening && !isMuted}
        isPlaying={isPlaying}
      />

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        minHeight: '300px',
      }}>
        {messages.length === 0 && isConnected && (
          <div style={{
            textAlign: 'center',
            color: AppColors.textSecondary,
            padding: '40px 20px',
          }}>
            <p>Start speaking - I'm listening!</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              Tap the button to mute/unmute your microphone
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.text}
            isUser={msg.isUser}
            isWhisper={msg.isWhisper}
            translation={msg.translation}
            onTranslate={() => console.log('translate', msg.id)}
            onReplay={() => console.log('replay', msg.id)}
            onSlowPlay={() => console.log('slow', msg.id)}
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
  );
}
