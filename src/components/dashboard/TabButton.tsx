import React from 'react';
import { AppColors } from '../../theme/colors';

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconOnly?: boolean;
}

export const TabButton: React.FC<TabButtonProps> = ({
  label,
  isActive,
  onClick,
  icon,
  iconOnly = false,
}) => (
  <button
    onClick={onClick}
    className="tab-button"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: iconOnly ? 0 : 'clamp(6px, 1.5vw, 8px)',
      padding: iconOnly
        ? 'clamp(8px, 2vw, 10px)'
        : 'clamp(8px, 2vw, 10px) clamp(14px, 3.5vw, 18px)',
      background: isActive
        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)'
        : 'transparent',
      border: isActive
        ? '1px solid rgba(139, 92, 246, 0.3)'
        : '1px solid transparent',
      borderRadius: 'clamp(12px, 3vw, 14px)',
      color: isActive ? AppColors.textPrimary : AppColors.textSecondary,
      fontSize: 'clamp(13px, 2.8vw, 14px)',
      fontWeight: isActive ? 600 : 500,
      cursor: 'pointer',
      transition: 'all 0.25s ease',
      boxShadow: isActive
        ? '0 2px 12px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        : 'none',
      backdropFilter: isActive ? 'blur(10px)' : 'none',
      WebkitBackdropFilter: isActive ? 'blur(10px)' : 'none',
      minWidth: iconOnly ? '40px' : 'auto',
      flexShrink: iconOnly ? 0 : 1,
    }}
    title={iconOnly ? label : undefined}
  >
    {icon}
    {!iconOnly && <span>{label}</span>}
  </button>
);
