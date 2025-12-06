/**
 * PersonaToggle Component
 * Toggle between Actor and Tutor persona modes
 */

import React from 'react';
import type { PersonaType } from '../types/ai-role';

interface PersonaToggleProps {
  value: PersonaType;
  onChange: (persona: PersonaType) => void;
  disabled?: boolean;
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
  successGreen: '#4ade80',
  borderColor: 'rgba(129, 140, 248, 0.3)',
};

const PERSONAS = {
  actor: {
    icon: '🎭',
    label: 'Actor',
    description: 'Role-play real scenarios',
    color: '#8b5cf6', // purple
    details: 'The AI will act as a character in a realistic scenario. Great for practicing real-world conversations like ordering food, checking into hotels, or shopping.',
  },
  tutor: {
    icon: '👨‍🏫',
    label: 'Tutor',
    description: 'Learn with guidance',
    color: '#10b981', // green
    details: 'The AI will act as a teacher, correcting mistakes and explaining grammar. Perfect for focused learning and improving specific skills.',
  },
};

export const PersonaToggle: React.FC<PersonaToggleProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const currentPersona = PERSONAS[value];

  return (
    <div style={{
      padding: '20px',
      borderRadius: '16px',
      backgroundColor: AppColors.surfaceLight,
      backdropFilter: 'blur(8px)',
    }}>
      {/* Header */}
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: AppColors.textPrimary,
      }}>
        AI Persona
      </h3>

      {/* Toggle buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {(Object.keys(PERSONAS) as PersonaType[]).map((persona) => {
          const personaInfo = PERSONAS[persona];
          const isActive = value === persona;

          return (
            <button
              key={persona}
              onClick={() => !disabled && onChange(persona)}
              disabled={disabled}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: `2px solid ${isActive ? personaInfo.color : 'transparent'}`,
                backgroundColor: isActive ? `${personaInfo.color}22` : AppColors.surfaceMedium,
                color: AppColors.textPrimary,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: disabled ? 0.5 : 1,
                textAlign: 'left',
                boxShadow: isActive ? `0 0 0 3px ${personaInfo.color}22` : 'none',
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isActive) {
                  e.currentTarget.style.backgroundColor = `${personaInfo.color}11`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = isActive
                    ? `${personaInfo.color}22`
                    : AppColors.surfaceMedium;
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {/* Icon */}
              <div style={{
                fontSize: '32px',
                marginBottom: '8px',
                filter: isActive ? 'none' : 'grayscale(0.5)',
              }}>
                {personaInfo.icon}
              </div>

              {/* Label */}
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '4px',
                color: isActive ? personaInfo.color : AppColors.textPrimary,
              }}>
                {personaInfo.label}
              </div>

              {/* Description */}
              <div style={{
                fontSize: '12px',
                color: AppColors.textSecondary,
                opacity: 0.9,
              }}>
                {personaInfo.description}
              </div>

              {/* Active indicator */}
              {isActive && (
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: personaInfo.color,
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: personaInfo.color,
                  }} />
                  Active
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Details box */}
      <div style={{
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderLeft: `3px solid ${currentPersona.color}`,
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: currentPersona.color,
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {currentPersona.label} Mode
        </div>
        <div style={{
          fontSize: '12px',
          color: AppColors.textSecondary,
          lineHeight: '1.5',
        }}>
          {currentPersona.details}
        </div>
      </div>
    </div>
  );
};

export default PersonaToggle;
