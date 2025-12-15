import React, { useState, useRef } from 'react';
import { AppColors } from '../../theme/colors';
import type { ClassMistake, MistakeErrorType } from '../../types/dashboard';

interface MistakeCardProps {
  mistake: ClassMistake;
  compact?: boolean;
}

const ERROR_TYPE_CONFIG: Record<MistakeErrorType, { color: string; bgColor: string; icon: string }> = {
  Grammar: {
    color: '#FF6B81',
    bgColor: 'rgba(255, 107, 129, 0.12)',
    icon: '✏️',
  },
  Pronunciation: {
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    icon: '🗣️',
  },
  Vocabulary: {
    color: '#60A5FA',
    bgColor: 'rgba(96, 165, 250, 0.12)',
    icon: '📚',
  },
  Cultural: {
    color: '#FBBF24',
    bgColor: 'rgba(251, 191, 36, 0.12)',
    icon: '🌍',
  },
};

export const MistakeCard: React.FC<MistakeCardProps> = ({ mistake, compact = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const config = ERROR_TYPE_CONFIG[mistake.errorType] || ERROR_TYPE_CONFIG.Vocabulary;

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handlePlayAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mistake.audioUrl || audioError) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(mistake.audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => {
          setAudioError(true);
          setIsPlaying(false);
        };
      }
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio playback failed:', err);
      setAudioError(true);
    }
  };

  return (
    <div
      onClick={() => compact && setIsExpanded(!isExpanded)}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 'clamp(14px, 3.5vw, 18px)',
        padding: 'clamp(14px, 3.5vw, 18px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        cursor: compact ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '4px',
          background: `linear-gradient(180deg, ${config.color} 0%, ${config.color}60 100%)`,
          borderRadius: '4px 0 0 4px',
        }}
      />

      {/* Content with left padding for accent line */}
      <div style={{ paddingLeft: '8px' }}>
        {/* Header: Student + Type Badge + Time */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isExpanded ? 'clamp(12px, 3vw, 16px)' : '0',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', flex: 1, minWidth: 0 }}>
            {/* Student Avatar */}
            <div
              style={{
                width: 'clamp(32px, 8vw, 38px)',
                height: 'clamp(32px, 8vw, 38px)',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${config.bgColor} 0%, rgba(255, 255, 255, 0.05) 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(14px, 3vw, 16px)',
                flexShrink: 0,
                border: `1px solid ${config.color}30`,
              }}
            >
              {config.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 'clamp(14px, 3vw, 15px)',
                    fontWeight: 600,
                    color: AppColors.textPrimary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {mistake.studentName}
                </span>
                {/* Type Badge */}
                <span
                  style={{
                    fontSize: 'clamp(10px, 2vw, 11px)',
                    fontWeight: 600,
                    color: config.color,
                    background: config.bgColor,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mistake.errorType}
                </span>
              </div>
              {/* Time on separate line for cleaner look */}
              <span
                style={{
                  fontSize: 'clamp(11px, 2.2vw, 12px)',
                  color: AppColors.textMuted,
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                {formatDate(mistake.createdAt)}
              </span>
            </div>
          </div>

          {/* Expand indicator for compact mode */}
          {compact && (
            <span
              style={{
                fontSize: '12px',
                color: AppColors.textMuted,
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              ▼
            </span>
          )}
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div>
            {/* The mistake comparison */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 'clamp(10px, 2.5vw, 12px)',
                padding: 'clamp(12px, 3vw, 16px)',
                marginBottom: mistake.audioUrl ? 'clamp(12px, 3vw, 16px)' : '0',
              }}
            >
              {/* What they said */}
              <div style={{ marginBottom: 'clamp(10px, 2.5vw, 12px)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#FF6B81',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'clamp(10px, 2vw, 11px)',
                      color: AppColors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
                    }}
                  >
                    Said
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 'clamp(14px, 3vw, 15px)',
                    color: 'rgba(255, 107, 129, 0.95)',
                    margin: 0,
                    lineHeight: 1.5,
                    paddingLeft: '12px',
                    fontStyle: 'italic',
                  }}
                >
                  "{mistake.userSentence}"
                </p>
              </div>

              {/* Correction */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#4ade80',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'clamp(10px, 2vw, 11px)',
                      color: AppColors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
                    }}
                  >
                    Correct
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 'clamp(14px, 3vw, 15px)',
                    color: 'rgba(74, 222, 128, 0.95)',
                    margin: 0,
                    lineHeight: 1.5,
                    paddingLeft: '12px',
                  }}
                >
                  "{mistake.correction}"
                </p>
              </div>
            </div>

            {/* Audio button */}
            {mistake.audioUrl && (
              <button
                onClick={handlePlayAudio}
                disabled={audioError}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isPlaying
                    ? `linear-gradient(135deg, ${config.color}30 0%, ${config.color}15 100%)`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isPlaying
                    ? `1px solid ${config.color}40`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'clamp(8px, 2vw, 10px)',
                  padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3.5vw, 16px)',
                  color: isPlaying ? config.color : AppColors.textSecondary,
                  fontSize: 'clamp(12px, 2.5vw, 13px)',
                  fontWeight: 500,
                  cursor: audioError ? 'not-allowed' : 'pointer',
                  opacity: audioError ? 0.4 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Play/Pause Icon */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: isPlaying ? config.color : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isPlaying ? (
                    <span style={{ fontSize: '10px', color: '#fff' }}>■</span>
                  ) : (
                    <span style={{ fontSize: '10px', marginLeft: '2px', color: AppColors.textSecondary }}>▶</span>
                  )}
                </div>
                {audioError ? 'Audio unavailable' : isPlaying ? 'Stop' : 'Listen'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
