/**
 * Learning Settings Card
 * Allows users to configure target language and daily practice goal
 */

import { useState } from 'react';
import { AppColors } from '../../theme/colors';
import { ChevronDownIcon } from '../../theme/icons';
import {
  SUPPORTED_LANGUAGES,
  DAILY_GOAL_OPTIONS,
  DEFAULT_TARGET_LANGUAGE,
  DEFAULT_DAILY_GOAL,
  getLanguageByCode,
  getDailyGoalOption
} from '../../constants/languages';
import { updateUserProfile } from '../../services/firebase/auth';

interface LearningSettingsCardProps {
  userId: string;
  currentLanguage?: string;
  currentGoal?: number;
}

export default function LearningSettingsCard({
  userId,
  currentLanguage,
  currentGoal
}: LearningSettingsCardProps) {
  const [languageOpen, setLanguageOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedLanguage = getLanguageByCode(currentLanguage || DEFAULT_TARGET_LANGUAGE)
    || SUPPORTED_LANGUAGES[0];
  const selectedGoal = getDailyGoalOption(currentGoal || DEFAULT_DAILY_GOAL)
    || DAILY_GOAL_OPTIONS[2];

  const handleLanguageChange = async (code: string) => {
    setLanguageOpen(false);
    if (code === currentLanguage) return;

    setSaving(true);
    try {
      await updateUserProfile(userId, { targetLanguage: code });
    } catch (error) {
      console.error('Error updating language:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleGoalChange = async (minutes: number) => {
    setGoalOpen(false);
    if (minutes === currentGoal) return;

    setSaving(true);
    try {
      await updateUserProfile(userId, { dailyPracticeGoal: minutes });
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      backgroundColor: AppColors.surfaceMedium,
      borderRadius: '20px',
      padding: 'clamp(16px, 4vw, 24px)',
      marginBottom: 'clamp(16px, 4vw, 24px)',
    }}>
      {/* Header */}
      <h3 style={{
        margin: '0 0 clamp(12px, 3vw, 16px) 0',
        fontSize: 'clamp(16px, 4vw, 18px)',
        fontWeight: '700',
        color: AppColors.textPrimary,
      }}>
        Learning Settings
        {saving && (
          <span style={{
            fontSize: '12px',
            fontWeight: '400',
            color: AppColors.textSecondary,
            marginLeft: '8px'
          }}>
            Saving...
          </span>
        )}
      </h3>

      {/* Target Language */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: AppColors.textSecondary,
          marginBottom: '8px',
        }}>
          Target Language
        </label>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setLanguageOpen(!languageOpen); setGoalOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${AppColors.borderColor}`,
              backgroundColor: AppColors.bgSecondary,
              color: AppColors.textPrimary,
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              cursor: 'pointer',
            }}
          >
            <span>
              {selectedLanguage.flag} {selectedLanguage.name}
            </span>
            <ChevronDownIcon size={20} />
          </button>

          {languageOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: AppColors.bgSecondary,
              borderRadius: '12px',
              border: `1px solid ${AppColors.borderColor}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              zIndex: 100,
              maxHeight: '240px',
              overflowY: 'auto',
            }}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: lang.code === selectedLanguage.code
                      ? 'rgba(139, 92, 246, 0.2)'
                      : 'transparent',
                    color: AppColors.textPrimary,
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Practice Goal */}
      <div>
        <label style={{
          display: 'block',
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: AppColors.textSecondary,
          marginBottom: '8px',
        }}>
          Daily Practice Goal
        </label>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setGoalOpen(!goalOpen); setLanguageOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${AppColors.borderColor}`,
              backgroundColor: AppColors.bgSecondary,
              color: AppColors.textPrimary,
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              cursor: 'pointer',
            }}
          >
            <span>
              {selectedGoal.minutes} minutes ({selectedGoal.label})
            </span>
            <ChevronDownIcon size={20} />
          </button>

          {goalOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: AppColors.bgSecondary,
              borderRadius: '12px',
              border: `1px solid ${AppColors.borderColor}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              zIndex: 100,
            }}>
              {DAILY_GOAL_OPTIONS.map((option) => (
                <button
                  key={option.minutes}
                  onClick={() => handleGoalChange(option.minutes)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: option.minutes === selectedGoal.minutes
                      ? 'rgba(139, 92, 246, 0.2)'
                      : 'transparent',
                    color: AppColors.textPrimary,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
                    {option.minutes} minutes
                    {option.minutes === 15 && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        color: AppColors.successGreen
                      }}>
                        Recommended
                      </span>
                    )}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: AppColors.textSecondary
                  }}>
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
