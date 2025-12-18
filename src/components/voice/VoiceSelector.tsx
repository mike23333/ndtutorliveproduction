/**
 * VoiceSelector Component
 * World-class voice selection UI with audio preview
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { AppColors } from '../../theme/colors';
import {
  AVAILABLE_VOICES,
  DEFAULT_VOICE,
  getVoicePreviewUrl,
} from '../../constants/voices';

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceSelect: (voiceId: string) => void;
  compact?: boolean; // For use in settings dropdown
  showHint?: boolean; // Show "Tap to preview" hint
}

export default function VoiceSelector({
  selectedVoice,
  onVoiceSelect,
  compact = false,
  showHint = false,
}: VoiceSelectorProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const [errorVoice, setErrorVoice] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioIdRef = useRef<number>(0); // Track which audio instance is current

  // Cleanup audio helper
  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.oncanplaythrough = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  // Clear error after 3 seconds
  useEffect(() => {
    if (errorVoice) {
      const timer = setTimeout(() => setErrorVoice(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorVoice]);

  const handlePlayPreview = async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger selection
    setErrorVoice(null);

    // If already playing this voice, stop it
    if (playingVoice === voiceId) {
      cleanupAudio();
      setPlayingVoice(null);
      return;
    }

    // Stop any currently playing audio and cleanup handlers
    cleanupAudio();

    // Increment audio ID to invalidate any pending callbacks from old audio
    const currentAudioId = ++audioIdRef.current;

    setLoadingVoice(voiceId);
    setPlayingVoice(null);

    try {
      const audio = new Audio(getVoicePreviewUrl(voiceId));
      audioRef.current = audio;

      audio.oncanplaythrough = () => {
        // Only process if this is still the current audio instance
        if (audioIdRef.current !== currentAudioId) return;

        setLoadingVoice(null);
        setPlayingVoice(voiceId);
        setHasPlayed(true);
        audio.play().catch(console.error);
      };

      audio.onended = () => {
        if (audioIdRef.current !== currentAudioId) return;
        setPlayingVoice(null);
      };

      audio.onerror = () => {
        if (audioIdRef.current !== currentAudioId) return;
        setLoadingVoice(null);
        setPlayingVoice(null);
        setErrorVoice(voiceId);
      };

      audio.load();
    } catch (error) {
      setLoadingVoice(null);
      setErrorVoice(voiceId);
      console.error('Error playing voice preview:', error);
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    onVoiceSelect(voiceId);
  };

  // Get voice type label and color
  const getVoiceTypeInfo = (type: string) => {
    switch (type) {
      case 'female':
        return { label: 'Female', color: '#F472B6', bg: 'rgba(244, 114, 182, 0.15)' };
      case 'male':
        return { label: 'Male', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)' };
      default:
        return { label: 'Neutral', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '12px' }}>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 0 16px rgba(139, 92, 246, 0.6); }
        }
        @keyframes sound-wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .voice-card:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .voice-card-selected {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Hint text - show until user plays first voice */}
      {showHint && !hasPlayed && !compact && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '10px',
            marginBottom: '4px',
            animation: 'fade-in 0.3s ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              fill={AppColors.accentPurple}
            />
          </svg>
          <span style={{ fontSize: '13px', color: AppColors.textSecondary }}>
            Tap the play button to preview each voice
          </span>
        </div>
      )}

      {/* Voice grid - responsive: 1 column on mobile, 2 on larger screens */}
      <style>{`
        .voice-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 480px) {
          .voice-grid:not(.voice-grid-compact) {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }
      `}</style>
      <div className={`voice-grid ${compact ? 'voice-grid-compact' : ''}`}>
        {AVAILABLE_VOICES.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isPlaying = playingVoice === voice.id;
          const isLoading = loadingVoice === voice.id;
          const hasError = errorVoice === voice.id;
          const typeInfo = getVoiceTypeInfo(voice.type);

          return (
            <button
              key={voice.id}
              type="button"
              onClick={() => handleVoiceSelect(voice.id)}
              className={`voice-card ${isSelected ? 'voice-card-selected' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: compact ? '12px' : '14px 16px',
                background: isSelected
                  ? 'rgba(139, 92, 246, 0.15)'
                  : hasError
                  ? 'rgba(248, 113, 113, 0.1)'
                  : AppColors.surfaceLight,
                border: `2px solid ${
                  isSelected
                    ? AppColors.accentPurple
                    : hasError
                    ? AppColors.errorRose
                    : AppColors.borderColor
                }`,
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                position: 'relative',
                opacity: playingVoice && !isPlaying ? 0.6 : 1,
              }}
            >
              {/* Play/Stop Button */}
              <div
                onClick={(e) => handlePlayPreview(voice.id, e)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isPlaying
                    ? `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`
                    : hasError
                    ? 'rgba(248, 113, 113, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                {isLoading ? (
                  // Loading spinner
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                ) : isPlaying ? (
                  // Sound wave animation (stop icon)
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: '3px',
                          height: '14px',
                          background: 'white',
                          borderRadius: '2px',
                          animation: `sound-wave 0.5s ease-in-out infinite`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                ) : hasError ? (
                  // Error icon
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={AppColors.errorRose}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                ) : (
                  // Play icon
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="white"
                    style={{ marginLeft: '2px' }}
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>

              {/* Voice Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: compact ? '14px' : '15px',
                    fontWeight: 600,
                    color: isSelected ? AppColors.textPrimary : AppColors.textSecondary,
                    marginBottom: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  {voice.name}
                  {/* Voice type tag */}
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      color: typeInfo.color,
                      background: typeInfo.bg,
                      padding: '2px 6px',
                      borderRadius: '8px',
                    }}
                  >
                    {typeInfo.label}
                  </span>
                  {voice.id === DEFAULT_VOICE && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        color: AppColors.successGreen,
                        background: 'rgba(34, 197, 94, 0.15)',
                        padding: '2px 6px',
                        borderRadius: '8px',
                      }}
                    >
                      Popular
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: compact ? '12px' : '13px',
                    color: hasError ? AppColors.errorRose : AppColors.textSecondary,
                    lineHeight: 1.3,
                  }}
                >
                  {hasError ? 'Preview unavailable' : voice.description}
                </div>
                {/* Show personality in both modes now */}
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginTop: '2px',
                  }}
                >
                  {voice.personality}
                </div>
              </div>

              {/* Selected Checkmark */}
              {isSelected && (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
