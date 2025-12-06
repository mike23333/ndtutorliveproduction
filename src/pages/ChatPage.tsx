/**
 * ChatPage - Main roleplay conversation interface
 *
 * Integrates with Gemini Live API for real-time voice conversations
 * with AI roleplay characters and tutor mode support.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import { CoffeeIcon } from '../theme/icons';
import { useGeminiChat } from '../hooks/useGeminiChat';
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
  return {
    id: config.id,
    name: config.name,
    persona: config.persona as PersonaType,
    systemPrompt: `You are ${config.name}. ${config.scenario ? `Scenario: ${config.scenario}` : ''}`,
    tone: (config.tone?.toLowerCase() || 'friendly') as ToneType,
    level,
    levelConfig: LEVEL_CONFIGS[level],
    scenario: config.scenario,
    targetVocabulary: targetVocab,
    isCustom: false,
    icon: config.icon,
    color: config.color,
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

  // State
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [aiRole, setAiRole] = useState<AIRole | null>(null);
  const [progress, setProgress] = useState(15);
  const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);

  // Initialize Gemini chat hook
  const {
    isConnected,
    isConnecting,
    connectionError,
    isRecording,
    isWhisperMode,
    isPlaying,
    messages: geminiMessages,
    startRecording,
    stopRecording,
    sendTextMessage,
    reconnect
  } = useGeminiChat(aiRole || undefined);

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

  // Event handlers
  const handleWhisperStart = async () => {
    if (!isConnected) return;
    await startRecording(true);
  };

  const handleWhisperEnd = () => {
    stopRecording();
  };

  const handleMicPress = async () => {
    if (!isConnected) {
      reconnect();
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      await startRecording(false);
    }
  };

  const handleHint = () => {
    if (isConnected) {
      sendTextMessage("Please give me a hint about what I could say next.", false);
    }
  };

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
        scenario={roleConfig.scenario}
        tone={roleConfig.name}
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

      {/* Vocab tracker */}
      <VocabTracker words={vocabWords} />

      {/* Mode indicator */}
      <ModeIndicator
        isWhisperMode={isWhisperMode}
        isRecording={isRecording}
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
            <p>Press the microphone to start speaking!</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              Hold the 🇺🇦 button to ask questions in Ukrainian
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

      {/* Recording indicator */}
      {(isRecording || isPlaying) && (
        <div style={{
          padding: '12px 16px',
          textAlign: 'center',
          color: isWhisperMode ? AppColors.whisperAmber : AppColors.accentPurple,
          fontSize: '14px',
          fontWeight: '500',
        }}>
          <span style={{ animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }}>
            {isPlaying ? '🔊 AI is responding...' : isWhisperMode ? '🇺🇦 Listening in Ukrainian...' : '🎤 Listening...'}
          </span>
        </div>
      )}

      {/* Bottom Control Bar */}
      <ChatControlBar
        isRecording={isRecording}
        isWhisperMode={isWhisperMode}
        isConnected={isConnected}
        onMicPress={handleMicPress}
        onWhisperStart={handleWhisperStart}
        onWhisperEnd={handleWhisperEnd}
        onHint={handleHint}
      />
    </div>
  );
}
