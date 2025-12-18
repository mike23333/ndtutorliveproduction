/**
 * ChatBubble Component
 * Displays a single chat message with user/AI styling and action buttons
 */

import React from 'react';
import { AppColors } from '../../theme/colors';
import { LanguagesIcon, RotateCcwIcon } from '../../theme/icons';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  isWhisper: boolean;
  translation?: string;
  audioData?: string; // base64 encoded audio for replay
  onTranslate: () => void;
  onReplay: () => void;
  /** MED-003: Native language for whisper mode display */
  nativeLanguage?: string;
  /** Whether to show the translate button (controlled by teacher setting) */
  showTranslateButton?: boolean;
  /** Whether translation is currently loading */
  isTranslating?: boolean;
}

const iconButtonStyle: React.CSSProperties = {
  padding: '6px',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: 'rgba(30, 27, 75, 0.2)',
  color: AppColors.textDark,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const iconButtonStyleLight: React.CSSProperties = {
  padding: '6px',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: 'transparent',
  color: AppColors.accentPurple,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser,
  isWhisper,
  translation,
  audioData,
  onTranslate,
  onReplay,
  nativeLanguage = 'Ukrainian',
  showTranslateButton = true,
  isTranslating = false,
}) => {
  const hasAudio = Boolean(audioData);
  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div style={{
          background: isWhisper
            ? `linear-gradient(135deg, ${AppColors.whisperAmber} 0%, #f59e0b 100%)`
            : `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`,
          color: AppColors.textDark,
          padding: '12px 16px',
          borderRadius: '20px 20px 4px 20px',
          maxWidth: '80%',
          fontSize: '15px',
          lineHeight: '1.5',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {isWhisper && (
            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
              Asked in {nativeLanguage}
            </div>
          )}
          <p style={{ margin: 0 }}>{message}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={hasAudio ? onReplay : undefined}
              style={{
                ...iconButtonStyle,
                opacity: hasAudio ? 1 : 0.3,
                cursor: hasAudio ? 'pointer' : 'not-allowed',
              }}
              disabled={!hasAudio}
              title={hasAudio ? 'Replay' : 'No audio available'}
            >
              <RotateCcwIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
      <div style={{
        backgroundColor: isWhisper ? 'rgba(251, 191, 36, 0.15)' : AppColors.surfaceMedium,
        borderLeft: `3px solid ${isWhisper ? AppColors.whisperAmber : AppColors.accentPurple}`,
        color: AppColors.textPrimary,
        padding: '12px 16px',
        borderRadius: '4px 20px 20px 20px',
        maxWidth: '80%',
        fontSize: '15px',
        lineHeight: '1.5',
        backdropFilter: 'blur(8px)',
      }}>
        {isWhisper && (
          <div style={{
            fontSize: '11px',
            color: AppColors.whisperAmber,
            marginBottom: '6px',
            fontWeight: '500'
          }}>
            Tutor Mode
          </div>
        )}
        <p style={{ margin: 0 }}>{message}</p>
        {translation && (
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '13px',
            opacity: 0.8,
            fontStyle: 'italic',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '8px'
          }}>
            {translation}
          </p>
        )}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {showTranslateButton && (
            <button
              onClick={onTranslate}
              style={{
                ...iconButtonStyleLight,
                opacity: isTranslating ? 0.5 : 1,
                cursor: isTranslating ? 'wait' : 'pointer',
              }}
              disabled={isTranslating}
              title={isTranslating ? 'Translating...' : 'Translate'}
            >
              {isTranslating ? (
                <span style={{ fontSize: '12px' }}>...</span>
              ) : (
                <LanguagesIcon size={16} />
              )}
            </button>
          )}
          <button
            onClick={hasAudio ? onReplay : undefined}
            style={{
              ...iconButtonStyleLight,
              opacity: hasAudio ? 1 : 0.3,
              cursor: hasAudio ? 'pointer' : 'not-allowed',
            }}
            disabled={!hasAudio}
            title={hasAudio ? 'Replay' : 'No audio available'}
          >
            <RotateCcwIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
