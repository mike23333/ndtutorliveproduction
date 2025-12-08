/**
 * ScenarioHeader Component
 * Displays the current roleplay scenario info and progress bar
 */

import React from 'react';
import { AppColors } from '../../theme/colors';
import { SettingsIcon, XIcon, WifiIcon, WifiOffIcon, LoaderIcon } from '../../theme/icons';

interface ScenarioHeaderProps {
  scenario: string;
  tone: string;
  level: string;
  progress: number;
  icon: React.ReactNode;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  onSettings: () => void;
  onClose: () => void;
  onReconnect: () => void;
}

export const ScenarioHeader: React.FC<ScenarioHeaderProps> = ({
  scenario,
  tone,
  level,
  progress: _progress, // Reserved for future progress bar feature
  icon,
  isConnected,
  isConnecting,
  connectionError,
  onSettings,
  onClose,
  onReconnect
}) => (
  <div style={{
    padding: '16px',
    borderBottom: `1px solid ${AppColors.borderColor}`,
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: AppColors.accentPurple,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h1 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: AppColors.textPrimary,
        }}>
          {scenario}
        </h1>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '4px',
          fontSize: '12px',
          color: AppColors.textSecondary,
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isConnected ? AppColors.successGreen : connectionError ? AppColors.errorRed : AppColors.textSecondary
          }}/>
          {tone} • Level {level}
        </div>
      </div>

      {/* Connection status indicator */}
      <button
        onClick={onReconnect}
        style={{
          padding: '8px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          color: isConnected ? AppColors.successGreen : isConnecting ? AppColors.textSecondary : AppColors.errorRed,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={isConnected ? 'Connected to Gemini' : isConnecting ? 'Connecting...' : connectionError || 'Disconnected'}
      >
        {isConnecting ? (
          <LoaderIcon size={20} />
        ) : isConnected ? (
          <WifiIcon size={20} />
        ) : (
          <WifiOffIcon size={20} />
        )}
      </button>

      <button
        onClick={onSettings}
        style={{
          padding: '8px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          color: AppColors.textSecondary,
          cursor: 'pointer',
        }}
      >
        <SettingsIcon />
      </button>
      <button
        onClick={onClose}
        style={{
          padding: '8px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          color: AppColors.textSecondary,
          cursor: 'pointer',
        }}
      >
        <XIcon />
      </button>
    </div>

  </div>
);

export default ScenarioHeader;
