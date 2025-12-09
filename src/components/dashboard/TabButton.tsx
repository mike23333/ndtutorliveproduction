import React from 'react';
import { AppColors } from '../../theme/colors';

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

export const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(6px, 1.5vw, 8px)',
      padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3.5vw, 18px)',
      background: isActive ? AppColors.surfaceMedium : 'transparent',
      border: 'none',
      borderRadius: 'clamp(16px, 4vw, 20px)',
      color: isActive ? AppColors.textPrimary : AppColors.textSecondary,
      fontSize: 'clamp(13px, 2.8vw, 14px)',
      fontWeight: isActive ? 600 : 400,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    {icon}
    {label}
  </button>
);
