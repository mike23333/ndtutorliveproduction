/**
 * ChatControls Component
 * Single animated button for live voice chat with pause/resume support
 * Click main button to stop the session
 * Click pause button to pause/resume within 2hr window
 */

import React from 'react';
import { AppColors } from '../../theme/colors';
import { MicIcon } from '../../theme/icons';

// Stop icon component
const StopIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

// Note: PauseIcon and PlayIcon removed - can be re-added when pause/resume UI is enabled

// Connection state type
type ConnectionState = 'disconnected' | 'connecting' | 'listening' | 'ai_speaking' | 'muted' | 'paused';

interface ChatControlBarProps {
  connectionState: ConnectionState;
  isPlaying?: boolean;
  isPaused?: boolean;
  canResume?: boolean;
  onStop: () => void;
  onToggleMute?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

/**
 * Single button control bar with pause/resume
 * Shows live state with animations, click to stop
 * Small pause button for session pause/resume
 */
export const ChatControlBar: React.FC<ChatControlBarProps> = ({
  connectionState,
  isPlaying = false,
  onStop,
}) => {
  const isConnected = connectionState !== 'disconnected' && connectionState !== 'connecting' && connectionState !== 'paused';
  const isLive = connectionState === 'listening' || connectionState === 'ai_speaking';

  // Get styles based on state
  const getButtonStyles = () => {
    switch (connectionState) {
      case 'disconnected':
        return {
          background: 'rgba(100, 100, 100, 0.2)',
          border: '4px solid rgba(100, 100, 100, 0.3)',
          color: AppColors.textSecondary,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'none',
        };
      case 'connecting':
        return {
          background: 'rgba(168, 85, 247, 0.2)',
          border: '4px solid rgba(168, 85, 247, 0.5)',
          color: AppColors.accentPurple,
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
          animation: 'connectingPulse 1.5s ease-in-out infinite',
        };
      case 'listening':
        return {
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          border: '4px solid #22c55e',
          color: '#ffffff',
          boxShadow: '0 0 0 8px rgba(34, 197, 94, 0.2), 0 0 40px rgba(34, 197, 94, 0.5)',
          animation: 'listeningPulse 2s ease-in-out infinite',
        };
      case 'ai_speaking':
        return {
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          border: '4px solid #a855f7',
          color: '#ffffff',
          boxShadow: '0 0 0 8px rgba(168, 85, 247, 0.2), 0 0 40px rgba(168, 85, 247, 0.5)',
          animation: 'speakingPulse 1s ease-in-out infinite',
        };
      case 'muted':
        return {
          background: 'rgba(251, 191, 36, 0.2)',
          border: '4px solid #fbbf24',
          color: '#fbbf24',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'none',
        };
      case 'paused':
        return {
          background: 'rgba(59, 130, 246, 0.2)',
          border: '4px solid #3b82f6',
          color: '#3b82f6',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
          animation: 'pausedPulse 2s ease-in-out infinite',
        };
    }
  };

  // Get label based on state
  const getLabel = () => {
    switch (connectionState) {
      case 'disconnected': return 'OFFLINE';
      case 'connecting': return 'CONNECTING';
      case 'listening': return 'LIVE';
      case 'ai_speaking': return 'SPEAKING';
      case 'muted': return 'MUTED';
      case 'paused': return 'PAUSED';
    }
  };

  // Get help text
  const getHelpText = () => {
    switch (connectionState) {
      case 'disconnected': return 'Connecting to AI...';
      case 'connecting': return 'Establishing connection...';
      case 'listening': return 'Speak naturally — tap to end';
      case 'ai_speaking': return 'AI is responding — tap to end';
      case 'muted': return 'Microphone muted';
      case 'paused': return 'Session paused — tap resume to continue';
    }
  };

  const styles = getButtonStyles();
  const showStopIcon = isLive || isPlaying;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '24px 24px 40px',
      background: 'linear-gradient(to bottom, rgba(30, 27, 75, 0.95) 0%, rgba(30, 27, 75, 1) 100%)',
      borderTop: `1px solid ${AppColors.borderColor}`,
      borderRadius: '32px 32px 0 0',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      zIndex: 100,
    }}>
      {/* Main Live Button */}
      <button
        onClick={isConnected ? onStop : undefined}
        disabled={!isConnected}
        aria-label={isLive ? 'Stop conversation' : 'Start conversation'}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: styles.border,
          background: styles.background,
          color: styles.color,
          cursor: isConnected ? 'pointer' : 'not-allowed',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          boxShadow: styles.boxShadow,
          animation: styles.animation,
          opacity: connectionState === 'disconnected' ? 0.6 : 1,
          transform: isLive ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {showStopIcon ? (
          <StopIcon size={36} />
        ) : (
          <MicIcon size={36} />
        )}
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '1px',
        }}>
          {getLabel()}
        </span>
      </button>

      {/* Help text */}
      <div style={{
        textAlign: 'center',
        fontSize: '14px',
        color: AppColors.textSecondary,
        fontWeight: '500',
      }}>
        {getHelpText()}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes listeningPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.4);
            transform: scale(1.05);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(34, 197, 94, 0), 0 0 50px rgba(34, 197, 94, 0.6);
            transform: scale(1.1);
          }
        }

        @keyframes speakingPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4), 0 0 30px rgba(168, 85, 247, 0.4);
            transform: scale(1.05);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(168, 85, 247, 0), 0 0 50px rgba(168, 85, 247, 0.7);
            transform: scale(1.08);
          }
        }

        @keyframes connectingPulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.03);
          }
        }

        @keyframes pausedPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0), 0 0 30px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatControlBar;
