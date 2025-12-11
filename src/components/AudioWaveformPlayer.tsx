/**
 * AudioWaveformPlayer Component
 *
 * Plays audio with an animated waveform visualization.
 * Used for the play_student_audio function in review lessons.
 *
 * Features:
 * - Mutes mic before playback
 * - Displays animated waveform bars
 * - Unmutes mic after playback
 * - Handles errors gracefully
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioWaveformPlayerProps {
  audioUrl: string;
  onPlayComplete: () => void;
  onError: (error: Error) => void;
  onMuteRequired?: () => void;
  onUnmuteAllowed?: () => void;
}

const NUM_BARS = 32;
const UPDATE_INTERVAL = 50; // ms
const PLAYBACK_DELAY_MS = 3000; // 3 second delay before playing audio

export function AudioWaveformPlayer({
  audioUrl,
  onPlayComplete,
  onError,
  onMuteRequired,
  onUnmuteAllowed,
}: AudioWaveformPlayerProps) {
  const [isWaiting, setIsWaiting] = useState(true); // Waiting for delay
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(Math.ceil(PLAYBACK_DELAY_MS / 1000));
  const [barHeights, setBarHeights] = useState<number[]>(new Array(NUM_BARS).fill(20));

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      } catch (e) {
        // Ignore errors when stopping already stopped source
      }
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Load and play audio
  useEffect(() => {
    let isMounted = true;
    let countdownInterval: NodeJS.Timeout | null = null;

    const loadAndPlayAudio = async () => {
      try {
        // Signal that mic should be muted
        onMuteRequired?.();

        // Wait for delay before playing (let Gemini finish speaking)
        console.log(`[AudioWaveformPlayer] Waiting ${PLAYBACK_DELAY_MS}ms before playing...`);

        // Countdown timer
        countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownInterval) clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        await new Promise((resolve) => setTimeout(resolve, PLAYBACK_DELAY_MS));

        if (!isMounted) return;

        setIsWaiting(false);
        setIsLoading(true);

        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create analyser for visualization
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        // Fetch the audio file
        console.log('[AudioWaveformPlayer] Fetching audio:', audioUrl);
        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;

        if (!isMounted) return;

        setIsLoading(false);
        setIsPlaying(true);

        // Create source and connect to analyser
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        sourceRef.current = source;

        // Start playback
        startTimeRef.current = audioContext.currentTime;
        source.start(0);

        // Track progress
        progressIntervalRef.current = setInterval(() => {
          if (audioContextRef.current && audioBufferRef.current) {
            const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
            const duration = audioBufferRef.current.duration;
            setProgress(Math.min(elapsed / duration, 1));
          }
        }, UPDATE_INTERVAL);

        // Update visualization
        const updateBars = () => {
          if (!analyserRef.current || !isMounted) return;

          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Map frequency data to bar heights
          const newHeights = [];
          const step = Math.floor(bufferLength / NUM_BARS);
          for (let i = 0; i < NUM_BARS; i++) {
            const value = dataArray[i * step] || 0;
            // Scale to 20-100 range
            const height = 20 + (value / 255) * 80;
            newHeights.push(height);
          }
          setBarHeights(newHeights);

          animationFrameRef.current = requestAnimationFrame(updateBars);
        };
        updateBars();

        // Handle playback end
        source.onended = () => {
          if (!isMounted) return;
          console.log('[AudioWaveformPlayer] Playback ended');
          setIsPlaying(false);
          setProgress(1);
          cleanup();

          // Signal that mic can be unmuted
          onUnmuteAllowed?.();

          // Notify completion
          onPlayComplete();
        };

      } catch (error) {
        console.error('[AudioWaveformPlayer] Error:', error);
        if (isMounted) {
          setIsLoading(false);
          cleanup();
          onUnmuteAllowed?.();
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    };

    loadAndPlayAudio();

    return () => {
      isMounted = false;
      if (countdownInterval) clearInterval(countdownInterval);
      cleanup();
    };
  }, [audioUrl, onPlayComplete, onError, onMuteRequired, onUnmuteAllowed, cleanup]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 rounded-2xl p-8 shadow-2xl border border-purple-500/20 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-3">
            {isWaiting ? (
              <span className="text-2xl font-bold text-purple-300">{countdown}</span>
            ) : (
              <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.586a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0" />
              </svg>
            )}
          </div>
          <h3 className="text-white text-lg font-semibold">
            {isWaiting ? 'Get ready to listen...' : isLoading ? 'Loading audio...' : 'Playing your recording'}
          </h3>
          <p className="text-purple-200/70 text-sm mt-1">
            {isWaiting ? 'Audio will play in a moment' : isLoading ? 'Please wait' : 'Listen to what you said'}
          </p>
        </div>

        {/* Waveform Visualization */}
        <div className="flex items-end justify-center gap-1 h-24 mb-6">
          {isWaiting || isLoading ? (
            // Waiting/Loading skeleton - gentle pulse
            Array.from({ length: NUM_BARS }).map((_, i) => (
              <div
                key={i}
                className="w-2 bg-purple-500/30 rounded-full animate-pulse"
                style={{
                  height: '30%',
                  animationDelay: `${i * 30}ms`
                }}
              />
            ))
          ) : (
            // Animated bars
            barHeights.map((height, i) => (
              <div
                key={i}
                className="w-2 bg-gradient-to-t from-purple-500 to-purple-300 rounded-full transition-all duration-75"
                style={{ height: `${height}%` }}
              />
            ))
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-purple-900/50 rounded-full overflow-hidden mb-4">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-purple-200/60 text-sm">
          <span className={`w-2 h-2 rounded-full ${isWaiting ? 'bg-amber-400 animate-pulse' : isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          <span>{isWaiting ? 'Preparing...' : isLoading ? 'Loading...' : isPlaying ? 'Playing...' : 'Complete'}</span>
        </div>

        {/* Mic muted indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-amber-300/80 text-xs">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
          <span>Microphone muted during playback</span>
        </div>
      </div>
    </div>
  );
}

export default AudioWaveformPlayer;
