/**
 * LevelSlider Component
 * Interactive CEFR level slider (A1-C2)
 */

import React from 'react';
import type { StudentLevel } from '../types/ai-role';

interface LevelSliderProps {
  value: StudentLevel;
  onChange: (level: StudentLevel) => void;
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

const LEVELS: StudentLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const LEVEL_INFO: Record<StudentLevel, { name: string; description: string; color: string }> = {
  A1: {
    name: 'Beginner',
    description: 'Basic phrases and simple sentences',
    color: '#ef4444', // red
  },
  A2: {
    name: 'Elementary',
    description: 'Everyday expressions and simple conversations',
    color: '#f97316', // orange
  },
  B1: {
    name: 'Intermediate',
    description: 'Familiar topics and basic fluency',
    color: '#eab308', // yellow
  },
  B2: {
    name: 'Upper Intermediate',
    description: 'Complex topics with good fluency',
    color: '#84cc16', // lime
  },
  C1: {
    name: 'Advanced',
    description: 'Sophisticated language and subtle meanings',
    color: '#22c55e', // green
  },
  C2: {
    name: 'Mastery',
    description: 'Native-like proficiency',
    color: '#10b981', // emerald
  },
};

export const LevelSlider: React.FC<LevelSliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const currentIndex = LEVELS.indexOf(value);
  const currentInfo = LEVEL_INFO[value];

  const handleLevelClick = (level: StudentLevel) => {
    if (!disabled) {
      onChange(level);
    }
  };

  return (
    <div style={{
      padding: '20px',
      borderRadius: '16px',
      backgroundColor: AppColors.surfaceLight,
      backdropFilter: 'blur(8px)',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: AppColors.textPrimary,
          }}>
            Student Level
          </h3>
          <div style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '700',
            backgroundColor: `${currentInfo.color}22`,
            color: currentInfo.color,
            border: `2px solid ${currentInfo.color}44`,
          }}>
            {value}
          </div>
        </div>

        <p style={{
          margin: 0,
          fontSize: '14px',
          color: AppColors.textSecondary,
        }}>
          {currentInfo.name} • {currentInfo.description}
        </p>
      </div>

      {/* Level dots */}
      <div style={{
        position: 'relative',
        marginBottom: '12px',
      }}>
        {/* Progress bar background */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '0',
          right: '0',
          height: '4px',
          backgroundColor: AppColors.surfaceMedium,
          borderRadius: '2px',
          transform: 'translateY(-50%)',
        }}>
          {/* Active progress */}
          <div style={{
            height: '100%',
            width: `${(currentIndex / (LEVELS.length - 1)) * 100}%`,
            background: `linear-gradient(to right, ${LEVEL_INFO.A1.color}, ${currentInfo.color})`,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Level dots */}
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {LEVELS.map((level, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = level === value;
            const levelInfo = LEVEL_INFO[level];

            return (
              <button
                key={level}
                onClick={() => handleLevelClick(level)}
                disabled={disabled}
                style={{
                  position: 'relative',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: isCurrent ? `3px solid ${levelInfo.color}` : 'none',
                  backgroundColor: isActive ? levelInfo.color : AppColors.surfaceMedium,
                  color: isActive ? '#ffffff' : AppColors.textSecondary,
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: disabled ? 0.5 : 1,
                  boxShadow: isCurrent ? `0 0 0 4px ${levelInfo.color}33` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!disabled && !isCurrent) {
                    e.currentTarget.style.transform = 'scale(1.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Level labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: AppColors.textSecondary,
        marginTop: '8px',
        opacity: 0.7,
      }}>
        <span>Beginner</span>
        <span>Intermediate</span>
        <span>Advanced</span>
      </div>

      {/* Additional info */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        fontSize: '12px',
        color: AppColors.textSecondary,
        lineHeight: '1.5',
      }}>
        <strong style={{ color: AppColors.textPrimary }}>At this level:</strong>
        <br />
        {value === 'A1' && 'AI will use very simple words and speak slowly. Perfect for absolute beginners.'}
        {value === 'A2' && 'AI will use basic vocabulary and clear grammar. Good for elementary learners.'}
        {value === 'B1' && 'AI will use everyday language at normal speed. Great for intermediate practice.'}
        {value === 'B2' && 'AI will use complex sentences and natural expressions. Suitable for upper-intermediate.'}
        {value === 'C1' && 'AI will use sophisticated language and subtle nuances. For advanced learners.'}
        {value === 'C2' && 'AI will speak at native level with idioms and complex grammar. Mastery level.'}
      </div>
    </div>
  );
};

export default LevelSlider;
