import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Expose AudioHandler globally for TypeScript bridge
declare global {
  interface Window {
    AudioHandler: new () => AudioHandlerInstance;
  }
}

interface AudioHandlerInstance {
  initAudioContext(): Promise<AudioContext>;
  startRecording(onDataCallback: (base64Data: string) => void): Promise<boolean>;
  stopRecording(): void;
  playChunk(base64Data: string): Promise<void>;
  destroy(): void;
  // Audio capture for error review
  extractAudioAsWav(): Blob | null;
  clearTurnBuffer(): void;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
