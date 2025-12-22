/**
 * ScenarioHeader Component
 * Displays the current roleplay scenario info and progress bar
 */

import React from 'react';
import { AppColors } from '../../theme/colors';
import { XIcon, WifiIcon, WifiOffIcon, LoaderIcon } from '../../theme/icons';

interface ScenarioHeaderProps {
  scenario: string;
  tone: string;
  level: string;
  icon: React.ReactNode;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  onClose: () => void;
  onReconnect: () => void;
  timerElement?: React.ReactNode;
}

export const ScenarioHeader: React.FC<ScenarioHeaderProps> = ({
  scenario,
  tone,
  level,
  icon,
  isConnected,
  isConnecting,
  connectionError,
  onClose,
  onReconnect,
  timerElement
}) => (
  <div style={{
    padding: 'clamp(10px, 3vw, 16px)',
    borderBottom: `1px solid ${AppColors.borderColor}`,
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(8px, 2vw, 12px)',
    }}>
      {/* Icon - responsive size, hidden on very small screens */}
      <div style={{
        width: 'clamp(36px, 10vw, 48px)',
        height: 'clamp(36px, 10vw, 48px)',
        minWidth: '36px',
        borderRadius: 'clamp(8px, 2vw, 12px)',
        background: 'rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: AppColors.accentPurple,
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Title section - flexible with min-width 0 for text truncation */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(14px, 4vw, 18px)',
          fontWeight: '600',
          color: AppColors.textPrimary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {scenario}
        </h1>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1vw, 6px)',
          marginTop: '2px',
          fontSize: 'clamp(10px, 2.5vw, 12px)',
          color: AppColors.textSecondary,
        }}>
          <span style={{
            width: 'clamp(5px, 1.5vw, 6px)',
            height: 'clamp(5px, 1.5vw, 6px)',
            borderRadius: '50%',
            backgroundColor: isConnected ? AppColors.successGreen : connectionError ? AppColors.errorRed : AppColors.textSecondary,
            flexShrink: 0,
          }}/>
          <span style={{ whiteSpace: 'nowrap' }}>{tone} • L{level}</span>
        </div>
      </div>

      {/* Timer - inline, shrinks on small screens */}
      {timerElement && (
        <div style={{ flexShrink: 0 }}>
          {timerElement}
        </div>
      )}

      {/* Connection status indicator - 44px min touch target */}
      <button
        onClick={onReconnect}
        style={{
          width: 'clamp(36px, 10vw, 44px)',
          height: 'clamp(36px, 10vw, 44px)',
          minWidth: '36px',
          minHeight: '36px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          color: isConnected ? AppColors.successGreen : isConnecting ? AppColors.textSecondary : AppColors.errorRed,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        title={isConnected ? 'Connected to Gemini' : isConnecting ? 'Connecting...' : connectionError || 'Disconnected'}
      >
        {isConnecting ? (
          <LoaderIcon size={18} />
        ) : isConnected ? (
          <WifiIcon size={18} />
        ) : (
          <WifiOffIcon size={18} />
        )}
      </button>

      {/* Close button - 44px min touch target for mobile accessibility */}
      <button
        onClick={onClose}
        style={{
          width: 'clamp(36px, 10vw, 44px)',
          height: 'clamp(36px, 10vw, 44px)',
          minWidth: '36px',
          minHeight: '36px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(255,255,255,0.05)',
          color: AppColors.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <XIcon size={18} />
      </button>
    </div>
  </div>
);

export default ScenarioHeader;
