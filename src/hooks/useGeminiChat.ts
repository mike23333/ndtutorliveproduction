/**
 * Hook for Gemini Live API Chat Integration
 *
 * Manages WebSocket connection to Gemini proxy and handles
 * real-time audio/text communication for roleplay scenarios.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createGeminiWebSocket,
  getWebSocketUrl,
  GeminiWebSocket,
  GeminiMessage
} from '../services/geminiWebSocket';
import { useAudioRecorder, useAudioPlayer } from './useAudioRecorder';
import { generateSystemPrompt } from '../services/promptGenerator';
import type { AIRole } from '../types/ai-role';

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

  // Recording state
  isRecording: boolean;
  isWhisperMode: boolean;

  // Playback state
  isPlaying: boolean;

  // Messages
  messages: ChatMessage[];

  // Actions
  startRecording: (whisperMode?: boolean) => Promise<void>;
  stopRecording: () => void;
  sendTextMessage: (text: string, isWhisper?: boolean) => void;
  clearMessages: () => void;
  reconnect: () => void;
  updateSystemPrompt: (role: AIRole) => void;
}

export function useGeminiChat(initialRole?: AIRole): UseGeminiChatResult {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isWhisperMode, setIsWhisperMode] = useState(false);

  // Audio hooks
  const {
    isRecording,
    audioChunks,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    clearChunks,
    error: recorderError
  } = useAudioRecorder();

  const { playAudio, isPlaying, error: playerError } = useAudioPlayer();

  // Refs
  const wsRef = useRef<GeminiWebSocket | null>(null);
  const roleRef = useRef<AIRole | undefined>(initialRole);
  const messageIdRef = useRef(0);

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
   * Initialize WebSocket connection
   */
  const connect = useCallback(() => {
    if (wsRef.current?.isConnected) {
      console.log('Already connected');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    // Build WebSocket URL with system instruction
    let wsUrl = getWebSocketUrl();
    if (roleRef.current) {
      const systemPrompt = generateSystemPrompt(roleRef.current);
      wsUrl += `?systemInstruction=${encodeURIComponent(systemPrompt)}`;
    }

    const ws = createGeminiWebSocket({
      url: wsUrl,
      reconnectAttempts: 3,
      reconnectDelay: 2000
    });

    // Handle connection events
    ws.onConnect(() => {
      console.log('Connected to Gemini');
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
    });

    ws.onDisconnect(() => {
      console.log('Disconnected from Gemini');
      setIsConnected(false);
    });

    ws.onError((error) => {
      console.error('WebSocket error:', error);
      setConnectionError(error.message);
      setIsConnecting(false);
    });

    // Handle incoming messages
    ws.onMessage((message: GeminiMessage) => {
      handleGeminiMessage(message);
    });

    // Connect
    ws.connect().catch((error) => {
      console.error('Failed to connect:', error);
      setConnectionError(error.message);
      setIsConnecting(false);
    });

    wsRef.current = ws;
  }, []);

  /**
   * Handle messages from Gemini
   */
  const handleGeminiMessage = useCallback((message: GeminiMessage) => {
    console.log('Received message from Gemini:', message.type, message.data?.substring?.(0, 50) || message.text?.substring?.(0, 50) || '');

    switch (message.type) {
      case 'text':
        // Add AI text response
        console.log('Received TEXT from Gemini:', message.text);
        if (message.text) {
          addMessage(message.text, false, isWhisperMode);
        }
        break;

      case 'audio':
        // Play audio response
        console.log('Received AUDIO from Gemini, size:', message.data?.length);
        if (message.data) {
          playAudio(message.data).catch((err) => {
            console.error('Failed to play audio:', err);
          });
        }
        break;

      case 'control':
        console.log('Received CONTROL from Gemini:', message.data);
        handleControlMessage(message.data || '');
        break;

      case 'error':
        console.error('Gemini error:', message.error);
        setConnectionError(message.error || 'Unknown error');
        break;
    }
  }, [addMessage, isWhisperMode, playAudio]);

  /**
   * Handle control messages
   */
  const handleControlMessage = useCallback((control: string) => {
    switch (control) {
      case 'connected':
        console.log('Gemini session ready');
        break;

      case 'turn_complete':
        console.log('AI turn complete');
        // Reset whisper mode after response
        setIsWhisperMode(false);
        break;

      case 'disconnected':
        setIsConnected(false);
        break;
    }
  }, []);

  /**
   * Send audio chunk directly to Gemini (called from audio manager callback)
   */
  const sendAudioChunk = useCallback((base64Audio: string) => {
    if (wsRef.current?.isConnected) {
      console.log('Sending audio chunk to Gemini, size:', base64Audio.length);
      wsRef.current.sendAudio(base64Audio);
    } else {
      console.warn('Cannot send audio: WebSocket not connected');
    }
  }, []);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async (whisperMode: boolean = false) => {
    if (!isConnected) {
      console.warn('Not connected to Gemini');
      return;
    }

    setIsWhisperMode(whisperMode);
    clearChunks();

    try {
      // Start recording with direct audio callback
      const audioManager = (await import('../services/webAudioBridge')).getWebAudioManager();
      await audioManager.initialize();
      await audioManager.startRecording((base64Data: string) => {
        // Send audio directly to Gemini as it arrives
        sendAudioChunk(base64Data);
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [isConnected, clearChunks, sendAudioChunk]);

  /**
   * Stop recording and finalize turn
   */
  const stopRecording = useCallback(async () => {
    // Stop the audio manager
    const audioManager = (await import('../services/webAudioBridge')).getWebAudioManager();
    audioManager.stopRecording();

    // Also call the hook's stop (for state tracking)
    stopAudioRecording();

    // Add placeholder message for user turn
    addMessage(
      isWhisperMode ? '[Speaking in Ukrainian...]' : '[Speaking...]',
      true,
      isWhisperMode
    );

    // Signal end of speech to Gemini
    if (wsRef.current?.isConnected) {
      wsRef.current.sendControl('end_of_speech');
    }
  }, [stopAudioRecording, isWhisperMode, addMessage]);

  /**
   * Send text message
   */
  const sendTextMessage = useCallback((text: string, isWhisper: boolean = false) => {
    if (!isConnected || !wsRef.current) {
      console.warn('Not connected to Gemini');
      return;
    }

    // Add user message
    addMessage(text, true, isWhisper);
    setIsWhisperMode(isWhisper);

    // Send to Gemini
    wsRef.current.sendText(text);
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
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    connect();
  }, [connect]);

  /**
   * Update system prompt with new role
   */
  const updateSystemPrompt = useCallback((role: AIRole) => {
    roleRef.current = role;

    // Send config update to proxy
    if (wsRef.current?.isConnected) {
      const systemPrompt = generateSystemPrompt(role);
      wsRef.current.sendText(JSON.stringify({
        type: 'config',
        systemInstruction: systemPrompt
      }));
    }

    // Reconnect to apply new system prompt
    reconnect();
  }, [reconnect]);

  /**
   * Connect on mount
   */
  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [connect]);

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
    connectionError: connectionError || recorderError || playerError,

    // Recording state
    isRecording,
    isWhisperMode,

    // Playback state
    isPlaying,

    // Messages
    messages,

    // Actions
    startRecording,
    stopRecording,
    sendTextMessage,
    clearMessages,
    reconnect,
    updateSystemPrompt
  };
}
