/**
 * VoiceSelector Component
 * World-class voice selection UI with audio preview
 */

import { useState, useRef, useEffect } from 'react';
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
}

export default function VoiceSelector({
  selectedVoice,
  onVoiceSelect,
  compact = false,
}: VoiceSelectorProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPreview = async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger selection

    // If already playing this voice, stop it
    if (playingVoice === voiceId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoice(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setLoadingVoice(voiceId);
    setPlayingVoice(null);

    try {
      const audio = new Audio(getVoicePreviewUrl(voiceId));
      audioRef.current = audio;

      audio.oncanplaythrough = () => {
        setLoadingVoice(null);
        setPlayingVoice(voiceId);
        audio.play().catch(console.error);
      };

      audio.onended = () => {
        setPlayingVoice(null);
      };

      audio.onerror = () => {
        setLoadingVoice(null);
        setPlayingVoice(null);
        console.warn(`Voice preview not available for ${voiceId}`);
      };

      audio.load();
    } catch (error) {
      setLoadingVoice(null);
      console.error('Error playing voice preview:', error);
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    onVoiceSelect(voiceId);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? '1fr' : 'repeat(2, 1fr)',
        gap: compact ? '8px' : '12px',
      }}
    >
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 0 16px rgba(139, 92, 246, 0.6); }
        }
        @keyframes sound-wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
        .voice-card:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .voice-card-selected {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {AVAILABLE_VOICES.map((voice) => {
        const isSelected = selectedVoice === voice.id;
        const isPlaying = playingVoice === voice.id;
        const isLoading = loadingVoice === voice.id;

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
                : AppColors.surfaceLight,
              border: `2px solid ${
                isSelected ? AppColors.accentPurple : AppColors.borderColor
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
                }}
              >
                {voice.name}
                {voice.id === DEFAULT_VOICE && !compact && (
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
                  color: AppColors.textSecondary,
                  lineHeight: 1.3,
                }}
              >
                {voice.description}
              </div>
              {!compact && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginTop: '2px',
                  }}
                >
                  {voice.personality}
                </div>
              )}
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
