import React, { useState } from 'react';
import { AppColors } from '../../theme/colors';
import { XIcon, ClockIcon } from '../../theme/icons';

interface PronunciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (words: string) => void;
}

export const PronunciationModal: React.FC<PronunciationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [words, setWords] = useState('');

  const handleSubmit = () => {
    if (!words.trim()) return;
    onSubmit(words.trim());
    setWords('');
    onClose();
  };

  const isValid = words.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 'clamp(16px, 4vw, 24px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: AppColors.surfaceDark,
          borderRadius: '20px',
          width: '100%',
          maxWidth: '420px',
          padding: 'clamp(20px, 5vw, 28px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'clamp(16px, 4vw, 24px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: 'clamp(24px, 6vw, 28px)' }}>🎯</span>
            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(18px, 4.5vw, 22px)',
                fontWeight: 700,
                color: AppColors.textPrimary,
              }}
            >
              Pronunciation Coach
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: AppColors.textSecondary,
            }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 3.5vw, 18px)' }}>
          {/* Words input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontWeight: 500,
                color: AppColors.textSecondary,
                marginBottom: 'clamp(4px, 1vw, 6px)',
              }}
            >
              What words or phrases do you want to practice?
            </label>
            <input
              type="text"
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="e.g., comfortable, I'd like to order, pronunciation"
              style={{
                width: '100%',
                padding: 'clamp(10px, 2.5vw, 14px)',
                borderRadius: '12px',
                border: `1px solid ${AppColors.borderColor}`,
                backgroundColor: AppColors.surfaceMedium,
                color: AppColors.textPrimary,
                fontSize: 'clamp(14px, 3vw, 16px)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValid) {
                  handleSubmit();
                }
              }}
            />
            <p
              style={{
                margin: 'clamp(4px, 1vw, 6px) 0 0 0',
                fontSize: 'clamp(11px, 2.2vw, 12px)',
                color: AppColors.textSecondary,
              }}
            >
              Enter words or phrases separated by commas
            </p>
          </div>

          {/* Duration Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: 'clamp(10px, 2.5vw, 14px)',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            }}
          >
            <ClockIcon size={18} />
            <span
              style={{
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                color: AppColors.textSecondary,
              }}
            >
              <strong style={{ color: AppColors.textPrimary }}>2 minute</strong> quick practice
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(10px, 2.5vw, 14px)',
            marginTop: 'clamp(20px, 5vw, 28px)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 'clamp(12px, 3vw, 16px)',
              borderRadius: '12px',
              border: `1px solid ${AppColors.borderColor}`,
              backgroundColor: 'transparent',
              color: AppColors.textSecondary,
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            style={{
              flex: 1,
              padding: 'clamp(12px, 3vw, 16px)',
              borderRadius: '12px',
              border: 'none',
              background: isValid
                ? `linear-gradient(135deg, ${AppColors.accentBlue} 0%, #3b82f6 100%)`
                : AppColors.surfaceMedium,
              color: isValid ? AppColors.textDark : AppColors.textSecondary,
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: 600,
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: isValid ? 1 : 0.6,
            }}
          >
            Start Lesson
          </button>
        </div>
      </div>
    </div>
  );
};
