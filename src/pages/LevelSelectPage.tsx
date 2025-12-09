import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../services/firebase/auth';
import { checkAndAwardBadges } from '../services/firebase/badges';
import { ProficiencyLevel } from '../types/firestore';

interface LevelOption {
  id: ProficiencyLevel;
  name: string;
  description: string;
  emoji: string;
}

const levels: LevelOption[] = [
  {
    id: 'A1',
    name: 'A1 - Beginner',
    description: 'Just starting out. Learning basic phrases and expressions.',
    emoji: '🌱',
  },
  {
    id: 'A2',
    name: 'A2 - Elementary',
    description: 'Can handle simple everyday situations and basic conversations.',
    emoji: '🌿',
  },
  {
    id: 'B1',
    name: 'B1 - Intermediate',
    description: 'Can discuss familiar topics and handle most travel situations.',
    emoji: '📚',
  },
  {
    id: 'B2',
    name: 'B2 - Upper Intermediate',
    description: 'Can interact fluently and discuss complex topics with confidence.',
    emoji: '🎯',
  },
  {
    id: 'C1',
    name: 'C1 - Advanced',
    description: 'Can express ideas fluently and use language flexibly.',
    emoji: '🚀',
  },
  {
    id: 'C2',
    name: 'C2 - Proficient',
    description: 'Near-native fluency. Can understand virtually everything.',
    emoji: '⭐',
  },
];

const LevelSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!selectedLevel) {
      setError('Please select your level');
      return;
    }

    if (!user) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateUserProfile(user.uid, { level: selectedLevel });

      // Check and award level badges (e.g., if user selects B2, award A2 and B1 badges)
      checkAndAwardBadges(user.uid, 'level_changed').catch((err) => {
        console.warn('[LevelSelect] Error checking badges:', err);
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to save your level');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: gradientBackground,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(16px, 4vw, 24px)',
        paddingTop: 'clamp(24px, 6vw, 48px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: AppColors.surfaceDark,
          borderRadius: 'clamp(16px, 4vw, 24px)',
          padding: 'clamp(24px, 6vw, 40px)',
          border: `1px solid ${AppColors.borderColor}`,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 32px)' }}>
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 56px)',
              marginBottom: 'clamp(8px, 2vw, 12px)',
            }}
          >
            📊
          </div>
          <h1
            style={{
              fontSize: 'clamp(22px, 5.5vw, 28px)',
              fontWeight: 700,
              color: AppColors.textPrimary,
              margin: 0,
            }}
          >
            What's Your English Level?
          </h1>
          <p
            style={{
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              color: AppColors.textSecondary,
              margin: 'clamp(8px, 2vw, 12px) 0 0 0',
            }}
          >
            We'll show you lessons that match your skill level
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: 'clamp(10px, 2.5vw, 14px)',
              background: 'rgba(248, 113, 113, 0.15)',
              border: `1px solid ${AppColors.errorRose}`,
              borderRadius: 'clamp(8px, 2vw, 12px)',
              marginBottom: 'clamp(16px, 4vw, 20px)',
              color: AppColors.errorRose,
              fontSize: 'clamp(13px, 3vw, 14px)',
            }}
          >
            {error}
          </div>
        )}

        {/* Level Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 3vw, 16px)' }}>
          {levels.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => setSelectedLevel(level.id)}
              style={{
                width: '100%',
                padding: 'clamp(16px, 4vw, 20px)',
                background:
                  selectedLevel === level.id ? AppColors.surfaceMedium : AppColors.surfaceLight,
                border: `2px solid ${selectedLevel === level.id ? AppColors.accentPurple : AppColors.borderColor}`,
                borderRadius: 'clamp(12px, 3vw, 16px)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(12px, 3vw, 16px)',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(28px, 7vw, 36px)',
                  flexShrink: 0,
                }}
              >
                {level.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 'clamp(16px, 4vw, 18px)',
                    fontWeight: 600,
                    color:
                      selectedLevel === level.id
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
                    marginBottom: '4px',
                  }}
                >
                  {level.name}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(13px, 3vw, 14px)',
                    color: AppColors.textSecondary,
                    lineHeight: 1.4,
                  }}
                >
                  {level.description}
                </div>
              </div>
              {selectedLevel === level.id && (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: AppColors.accentPurple,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: AppColors.textDark,
                    fontSize: '14px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading || !selectedLevel}
          style={{
            width: '100%',
            height: 'clamp(48px, 12vw, 56px)',
            marginTop: 'clamp(24px, 6vw, 32px)',
            background:
              loading || !selectedLevel
                ? AppColors.surfaceMedium
                : `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
            border: 'none',
            borderRadius: 'clamp(10px, 2.5vw, 12px)',
            color: loading || !selectedLevel ? AppColors.textSecondary : AppColors.textDark,
            fontSize: 'clamp(15px, 3.5vw, 17px)',
            fontWeight: 600,
            cursor: loading || !selectedLevel ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: loading || !selectedLevel ? 0.7 : 1,
          }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default LevelSelectPage;
