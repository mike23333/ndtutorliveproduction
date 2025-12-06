/**
 * Type definitions for Web Audio integration
 */

declare global {
  interface Window {
    AudioHandler: new () => AudioHandlerInstance;
    webkitAudioContext: typeof AudioContext;
  }
}

interface AudioHandlerInstance {
  audioContext: AudioContext | null;
  microphoneStream: MediaStream | null;
  scriptProcessor: ScriptProcessorNode | null;
  mediaStreamSource: MediaStreamAudioSourceNode | null;
  playbackQueue: AudioBuffer[];
  isPlaying: boolean;
  onDataCallback: ((base64Data: string) => void) | null;
  TARGET_SAMPLE_RATE: number;
  PLAYBACK_SAMPLE_RATE: number;
  BUFFER_SIZE: number;

  initAudioContext(): Promise<AudioContext>;
  startRecording(onDataCallback: (base64Data: string) => void): Promise<boolean>;
  stopRecording(): void;
  playChunk(base64Data: string): Promise<void>;
  schedulePlayback(audioBuffer: AudioBuffer): void;
  downsample(buffer: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array;
  floatTo16BitPCM(floatArray: Float32Array): Int16Array;
  int16ToFloat32(int16Array: Int16Array): Float32Array;
  arrayBufferToBase64(buffer: ArrayBuffer): string;
  base64ToArrayBuffer(base64: string): ArrayBuffer;
  destroy(): void;
}

export {};
