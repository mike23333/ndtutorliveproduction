/**
 * RoleCard Component
 * Displays an AI role preset in a card format
 */

import React from 'react';
import type { AIRole, RolePreset } from '../types/ai-role';

interface SimpleRole {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  scenario?: string;
  persona?: 'actor' | 'tutor';
  tone?: string;
  level?: string;
  isCustom?: boolean;
}

interface RoleCardProps {
  role?: AIRole | SimpleRole;
  preset?: RolePreset;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AppColors = {
  gradientStart: '#1e3a8a',
  gradientMid: '#5b21b6',
  gradientEnd: '#1e1b4b',
  surfaceLight: 'rgba(255, 255, 255, 0.1)',
  surfaceMedium: 'rgba(99, 102, 241, 0.2)',
  textPrimary: '#ffffff',
  textSecondary: '#d8b4fe',
  accentPurple: '#d8b4fe',
  accentBlue: '#60a5fa',
  borderColor: 'rgba(129, 140, 248, 0.3)',
};

const EditIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  preset,
  isSelected = false,
  onClick,
  onEdit,
  onDelete,
}) => {
  const displayName = role?.name || preset?.name || 'Untitled Role';
  const displayIcon = role?.icon || preset?.icon || '🎭';
  const displayColor = role?.color || preset?.color || AppColors.accentPurple;
  const displayScenario = role?.scenario || preset?.scenario || '';
  const displayLevel = role?.level || 'B1';
  const displayTone = role?.tone || preset?.tone || 'friendly';
  const displayPersona = role?.persona || preset?.persona || 'actor';
  const isCustom = role?.isCustom || false;

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    padding: '16px',
    borderRadius: '16px',
    backgroundColor: AppColors.surfaceLight,
    border: `2px solid ${isSelected ? displayColor : 'transparent'}`,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(8px)',
    boxShadow: isSelected
      ? `0 0 0 3px ${displayColor}33, 0 8px 24px rgba(0,0,0,0.3)`
      : '0 2px 8px rgba(0,0,0,0.2)',
  };

  const iconContainerStyle: React.CSSProperties = {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: `linear-gradient(135deg, ${displayColor} 0%, ${displayColor}dd 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    marginBottom: '12px',
    boxShadow: `0 4px 12px ${displayColor}44`,
  };

  const handleCardClick = () => {
    if (onClick) onClick();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <div
      style={cardStyle}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isSelected
            ? `0 0 0 3px ${displayColor}33, 0 8px 24px rgba(0,0,0,0.3)`
            : '0 2px 8px rgba(0,0,0,0.2)';
        }
      }}
    >
      {/* Action buttons for custom roles */}
      {isCustom && (onEdit || onDelete) && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '6px',
        }}>
          {onEdit && (
            <button
              onClick={handleEdit}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: AppColors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Edit role"
            >
              <EditIcon />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Delete role"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      )}

      {/* Icon */}
      <div style={iconContainerStyle}>
        {displayIcon}
      </div>

      {/* Role name */}
      <h3 style={{
        margin: '0 0 6px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: AppColors.textPrimary,
      }}>
        {displayName}
      </h3>

      {/* Scenario */}
      {displayScenario && (
        <p style={{
          margin: '0 0 12px 0',
          fontSize: '13px',
          color: AppColors.textSecondary,
          lineHeight: '1.4',
          opacity: 0.9,
        }}>
          {displayScenario}
        </p>
      )}

      {/* Metadata badges */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginTop: '8px',
      }}>
        {/* Persona badge */}
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          backgroundColor: displayPersona === 'actor' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          color: displayPersona === 'actor' ? '#a78bfa' : '#34d399',
          border: `1px solid ${displayPersona === 'actor' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
        }}>
          {displayPersona === 'actor' ? '🎭 Actor' : '👨‍🏫 Tutor'}
        </span>

        {/* Level badge */}
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          backgroundColor: 'rgba(96, 165, 250, 0.2)',
          color: AppColors.accentBlue,
          border: `1px solid rgba(96, 165, 250, 0.3)`,
        }}>
          {displayLevel}
        </span>

        {/* Tone badge */}
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          backgroundColor: 'rgba(216, 180, 254, 0.2)',
          color: AppColors.accentPurple,
          border: `1px solid rgba(216, 180, 254, 0.3)`,
        }}>
          {displayTone}
        </span>

        {/* Custom badge */}
        {isCustom && (
          <span style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: 'rgba(251, 191, 36, 0.2)',
            color: '#fbbf24',
            border: `1px solid rgba(251, 191, 36, 0.3)`,
          }}>
            ⭐ Custom
          </span>
        )}
      </div>
    </div>
  );
};

export default RoleCard;
