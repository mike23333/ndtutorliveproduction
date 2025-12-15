import React from 'react';
import { AppColors } from '../../theme/colors';

interface ClassPulseAlertProps {
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
}

const ALERT_CONFIG = {
  warning: {
    icon: '⚠️',
    bgColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.2)',
    accentColor: '#FBBF24',
  },
  success: {
    icon: '✨',
    bgColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.2)',
    accentColor: '#4ade80',
  },
  info: {
    icon: '💡',
    bgColor: 'rgba(96, 165, 250, 0.1)',
    borderColor: 'rgba(96, 165, 250, 0.2)',
    accentColor: '#60A5FA',
  },
};

export const ClassPulseAlert: React.FC<ClassPulseAlertProps> = ({ title, message, type }) => {
  const config = ALERT_CONFIG[type];

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        gap: 'clamp(12px, 3vw, 14px)',
        padding: 'clamp(14px, 3.5vw, 18px)',
        background: config.bgColor,
        borderRadius: 'clamp(12px, 3vw, 14px)',
        border: `1px solid ${config.borderColor}`,
        overflow: 'hidden',
      }}
    >
      {/* Accent line on left */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '3px',
          background: config.accentColor,
          borderRadius: '3px 0 0 3px',
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: 'clamp(32px, 8vw, 36px)',
          height: 'clamp(32px, 8vw, 36px)',
          borderRadius: '10px',
          background: `${config.accentColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(16px, 3.5vw, 18px)',
          flexShrink: 0,
        }}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            fontSize: 'clamp(14px, 3vw, 15px)',
            fontWeight: 600,
            color: AppColors.textPrimary,
            margin: '0 0 4px 0',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h4>
        <p
          style={{
            fontSize: 'clamp(12px, 2.5vw, 13px)',
            color: AppColors.textSecondary,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
};
