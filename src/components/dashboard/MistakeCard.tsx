import React, { useState, useRef } from 'react';
import { AppColors } from '../../theme/colors';
import type { ClassMistake, MistakeErrorType } from '../../types/dashboard';

interface MistakeCardProps {
  mistake: ClassMistake;
}

const ERROR_TYPE_COLORS: Record<MistakeErrorType, string> = {
  Grammar: '#FF6B81',
  Pronunciation: '#A855F7',
  Vocabulary: '#60A5FA',
  Cultural: '#FBBF24',
};

export const MistakeCard: React.FC<MistakeCardProps> = ({ mistake }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const accentColor = ERROR_TYPE_COLORS[mistake.errorType] || ERROR_TYPE_COLORS.Vocabulary;

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handlePlayAudio = async () => {
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
      style={{
        background: AppColors.surfaceLight,
        borderRadius: '16px',
        padding: '16px 18px',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      {/* Header: Student + Type + Date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: AppColors.textPrimary,
            }}
          >
            {mistake.studentName}
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: accentColor,
              opacity: 0.9,
            }}
          >
            {mistake.errorType}
          </span>
        </div>
        <span
          style={{
            fontSize: '12px',
            color: AppColors.textSecondary,
          }}
        >
          {formatDate(mistake.createdAt)}
        </span>
      </div>

      {/* The mistake - simple and clear */}
      <div style={{ marginBottom: mistake.audioUrl ? '14px' : 0 }}>
        {/* What they said */}
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255, 107, 129, 0.9)',
            margin: '0 0 8px 0',
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: AppColors.textSecondary, fontSize: '13px', marginRight: '8px' }}>said</span>
          "{mistake.userSentence}"
        </p>

        {/* Correction */}
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(34, 197, 94, 0.9)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: AppColors.textSecondary, fontSize: '13px', marginRight: '8px' }}>correct</span>
          "{mistake.correction}"
        </p>
      </div>

      {/* Audio button - minimal */}
      {mistake.audioUrl && (
        <button
          onClick={handlePlayAudio}
          disabled={audioError}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: isPlaying ? accentColor : 'transparent',
            border: isPlaying ? 'none' : `1px solid ${AppColors.borderColor}`,
            borderRadius: '20px',
            padding: '8px 14px',
            color: isPlaying ? '#fff' : AppColors.textSecondary,
            fontSize: '13px',
            fontWeight: 500,
            cursor: audioError ? 'not-allowed' : 'pointer',
            opacity: audioError ? 0.4 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '14px' }}>
            {isPlaying ? '■' : '▶'}
          </span>
          {audioError ? 'Unavailable' : isPlaying ? 'Playing' : 'Listen'}
        </button>
      )}
    </div>
  );
};
