/**
 * Gemini Live API WebSocket Proxy Server
 *
 * Proxies WebSocket connections between the frontend and Gemini 2.5 Flash Live API.
 * Handles bidirectional audio streaming for real-time voice conversations.
 *
 * Based on: https://ai.google.dev/gemini-api/docs/live
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-live-001';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

// Gemini Live API WebSocket endpoint (v1alpha for Live API)
const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// CORS configuration
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: GEMINI_MODEL });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  path: '/gemini/ws'
});

interface ClientSession {
  clientWs: WebSocket;
  geminiWs: WebSocket | null;
  systemInstruction: string;
  isSetupComplete: boolean;
}

const sessions = new Map<WebSocket, ClientSession>();

/**
 * Handle new client connections
 */
wss.on('connection', (clientWs: WebSocket, req) => {
  console.log('Client connected from:', req.headers.origin);

  // Parse system instruction from query params if provided
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const systemInstruction = url.searchParams.get('systemInstruction') || getDefaultSystemInstruction();

  const session: ClientSession = {
    clientWs,
    geminiWs: null,
    systemInstruction,
    isSetupComplete: false
  };

  sessions.set(clientWs, session);

  // Connect to Gemini
  connectToGemini(session);

  // Handle messages from client
  clientWs.on('message', (data) => {
    handleClientMessage(session, data);
  });

  // Handle client disconnect
  clientWs.on('close', () => {
    console.log('Client disconnected');
    cleanupSession(session);
    sessions.delete(clientWs);
  });

  clientWs.on('error', (error) => {
    console.error('Client WebSocket error:', error);
    cleanupSession(session);
  });
});

/**
 * Connect to Gemini Live API
 */
function connectToGemini(session: ClientSession): void {
  console.log('Connecting to Gemini Live API...');

  const geminiWs = new WebSocket(GEMINI_WS_URL);
  session.geminiWs = geminiWs;

  geminiWs.on('open', () => {
    console.log('Connected to Gemini');
    sendSetupMessage(session);
  });

  geminiWs.on('message', (data) => {
    handleGeminiMessage(session, data);
  });

  geminiWs.on('close', (code, reason) => {
    console.log('Gemini connection closed:', code, reason.toString());
    session.isSetupComplete = false;

    // Notify client
    if (session.clientWs.readyState === WebSocket.OPEN) {
      session.clientWs.send(JSON.stringify({
        type: 'control',
        data: 'disconnected'
      }));
    }
  });

  geminiWs.on('error', (error) => {
    console.error('Gemini WebSocket error:', error);

    // Notify client of error
    if (session.clientWs.readyState === WebSocket.OPEN) {
      session.clientWs.send(JSON.stringify({
        type: 'error',
        error: 'Gemini connection error'
      }));
    }
  });
}

/**
 * Send setup message to Gemini
 */
function sendSetupMessage(session: ClientSession): void {
  if (!session.geminiWs || session.geminiWs.readyState !== WebSocket.OPEN) {
    console.error('Cannot send setup: Gemini not connected');
    return;
  }

  const setupMessage = {
    setup: {
      model: `models/${GEMINI_MODEL}`,
      generationConfig: {
        responseModalities: 'audio',
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede'
            }
          }
        }
      },
      systemInstruction: {
        parts: [{ text: session.systemInstruction }]
      }
    }
  };

  console.log('Sending setup message to Gemini');
  session.geminiWs.send(JSON.stringify(setupMessage));
}

/**
 * Handle messages from client
 */
