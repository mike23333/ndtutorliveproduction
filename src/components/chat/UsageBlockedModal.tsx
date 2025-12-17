/**
 * Usage Blocked Modal Component
 *
 * Full-screen modal shown when user has exhausted their weekly quota.
 * Professional design with clear messaging and action button.
 */

import React from 'react';
import { AppColors, radius, typography } from '../../theme/colors';

interface UsageBlockedModalProps {
  /** Message to display (e.g., "Weekly limit reached...") */
  message: string;
  /** Callback when user clicks "Go Back" */
  onGoBack: () => void;
}

export const UsageBlockedModal: React.FC<UsageBlockedModalProps> = ({
  message,
  onGoBack,
}) => {
  return (
    <>
      <style>
        {`
          @keyframes usageModalFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes usageModalScaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 2000,
          animation: 'usageModalFadeIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            background: AppColors.bgSecondary,
            borderRadius: radius.xxl,
            padding: '32px 24px',
            maxWidth: '340px',
            width: '100%',
            textAlign: 'center',
            border: `1px solid ${AppColors.borderColor}`,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            animation: 'usageModalScaleIn 0.3s ease-out',
          }}
        >
          {/* Clock Icon */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: AppColors.warningMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke={AppColors.warning}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <h2
            style={{
              margin: '0 0 12px 0',
              fontSize: typography.lg,
              fontWeight: 700,
              color: AppColors.textPrimary,
            }}
          >
            Weekly Limit Reached
          </h2>

          <p
            style={{
              margin: '0 0 24px 0',
              fontSize: typography.sm,
              color: AppColors.textSecondary,
              lineHeight: 1.6,
            }}
          >
            {message}
          </p>

          <button
            onClick={onGoBack}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: radius.md,
              border: 'none',
              background: AppColors.accent,
              color: AppColors.textDark,
              fontSize: typography.md,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(216, 180, 254, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Go Back
          </button>

          <p
            style={{
              margin: '16px 0 0 0',
              fontSize: typography.xs,
              color: AppColors.textMuted,
            }}
          >
            Contact your teacher to upgrade your plan
          </p>
        </div>
      </div>
    </>
  );
};

export default UsageBlockedModal;
