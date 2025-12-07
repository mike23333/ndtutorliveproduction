/**
 * ChatControls Component
 * Bottom control bar with mic, whisper, stop, and hint buttons
 * Implements push-to-talk pattern with clear visual feedback
 */

import React from 'react';
import { AppColors } from '../../theme/colors';
import { MicIcon, HelpCircleIcon } from '../../theme/icons';

// Stop icon component
const StopIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

interface MicButtonProps {
  isRecording: boolean;
  isWhisperMode: boolean;
  isConnected: boolean;
  onPress: () => void;
}

export const MicButton: React.FC<MicButtonProps> = ({
  isRecording,
  isWhisperMode,
  isConnected,
  onPress
}) => {
  // Different colors for different states - makes it very clear when listening
  const listeningColor = '#22c55e';  // Green when actively listening
  const activeColor = isWhisperMode ? AppColors.whisperAmber : listeningColor;
  const idleColor = AppColors.accentPurple;

  return (
    <button
      onClick={onPress}
      disabled={!isConnected}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        border: isRecording ? `3px solid ${activeColor}` : 'none',
        background: isRecording
          ? `linear-gradient(135deg, ${activeColor} 0%, ${isWhisperMode ? '#f59e0b' : '#16a34a'} 100%)`
          : isConnected
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(100,100,100,0.2)',
        color: isRecording ? '#ffffff' : isConnected ? idleColor : AppColors.textSecondary,
        cursor: isConnected ? 'pointer' : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        boxShadow: isRecording
          ? `0 0 0 6px ${activeColor}33, 0 0 30px ${activeColor}66, inset 0 0 20px rgba(255,255,255,0.2)`
          : '0 4px 16px rgba(0,0,0,0.2)',
        animation: isRecording ? 'pulse 1s ease-in-out infinite' : 'none',
        opacity: isConnected ? 1 : 0.6,
        transform: isRecording ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <MicIcon size={28} />
    </button>
  );
};

interface StopButtonProps {
  isActive: boolean;  // Show when AI is playing or user is recording
  isConnected: boolean;
  onClick: () => void;
}

export const StopButton: React.FC<StopButtonProps> = ({
  isActive,
  isConnected,
  onClick
}) => {
  if (!isActive) return null;  // Only show when there's something to stop

  return (
    <button
      onClick={onClick}
      disabled={!isConnected}
      aria-label="Stop conversation"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        border: '2px solid #ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        cursor: isConnected ? 'pointer' : 'not-allowed',
        transition: 'all 0.15s ease',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <StopIcon size={20} />
      <span style={{
        fontSize: '8px',
        fontWeight: '700',
        letterSpacing: '0.5px',
      }}>
        STOP
      </span>
    </button>
  );
};

interface WhisperButtonProps {
  isActive: boolean;
  isConnected: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
}

export const WhisperButton: React.FC<WhisperButtonProps> = ({
  isActive,
  isConnected,
  onPressStart,
  onPressEnd
}) => (
  <button
    onMouseDown={isConnected ? onPressStart : undefined}
    onMouseUp={onPressEnd}
    onMouseLeave={onPressEnd}
    onTouchStart={isConnected ? onPressStart : undefined}
    onTouchEnd={onPressEnd}
    disabled={!isConnected}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      width: '72px',
      height: '72px',
      borderRadius: '20px',
      border: `2px solid ${isActive ? AppColors.whisperAmber : isConnected ? 'rgba(251, 191, 36, 0.4)' : 'rgba(100,100,100,0.3)'}`,
      backgroundColor: isActive ? AppColors.whisperAmber : isConnected ? 'rgba(251, 191, 36, 0.1)' : 'rgba(100,100,100,0.1)',
      color: isActive ? AppColors.textDark : isConnected ? AppColors.whisperAmber : AppColors.textSecondary,
      cursor: isConnected ? 'pointer' : 'not-allowed',
      transition: 'all 0.15s ease',
      transform: isActive ? 'scale(0.95)' : 'scale(1)',
      boxShadow: isActive ? `0 0 20px ${AppColors.whisperAmber}44` : 'none',
      opacity: isConnected ? 1 : 0.6,
    }}
  >
    <span style={{ fontSize: '24px', lineHeight: 1 }}>🇺🇦</span>
    <span style={{
      fontSize: '9px',
      fontWeight: '600',
      letterSpacing: '0.3px',
      textAlign: 'center',
      lineHeight: 1.2,
    }}>
      {isActive ? 'LISTENING' : 'WHISPER'}
    </span>
  </button>
);

interface HintButtonProps {
  isConnected: boolean;
  onClick: () => void;
}

