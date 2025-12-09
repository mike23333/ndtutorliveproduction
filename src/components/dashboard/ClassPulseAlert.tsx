import React from 'react';
import { AppColors } from '../../theme/colors';
import { AlertCircleIcon } from '../../theme/icons';

interface ClassPulseAlertProps {
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
}

export const ClassPulseAlert: React.FC<ClassPulseAlertProps> = ({ title, message, type }) => {
  const bgColor =
    type === 'warning'
      ? 'rgba(251, 191, 36, 0.15)'
      : type === 'success'
      ? 'rgba(74, 222, 128, 0.15)'
      : 'rgba(96, 165, 250, 0.15)';

  const iconColor =
    type === 'warning'
      ? AppColors.whisperAmber
      : type === 'success'
      ? AppColors.successGreen
      : AppColors.accentBlue;

  return (
    <div
      style={{
        display: 'flex',
        gap: 'clamp(10px, 2.5vw, 12px)',
        padding: 'clamp(10px, 2.5vw, 14px)',
        background: bgColor,
        borderRadius: 'clamp(8px, 2vw, 10px)',
        marginBottom: 'clamp(8px, 2vw, 10px)',
      }}
    >
      <div style={{ color: iconColor }}>
        <AlertCircleIcon size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 'clamp(13px, 2.8vw, 14px)',
            fontWeight: 600,
            color: AppColors.textPrimary,
            marginBottom: 'clamp(2px, 0.5vw, 4px)',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary }}>
          {message}
        </div>
      </div>
    </div>
  );
};
