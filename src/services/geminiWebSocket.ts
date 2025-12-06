/**
 * WebSocket Connection to Cloud Run Proxy for Gemini API
 * Handles real-time audio streaming with Gemini
 */

export interface GeminiMessage {
  type: 'audio' | 'text' | 'control' | 'error';
  data?: string;
  text?: string;
  error?: string;
  timestamp?: number;
}

export interface GeminiWebSocketConfig {
  url: string;
  apiKey?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export type MessageHandler = (message: GeminiMessage) => void;
export type ErrorHandler = (error: Error) => void;
export type ConnectionHandler = () => void;

export class GeminiWebSocket {
  private ws: WebSocket | null = null;
  private config: Required<GeminiWebSocketConfig>;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private connectHandlers: Set<ConnectionHandler> = new Set();
  private disconnectHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempt = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;

  constructor(config: GeminiWebSocketConfig) {
    this.config = {
      url: config.url,
      apiKey: config.apiKey || '',
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 2000
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Add API key to URL if provided
        const url = this.config.apiKey
          ? `${this.config.url}?apiKey=${this.config.apiKey}`
          : this.config.url;

        this.ws = new WebSocket(url);
        this.isIntentionalClose = false;

        this.ws.onopen = () => {
          console.log('WebSocket connected to Gemini proxy');
          this.reconnectAttempt = 0;
          this.connectHandlers.forEach(handler => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: GeminiMessage = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(message));
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          const error = new Error('WebSocket connection error');
          this.errorHandlers.forEach(handler => handler(error));
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.disconnectHandlers.forEach(handler => handler());

          // Attempt reconnection if not intentional
          if (!this.isIntentionalClose && this.reconnectAttempt < this.config.reconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempt++;
    const delay = this.config.reconnectDelay * this.reconnectAttempt;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt}/${this.config.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Send audio chunk to Gemini
   * @param base64Audio - Base64-encoded PCM audio data
   */
  sendAudio(base64Audio: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message: GeminiMessage = {
      type: 'audio',
      data: base64Audio,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send text message to Gemini
   * @param text - Text message
   */
  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message: GeminiMessage = {
      type: 'text',
      text,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send control message to Gemini
   * @param control - Control command
   */
  sendControl(control: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message: GeminiMessage = {
      type: 'control',
      data: control,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Register message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Register connect handler
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.add(handler);
    return () => this.connectHandlers.delete(handler);
  }

  /**
   * Register disconnect handler
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => this.disconnectHandlers.delete(handler);
  }

  /**
   * Check connection status
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    this.isIntentionalClose = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    // Clear handlers
    this.messageHandlers.clear();
    this.errorHandlers.clear();
    this.connectHandlers.clear();
    this.disconnectHandlers.clear();
  }

  /**
   * Get connection state
   */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

/**
 * Create WebSocket connection to Cloud Run proxy
 * @param config - WebSocket configuration
 */
export function createGeminiWebSocket(config: GeminiWebSocketConfig): GeminiWebSocket {
  return new GeminiWebSocket(config);
}

/**
 * Get WebSocket URL from environment
 */
export function getWebSocketUrl(): string {
  // In production, this would be the Cloud Run WebSocket endpoint
  // For development, use local proxy or mock server
  const wsUrl = import.meta.env.VITE_GEMINI_WS_URL || 'ws://localhost:8080/gemini/ws';
  return wsUrl;
}

/**
 * Get Gemini API key from environment
 */
export function getGeminiApiKey(): string {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}