export const HintButton: React.FC<HintButtonProps> = ({ isConnected, onClick }) => (
  <button
    onClick={onClick}
    disabled={!isConnected}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      width: '72px',
      height: '72px',
      borderRadius: '20px',
      border: `2px solid ${isConnected ? 'rgba(216, 180, 254, 0.3)' : 'rgba(100,100,100,0.3)'}`,
      backgroundColor: isConnected ? 'rgba(216, 180, 254, 0.1)' : 'rgba(100,100,100,0.1)',
      color: isConnected ? AppColors.accentPurple : AppColors.textSecondary,
      cursor: isConnected ? 'pointer' : 'not-allowed',
      transition: 'all 0.15s ease',
      opacity: isConnected ? 1 : 0.6,
    }}
  >
    <HelpCircleIcon size={24} />
    <span style={{
      fontSize: '9px',
      fontWeight: '600',
      letterSpacing: '0.3px',
    }}>
      HINT
    </span>
  </button>
);

interface ModeIndicatorProps {
  isWhisperMode: boolean;
  isRecording: boolean;
  isPlaying: boolean;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({ isWhisperMode, isRecording, isPlaying }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    padding: '8px 16px',
  }}>
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 14px',
      borderRadius: '20px',
      backgroundColor: isWhisperMode ? 'rgba(251, 191, 36, 0.15)' : 'rgba(216, 180, 254, 0.15)',
      color: isWhisperMode ? AppColors.whisperAmber : AppColors.accentPurple,
      fontSize: '12px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: isWhisperMode ? AppColors.whisperAmber : AppColors.accentPurple,
        animation: isRecording || isPlaying ? 'pulse 1s ease-in-out infinite' : 'none',
      }}/>
      {isPlaying ? '🔊 AI Speaking...' : isWhisperMode ? '🇺🇦 Whisper Mode' : '🎭 Roleplay Mode'}
    </div>
  </div>
);

interface ChatControlBarProps {
  isRecording: boolean;
  isWhisperMode: boolean;
  isConnected: boolean;
  isPlaying?: boolean;  // AI is speaking
  onMicPress: () => void;
  onWhisperStart: () => void;
  onWhisperEnd: () => void;
  onHint: () => void;
  onStop?: () => void;  // Stop/interrupt conversation
}

export const ChatControlBar: React.FC<ChatControlBarProps> = ({
  isRecording,
  isWhisperMode,
  isConnected,
  isPlaying = false,
  onMicPress,
  onWhisperStart,
  onWhisperEnd,
  onHint,
  onStop
}) => {
  const showStopButton = isRecording || isPlaying;

  return (
    <div style={{
      padding: '16px 24px 32px',
      background: 'linear-gradient(to bottom, rgba(30, 27, 75, 0.95) 0%, rgba(30, 27, 75, 1) 100%)',
      borderTop: `1px solid ${AppColors.borderColor}`,
      borderRadius: '24px 24px 0 0',
      backdropFilter: 'blur(16px)',
    }}>
      {/* Status indicator when active */}
      {(isRecording || isPlaying) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '12px',
          padding: '8px 16px',
          borderRadius: '20px',
          backgroundColor: isRecording
            ? 'rgba(34, 197, 94, 0.15)'
            : 'rgba(168, 85, 247, 0.15)',
          color: isRecording ? '#22c55e' : AppColors.accentPurple,
          fontSize: '13px',
          fontWeight: '600',
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isRecording ? '#22c55e' : AppColors.accentPurple,
            animation: 'pulse 1s ease-in-out infinite',
          }}/>
          {isPlaying ? '🔊 AI is speaking...' : isWhisperMode ? '🇺🇦 Listening...' : '🎤 Listening...'}
          {onStop && showStopButton && (
            <button
              onClick={onStop}
              style={{
                marginLeft: '12px',
                padding: '4px 12px',
                borderRadius: '12px',
                border: '1px solid #ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              STOP
            </button>
          )}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        <WhisperButton
          isActive={isWhisperMode && isRecording}
          isConnected={isConnected}
          onPressStart={onWhisperStart}
          onPressEnd={onWhisperEnd}
        />

        <MicButton
          isRecording={isRecording && !isWhisperMode}
          isWhisperMode={isWhisperMode}
          isConnected={isConnected}
          onPress={onMicPress}
        />

        <HintButton isConnected={isConnected} onClick={onHint} />
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '16px',
        fontSize: '12px',
        color: AppColors.textSecondary,
      }}>
        {!isConnected
          ? 'Connecting to AI...'
          : isRecording
            ? isWhisperMode
              ? 'Release to send your question in Ukrainian'
              : 'Tap mic again to stop recording'
            : isPlaying
              ? 'Tap STOP to interrupt the AI'
              : 'Hold 🇺🇦 to ask in Ukrainian • Tap mic to speak English'
        }
      </div>
    </div>
  );
};

export default ChatControlBar;
