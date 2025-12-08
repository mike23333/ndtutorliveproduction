/**
 * ModeIndicator Component
 * Shows the current conversation mode (recording, playing, idle)
 */

import React from 'react';
import { AppColors } from '../../theme/colors';

interface ModeIndicatorProps {
  isWhisperMode: boolean;
  isRecording: boolean;
  isPlaying: boolean;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({
  isWhisperMode,
  isRecording,
  isPlaying
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
        text: isWhisperMode ? 'Listening (Ukrainian)...' : 'Listening...',
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ModeIndicator;
