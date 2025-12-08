/**
 * TypeScript interfaces for Gemini Live API direct connection
 */

// Ephemeral Token types
export interface EphemeralToken {
  token: string;
  expiresAt: Date;
  newSessionExpiresAt: Date;
  model: string;
}

export interface TokenResponse {
  token: string;
  expiresAt: string;
  newSessionExpiresAt: string;
  model: string;
}

// Usage Metadata from Gemini
export interface UsageMetadata {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// Token Usage for Firebase tracking
export interface TokenUsage {
  sessionId: string;
  userId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costEstimate: number;
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  sessionHandle?: string;
}

// Session State
export interface SessionState {
  isConnected: boolean;
  isConnecting: boolean;
  isPaused: boolean;
  sessionHandle: string | null;
  canResume: boolean;
}

// Gemini Direct Client callbacks
export interface GeminiClientCallbacks {
  onAudio: (audioData: ArrayBuffer) => void;
  onText: (text: string) => void;
  onTurnComplete: () => void;
  onSessionUpdate: (handle: string) => void;
  onGoAway: (timeRemaining: number) => void;
  onError: (error: Error) => void;
  onUsageMetadata: (metadata: UsageMetadata) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  // Function calling callbacks
  onToolCall: (functionCalls: GeminiFunctionCall[]) => Promise<GeminiFunctionResponse[]>;
}

// Function calling types for Gemini Live API
export interface GeminiFunctionCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface GeminiFunctionResponse {
  id: string;
  name: string;
  response: {
    result: string;
    error?: string;
  };
}

// Client configuration
export interface GeminiClientConfig {
  userId: string;
  systemPrompt?: string;
  sessionHandle?: string;
  callbacks: Partial<GeminiClientCallbacks>;
  // Function calling options
  enableFunctionCalling?: boolean;
  functionCallingInstructions?: string;
}
