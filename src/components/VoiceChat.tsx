/**
 * Voice Chat Component
 * Demonstrates Web Audio integration with Gemini API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAudioRecorder, useAudioPlayer } from '../hooks/useAudioRecorder';
import { createGeminiWebSocket, getWebSocketUrl, GeminiWebSocket, GeminiMessage } from '../services/geminiWebSocket';

interface VoiceChatProps {
  apiKey?: string;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  apiKey,
  onResponse
}) => {
  const { isRecording, audioChunks, startRecording, stopRecording, clearChunks, error: recorderError } = useAudioRecorder();
  const { playAudio, isPlaying, error: playerError } = useAudioPlayer();

  const [ws, setWs] = useState<GeminiWebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [wsError, setWsError] = useState<string | null>(null);

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    const websocket = createGeminiWebSocket({
      url: getWebSocketUrl(),
      apiKey: apiKey || import.meta.env.VITE_GEMINI_API_KEY || '',
      reconnectAttempts: 5,
      reconnectDelay: 2000
    });

    // Handle incoming messages
    const unsubscribeMessage = websocket.onMessage((message: GeminiMessage) => {
      console.log('Received message:', message.type);

      switch (message.type) {
        case 'audio':
          // Play audio response
          if (message.data) {
            playAudio(message.data).catch(err => {
              console.error('Failed to play audio:', err);
            });
          }
          break;

        case 'text':
          // Handle text response
          if (message.text) {
            setMessages(prev => [...prev, `AI: ${message.text}`]);
            onResponse?.(message.text);
          }
          break;

        case 'error':
          // Handle error
          console.error('Gemini error:', message.error);
          setWsError(message.error || 'Unknown error');
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    });

    // Handle connection events
    const unsubscribeConnect = websocket.onConnect(() => {
      console.log('Connected to Gemini');
      setWsConnected(true);
      setWsError(null);
    });

    const unsubscribeDisconnect = websocket.onDisconnect(() => {
      console.log('Disconnected from Gemini');
      setWsConnected(false);
    });

    const unsubscribeError = websocket.onError((error) => {
      console.error('WebSocket error:', error);
      setWsError(error.message);
    });

    // Connect
    websocket.connect().catch(err => {
      console.error('Failed to connect:', err);
      setWsError(err.message);
    });

    setWs(websocket);

    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
      websocket.disconnect();
    };
  }, [apiKey, playAudio, onResponse]);

  /**
   * Stream audio chunks to server as they arrive
   */
  useEffect(() => {
    if (audioChunks.length > 0 && ws?.isConnected) {
      const latestChunk = audioChunks[audioChunks.length - 1];
      ws.sendAudio(latestChunk);
    }
  }, [audioChunks, ws]);

  /**
   * Handle start recording
   */
  const handleStartRecording = useCallback(async () => {
    try {
      if (!wsConnected) {
        alert('Not connected to server. Please wait...');
        return;
      }

      clearChunks();
      setMessages(prev => [...prev, 'You: [Speaking...]']);

      // Start recording - audio chunks will be streamed via useEffect
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [wsConnected, startRecording, clearChunks]);

  /**
   * Handle stop recording
   */
  const handleStopRecording = useCallback(() => {
    stopRecording();

    // Send control message to indicate end of speech
    if (ws?.isConnected) {
      ws.sendControl('end_of_speech');
    }
  }, [stopRecording, ws]);

  /**
   * Get error message
   */
  const errorMessage = recorderError || playerError || wsError;

  /**
   * Get status color
   */
  const getStatusColor = () => {
    if (errorMessage) return 'bg-red-500';
    if (isRecording) return 'bg-red-600 animate-pulse';
    if (wsConnected) return 'bg-green-500';
    return 'bg-gray-500';
  };

  return (
    <div className="voice-chat p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Voice Chat</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <span className="text-sm text-gray-600">
            {errorMessage
              ? `Error: ${errorMessage}`
              : isRecording
                ? 'Recording...'
                : wsConnected
                  ? 'Connected'
                  : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleStartRecording}
          disabled={isRecording || !wsConnected}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {isRecording ? 'Recording...' : 'Start Voice Chat'}
        </button>

        <button
          onClick={handleStopRecording}
          disabled={!isRecording}
          className="px-6 py-3 bg-red-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
        >
          Stop
        </button>
      </div>

      {/* Status */}
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Recording:</span> {isRecording ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="font-semibold">Playing:</span> {isPlaying ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="font-semibold">Audio Chunks:</span> {audioChunks.length}
          </div>
          <div>
            <span className="font-semibold">WebSocket:</span> {wsConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-500 italic">No messages yet. Start voice chat to begin.</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  msg.startsWith('You:')
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {errorMessage && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Start Voice Chat" to begin (grants microphone permission)</li>
          <li>Speak your question or message</li>
          <li>Click "Stop" when finished speaking</li>
          <li>AI will process and respond with voice</li>
        </ol>
      </div>
    </div>
  );
};

export default VoiceChat;
