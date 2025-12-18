/**
 * Learning Settings Card
 * Allows users to configure target language, daily practice goal, and tutor voice
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
import {
  AVAILABLE_VOICES,
  DEFAULT_VOICE,
  getVoiceById,
} from '../../constants/voices';
import { VoiceSelector } from '../voice';
import { updateUserProfile } from '../../services/firebase/auth';

interface LearningSettingsCardProps {
  userId: string;
  currentLanguage?: string;
  currentGoal?: number;
  currentVoice?: string;
}

export default function LearningSettingsCard({
  userId,
  currentLanguage,
  currentGoal,
  currentVoice
}: LearningSettingsCardProps) {
  const [languageOpen, setLanguageOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedLanguage = getLanguageByCode(currentLanguage || DEFAULT_TARGET_LANGUAGE)
    || SUPPORTED_LANGUAGES[0];
  const selectedGoal = getDailyGoalOption(currentGoal || DEFAULT_DAILY_GOAL)
    || DAILY_GOAL_OPTIONS[2];
  const selectedVoice = getVoiceById(currentVoice || DEFAULT_VOICE)
    || AVAILABLE_VOICES[4]; // Aoede is at index 4

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

  const handleVoiceChange = async (voiceId: string) => {
    setVoiceOpen(false);
    if (voiceId === currentVoice) return;

    setSaving(true);
    try {
      await updateUserProfile(userId, { preferredVoice: voiceId });
    } catch (error) {
      console.error('Error updating voice:', error);
    } finally {
      setSaving(false);
    }
  };

  const closeAllDropdowns = () => {
    setLanguageOpen(false);
    setGoalOpen(false);
    setVoiceOpen(false);
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
            onClick={() => { closeAllDropdowns(); setLanguageOpen(!languageOpen); }}
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
            onClick={() => { closeAllDropdowns(); setGoalOpen(!goalOpen); }}
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

      {/* Tutor Voice */}
      <div style={{ marginTop: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: AppColors.textSecondary,
          marginBottom: '8px',
        }}>
          Tutor Voice
        </label>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { closeAllDropdowns(); setVoiceOpen(!voiceOpen); }}
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🎤</span>
              <span>{selectedVoice.name}</span>
              <span style={{ color: AppColors.textSecondary, fontSize: '13px' }}>
                - {selectedVoice.description}
              </span>
            </span>
            <ChevronDownIcon size={20} />
          </button>

          {voiceOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: AppColors.bgSecondary,
              borderRadius: '16px',
              border: `1px solid ${AppColors.borderColor}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              zIndex: 100,
              padding: '16px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: AppColors.textPrimary,
                marginBottom: '12px',
              }}>
                Choose a voice
              </div>
              <VoiceSelector
                selectedVoice={currentVoice || DEFAULT_VOICE}
                onVoiceSelect={handleVoiceChange}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