function handleClientMessage(session: ClientSession, data: WebSocket.RawData): void {
  try {
    const message = JSON.parse(data.toString());

    if (!session.geminiWs || session.geminiWs.readyState !== WebSocket.OPEN) {
      console.warn('Gemini not connected, cannot forward message');
      return;
    }

    switch (message.type) {
      case 'audio':
        // Forward audio to Gemini
        forwardAudioToGemini(session, message.data);
        break;

      case 'text':
        // Forward text to Gemini
        forwardTextToGemini(session, message.text);
        break;

      case 'control':
        handleControlMessage(session, message.data);
        break;

      case 'config':
        // Update system instruction
        if (message.systemInstruction) {
          session.systemInstruction = message.systemInstruction;
          // Reconnect with new config
          if (session.geminiWs) {
            session.geminiWs.close();
          }
          connectToGemini(session);
        }
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  } catch (error) {
    console.error('Error parsing client message:', error);
  }
}

/**
 * Forward audio chunk to Gemini
 */
function forwardAudioToGemini(session: ClientSession, base64Audio: string): void {
  if (!session.geminiWs || !session.isSetupComplete) {
    console.log('Cannot forward audio: geminiWs=' + !!session.geminiWs + ', isSetupComplete=' + session.isSetupComplete);
    return;
  }

  const realtimeInput = {
    realtimeInput: {
      mediaChunks: [{
        mimeType: 'audio/pcm;rate=16000',
        data: base64Audio
      }]
    }
  };

  console.log('Forwarding audio to Gemini, chunk size:', base64Audio.length);
  session.geminiWs.send(JSON.stringify(realtimeInput));
}

/**
 * Forward text message to Gemini
 */
function forwardTextToGemini(session: ClientSession, text: string): void {
  if (!session.geminiWs || !session.isSetupComplete) {
    return;
  }

  const clientContent = {
    clientContent: {
      turns: [{
        role: 'user',
        parts: [{ text }]
      }],
      turnComplete: true
    }
  };

  session.geminiWs.send(JSON.stringify(clientContent));
}

/**
 * Handle control messages
 */
function handleControlMessage(session: ClientSession, control: string): void {
  if (!session.geminiWs || session.geminiWs.readyState !== WebSocket.OPEN) {
    return;
  }

  switch (control) {
    case 'end_of_speech':
      // Signal end of user turn
      session.geminiWs.send(JSON.stringify({
        clientContent: {
          turnComplete: true
        }
      }));
      break;

    case 'interrupt':
      // Interrupt current generation (if supported)
      console.log('Interrupt requested');
      break;

    default:
      console.warn('Unknown control command:', control);
  }
}

/**
 * Handle messages from Gemini
 */
function handleGeminiMessage(session: ClientSession, data: WebSocket.RawData): void {
  try {
    const message = JSON.parse(data.toString());
    console.log('Received from Gemini:', JSON.stringify(message).substring(0, 200) + '...');

    // Check for setup completion
    if (message.setupComplete) {
      console.log('Gemini setup complete');
      session.isSetupComplete = true;

      // Notify client
      if (session.clientWs.readyState === WebSocket.OPEN) {
        session.clientWs.send(JSON.stringify({
          type: 'control',
          data: 'connected'
        }));
      }
      return;
    }

    // Handle server content
    if (message.serverContent) {
      console.log('Processing serverContent from Gemini');
      handleServerContent(session, message.serverContent);
    }

    // Handle tool calls
    if (message.toolCall) {
      handleToolCall(session, message.toolCall);
    }

  } catch (error) {
    console.error('Error parsing Gemini message:', error);
  }
}

/**
 * Handle server content from Gemini
 */
function handleServerContent(session: ClientSession, content: any): void {
  if (!session.clientWs || session.clientWs.readyState !== WebSocket.OPEN) {
    console.log('Cannot send to client: clientWs not open');
    return;
  }

  const modelTurn = content.modelTurn;
  if (!modelTurn?.parts) {
    console.log('No modelTurn.parts in content, turnComplete:', content.turnComplete);
    // Check for turn complete signal
    if (content.turnComplete) {
      session.clientWs.send(JSON.stringify({
        type: 'control',
        data: 'turn_complete'
      }));
    }
    return;
  }

  console.log('Processing', modelTurn.parts.length, 'parts from Gemini');

  for (const part of modelTurn.parts) {
    if (part.text) {
      console.log('Sending text to client:', part.text.substring(0, 50));
      // Send text response
      session.clientWs.send(JSON.stringify({
        type: 'text',
        text: part.text,
        timestamp: Date.now()
      }));
    }

    if (part.inlineData) {
      console.log('Sending audio to client, size:', part.inlineData.data?.length, 'mimeType:', part.inlineData.mimeType);
      // Send audio response
      session.clientWs.send(JSON.stringify({
        type: 'audio',
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
        timestamp: Date.now()
      }));
    }
  }

  // Check for turn complete
  if (content.turnComplete) {
    console.log('Sending turn_complete to client');
    session.clientWs.send(JSON.stringify({
      type: 'control',
      data: 'turn_complete'
    }));
  }
}

/**
 * Handle tool calls from Gemini
 */
function handleToolCall(session: ClientSession, toolCall: any): void {
  console.log('Tool call received:', toolCall);

  // Forward to client for handling
  if (session.clientWs.readyState === WebSocket.OPEN) {
    session.clientWs.send(JSON.stringify({
      type: 'tool_call',
      data: toolCall
    }));
  }
}

/**
 * Cleanup session resources
 */
function cleanupSession(session: ClientSession): void {
  if (session.geminiWs) {
    session.geminiWs.close();
    session.geminiWs = null;
  }
}

/**
 * Get default system instruction for roleplay
 */
function getDefaultSystemInstruction(): string {
  return `**SYSTEM CONFIGURATION**
Role: You are a roleplay actor and a hidden language tutor for Ukrainian students learning English.
Model Behavior: Gemini 2.5 Flash with native audio.

**OPERATIONAL RULES**

1. **Level Adaptation:**
   - Speak at a natural but clear pace
   - Use common vocabulary and straightforward sentences
   - Wait patiently for student responses

2. **The "Whisper" Protocol (Language Toggle):**
   - IF input language detects UKRAINIAN:
     - STOP Roleplay
     - Switch to "Tutor Mode" (Speak Ukrainian)
     - Explain the concept or translate the user's request
     - End with: "Try saying that in English."
   - IF input language detects ENGLISH:
     - RESUME Roleplay immediately

3. **Correction Logic:**
   - Ignore minor grammar errors that don't hurt meaning
   - GENTLY correct if user makes a significant error
   - Briefly explain in simple terms, then resume roleplay

4. **Roleplay Engagement:**
   - Stay in character
   - Keep responses concise (1-3 sentences)
   - Ask follow-up questions to keep conversation flowing
   - Be encouraging and supportive`;
}

// Start server
server.listen(PORT, () => {
  console.log(`Gemini WebSocket Proxy running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/gemini/ws`);
  console.log(`Model: ${GEMINI_MODEL}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
