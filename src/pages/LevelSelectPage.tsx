import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../services/firebase/auth';
import { checkAndAwardBadges } from '../services/firebase/badges';
import { ProficiencyLevel } from '../types/firestore';
import {
  SUPPORTED_LANGUAGES,
  DAILY_GOAL_OPTIONS,
  DEFAULT_TARGET_LANGUAGE,
  DEFAULT_DAILY_GOAL,
} from '../constants/languages';
import { DEFAULT_VOICE } from '../constants/voices';
import { VoiceSelector } from '../components/voice';

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

// Onboarding steps
type OnboardingStep = 'level' | 'language' | 'goal' | 'voice';

const LevelSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Step tracking
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('level');

  // Selections
  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(DEFAULT_TARGET_LANGUAGE);
  const [selectedGoal, setSelectedGoal] = useState<number>(DEFAULT_DAILY_GOAL);
  const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_VOICE);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (currentStep === 'level') {
      if (!selectedLevel) {
        setError('Please select your level');
        return;
      }
      setError('');
      setCurrentStep('language');
    } else if (currentStep === 'language') {
      setCurrentStep('goal');
    } else if (currentStep === 'goal') {
      setCurrentStep('voice');
    }
  };

  const handleBack = () => {
    if (currentStep === 'language') {
      setCurrentStep('level');
    } else if (currentStep === 'goal') {
      setCurrentStep('language');
    } else if (currentStep === 'voice') {
      setCurrentStep('goal');
    }
  };

  const handleComplete = async () => {
    if (!selectedLevel) {
      setError('Please select your level');
      setCurrentStep('level');
      return;
    }

    if (!user) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save all onboarding settings in one Firestore call
      await updateUserProfile(user.uid, {
        level: selectedLevel,
        targetLanguage: selectedLanguage,
        dailyPracticeGoal: selectedGoal,
        preferredVoice: selectedVoice,
      });

      // Check and award level badges
      checkAndAwardBadges(user.uid, 'level_changed').catch((err) => {
        console.warn('[LevelSelect] Error checking badges:', err);
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to save your settings');
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator
  const steps = ['level', 'language', 'goal', 'voice'] as const;
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: AppColors.bgPrimary,
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
        {/* Progress Dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: 'clamp(20px, 5vw, 28px)',
        }}>
          {steps.map((step, index) => (
            <div
              key={step}
              style={{
                width: index <= currentStepIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: index <= currentStepIndex
                  ? `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`
                  : AppColors.borderColor,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
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

        {/* Step 1: Level Selection */}
        {currentStep === 'level' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 32px)' }}>
              <div style={{ fontSize: 'clamp(40px, 10vw, 56px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>
                📊
              </div>
              <h1 style={{
                fontSize: 'clamp(22px, 5.5vw, 28px)',
                fontWeight: 700,
                color: AppColors.textPrimary,
                margin: 0,
              }}>
                What's Your English Level?
              </h1>
              <p style={{
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                color: AppColors.textSecondary,
                margin: 'clamp(8px, 2vw, 12px) 0 0 0',
              }}>
                We'll show you lessons that match your skill
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.5vw, 12px)' }}>
              {levels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSelectedLevel(level.id)}
                  style={{
                    width: '100%',
                    padding: 'clamp(14px, 3.5vw, 18px)',
                    background: selectedLevel === level.id ? AppColors.surfaceMedium : AppColors.surfaceLight,
                    border: `2px solid ${selectedLevel === level.id ? AppColors.accentPurple : AppColors.borderColor}`,
                    borderRadius: 'clamp(12px, 3vw, 16px)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(12px, 3vw, 16px)',
                  }}
                >
                  <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', flexShrink: 0 }}>
                    {level.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 'clamp(15px, 3.5vw, 17px)',
                      fontWeight: 600,
                      color: selectedLevel === level.id ? AppColors.textPrimary : AppColors.textSecondary,
                      marginBottom: '2px',
                    }}>
                      {level.name}
                    </div>
                    <div style={{
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      color: AppColors.textSecondary,
                      lineHeight: 1.3,
                    }}>
                      {level.description}
                    </div>
                  </div>
                  {selectedLevel === level.id && (
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: AppColors.accentPurple,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: AppColors.textDark,
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={!selectedLevel}
              style={{
                width: '100%',
                height: 'clamp(48px, 12vw, 56px)',
                marginTop: 'clamp(24px, 6vw, 32px)',
                background: !selectedLevel
                  ? AppColors.surfaceMedium
                  : `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                border: 'none',
                borderRadius: 'clamp(10px, 2.5vw, 12px)',
                color: !selectedLevel ? AppColors.textSecondary : AppColors.textDark,
                fontSize: 'clamp(15px, 3.5vw, 17px)',
                fontWeight: 600,
                cursor: !selectedLevel ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: !selectedLevel ? 0.7 : 1,
              }}
            >
              Continue
            </button>
          </>
        )}

        {/* Step 2: Native Language Selection */}
        {currentStep === 'language' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 32px)' }}>
              <div style={{ fontSize: 'clamp(40px, 10vw, 56px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>
                🌍
              </div>
              <h1 style={{
                fontSize: 'clamp(22px, 5.5vw, 28px)',
                fontWeight: 700,
                color: AppColors.textPrimary,
                margin: 0,
              }}>
                What's Your Native Language?
              </h1>
              <p style={{
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                color: AppColors.textSecondary,
                margin: 'clamp(8px, 2vw, 12px) 0 0 0',
              }}>
                We'll tailor explanations to help you learn
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'clamp(10px, 2.5vw, 12px)',
            }}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  style={{
                    padding: 'clamp(14px, 3.5vw, 18px)',
                    background: selectedLanguage === lang.code ? AppColors.surfaceMedium : AppColors.surfaceLight,
                    border: `2px solid ${selectedLanguage === lang.code ? AppColors.accentPurple : AppColors.borderColor}`,
                    borderRadius: 'clamp(12px, 3vw, 16px)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 'clamp(28px, 7vw, 36px)', marginBottom: '6px' }}>
                    {lang.flag}
                  </div>
                  <div style={{
                    fontSize: 'clamp(14px, 3.5vw, 15px)',
                    fontWeight: 600,
                    color: selectedLanguage === lang.code ? AppColors.textPrimary : AppColors.textSecondary,
                  }}>
                    {lang.name}
                  </div>
                </button>
              ))}
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: 'clamp(24px, 6vw, 32px)',
            }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  flex: 1,
                  height: 'clamp(48px, 12vw, 56px)',
                  background: AppColors.surfaceLight,
                  border: `1px solid ${AppColors.borderColor}`,
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  color: AppColors.textSecondary,
                  fontSize: 'clamp(15px, 3.5vw, 17px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                style={{
                  flex: 2,
                  height: 'clamp(48px, 12vw, 56px)',
                  background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                  border: 'none',
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  color: AppColors.textDark,
                  fontSize: 'clamp(15px, 3.5vw, 17px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 3: Daily Goal Selection */}
        {currentStep === 'goal' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 32px)' }}>
              <div style={{ fontSize: 'clamp(40px, 10vw, 56px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>
                🎯
              </div>
              <h1 style={{
                fontSize: 'clamp(22px, 5.5vw, 28px)',
                fontWeight: 700,
                color: AppColors.textPrimary,
                margin: 0,
              }}>
                Set Your Daily Goal
              </h1>
              <p style={{
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                color: AppColors.textSecondary,
                margin: 'clamp(8px, 2vw, 12px) 0 0 0',
              }}>
                Consistency is key to learning a language
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.5vw, 12px)' }}>
              {DAILY_GOAL_OPTIONS.map((option) => (
                <button
                  key={option.minutes}
                  type="button"
                  onClick={() => setSelectedGoal(option.minutes)}
                  style={{
                    width: '100%',
                    padding: 'clamp(16px, 4vw, 20px)',
                    background: selectedGoal === option.minutes ? AppColors.surfaceMedium : AppColors.surfaceLight,
                    border: `2px solid ${selectedGoal === option.minutes ? AppColors.accentPurple : AppColors.borderColor}`,
                    borderRadius: 'clamp(12px, 3vw, 16px)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: selectedGoal === option.minutes
                        ? `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`
                        : AppColors.bgSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(16px, 4vw, 18px)',
                      fontWeight: 700,
                      color: selectedGoal === option.minutes ? AppColors.textDark : AppColors.textSecondary,
                    }}>
                      {option.minutes}
                    </div>
                    <div>
                      <div style={{
                        fontSize: 'clamp(15px, 3.5vw, 17px)',
                        fontWeight: 600,
                        color: selectedGoal === option.minutes ? AppColors.textPrimary : AppColors.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        {option.minutes} minutes / day
                        {option.minutes === 15 && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: AppColors.successGreen,
                            background: 'rgba(34, 197, 94, 0.15)',
                            padding: '2px 8px',
                            borderRadius: '10px',
                          }}>
                            Recommended
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 'clamp(12px, 2.5vw, 13px)',
                        color: AppColors.textSecondary,
                        marginTop: '2px',
                      }}>
                        {option.description}
                      </div>
                    </div>
                  </div>
                  {selectedGoal === option.minutes && (
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: AppColors.accentPurple,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: AppColors.textDark,
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: 'clamp(24px, 6vw, 32px)',
            }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  flex: 1,
                  height: 'clamp(48px, 12vw, 56px)',
                  background: AppColors.surfaceLight,
                  border: `1px solid ${AppColors.borderColor}`,
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  color: AppColors.textSecondary,
                  fontSize: 'clamp(15px, 3.5vw, 17px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                style={{
                  flex: 2,
                  height: 'clamp(48px, 12vw, 56px)',
                  background: `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                  border: 'none',
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  color: AppColors.textDark,
                  fontSize: 'clamp(15px, 3.5vw, 17px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 4: Voice Selection */}
        {currentStep === 'voice' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 32px)' }}>
              <div style={{ fontSize: 'clamp(40px, 10vw, 56px)', marginBottom: 'clamp(8px, 2vw, 12px)' }}>
                🎤
              </div>
              <h1 style={{
                fontSize: 'clamp(22px, 5.5vw, 28px)',
                fontWeight: 700,
                color: AppColors.textPrimary,
                margin: 0,
              }}>
                Choose Your Tutor's Voice
              </h1>
              <p style={{
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                color: AppColors.textSecondary,
                margin: 'clamp(8px, 2vw, 12px) 0 0 0',
              }}>
                Find a voice you'll enjoy learning with
              </p>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '8px' }}>
              <VoiceSelector
                selectedVoice={selectedVoice}
                onVoiceSelect={setSelectedVoice}
                showHint
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: 'clamp(24px, 6vw, 32px)',
            }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  flex: 1,
                  height: 'clamp(48px, 12vw, 56px)',
                  background: AppColors.surfaceLight,
                  border: `1px solid ${AppColors.borderColor}`,
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  color: AppColors.textSecondary,
                  fontSize: 'clamp(15px, 3.5vw, 17px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                style={{
                  flex: 2,
                  height: 'clamp(48px, 12vw, 56px)',
                  background: loading
                    ? AppColors.surfaceMedium
                    : `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
                  border: 'none',
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  color: loading ? AppColors.textSecondary : AppColors.textDark,
                  fontSize: 'clamp(15px, 3.5vw, 17px)',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Saving...' : 'Start Learning'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LevelSelectPage;
