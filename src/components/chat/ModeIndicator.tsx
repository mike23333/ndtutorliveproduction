/**
 * ModeIndicator Component
 * Shows the current conversation mode (recording, playing, idle)
 */

import React from 'react';
import { AppColors } from '../../theme/colors';
import '../../styles/animations.css';

interface ModeIndicatorProps {
  isWhisperMode: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  /** MED-003: Native language for whisper mode display */
  nativeLanguage?: string;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({
  isWhisperMode,
  isRecording,
  isPlaying,
  nativeLanguage = 'Ukrainian',
}) => {
  // Don't show anything if idle
  if (!isRecording && !isPlaying) {
    return null;
  }

  const getConfig = () => {
    if (isPlaying) {
      return {
        text: 'AI Speaking...',
        color: AppColors.accentPurple,
        bgColor: 'rgba(168, 85, 247, 0.15)',
        icon: '🔊'
      };
    }
    if (isRecording) {
      return {
        text: isWhisperMode ? `Listening (${nativeLanguage})...` : 'Listening...',
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.15)',
        icon: '🎤'
      };
    }
    return null;
  };

  const config = getConfig();
  if (!config) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px 16px',
      margin: '0 16px 8px',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '20px',
        backgroundColor: config.bgColor,
        color: config.color,
        fontSize: '13px',
        fontWeight: '500',
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: config.color,
          animation: 'pulse 1s ease-in-out infinite',
        }}/>
        {config.icon} {config.text}
      </div>
      {/* MED-001: pulse keyframes moved to animations.css */}
    </div>
  );
};

export default ModeIndicator;
