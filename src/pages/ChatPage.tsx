/**
 * ChatPage - Main roleplay conversation interface
 *
 * Integrates with Gemini Live API for real-time voice conversations
 * with AI roleplay characters and tutor mode support.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import { CoffeeIcon } from '../theme/icons';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { useUserId } from '../hooks/useAuth';
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

// Session timer and summary components
import { SessionTimerCompact } from '../components/chat/SessionTimer';
import { StarAnimation } from '../components/chat/StarAnimation';

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
    reconnect,
    triggerSessionEnd,
    clearSessionSummary
  } = useGeminiChat(aiRole || undefined, userId || undefined);

  // Session timer state
  const [showSummary, setShowSummary] = useState(false);
  const sessionDuration = roleConfig?.durationMinutes || 15;

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

  // Handle timer end - trigger session end
  const handleTimerEnd = useCallback(() => {
    console.log('[ChatPage] Timer ended, triggering session summary');
    triggerSessionEnd();
  }, [triggerSessionEnd]);

  // Handle continue after summary - navigate home
  const handleSummaryContinue = useCallback(() => {
    setShowSummary(false);
    clearSessionSummary();
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
  }, [clearSessionSummary, navigate, messages, roleConfig, sessionDuration, sessionSummary]);

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
    navigate('/debrief');
  };

  // Loading state
  if (!roleConfig) {
    return (
      <div style={{
        minHeight: '100vh',
        background: gradientBackground,
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
      background: gradientBackground,
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
      />

      {/* Session Timer - positioned in top-right corner */}
      {/* Always render timer to preserve state during reconnects - just hide/pause when disconnected */}
      {roleConfig.durationMinutes && roleConfig.durationMinutes > 0 && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '140px',
          zIndex: 100,
        }}>
          <SessionTimerCompact
            durationMinutes={roleConfig.durationMinutes}
            onTimeUp={handleTimerEnd}
            isPaused={isPaused}
            isVisible={isConnected && !showSummary}
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
    </div>
  );
}
