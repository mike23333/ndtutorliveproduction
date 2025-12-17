/**
 * Usage Warning Banner Component
 *
 * Shows when user has 10% or less of weekly quota remaining.
 * Professional, non-disruptive design - slides down from top.
 */

import React from 'react';
import { AppColors, radius } from '../../theme/colors';
import { formatTimeShort } from '../../constants/subscriptionPlans';

interface UsageWarningBannerProps {
  /** Seconds remaining in weekly quota */
  remainingSeconds: number;
  /** Plan name (Starter, Plus, etc.) */
  planName: string;
  /** Callback to dismiss the banner */
  onDismiss: () => void;
}

export const UsageWarningBanner: React.FC<UsageWarningBannerProps> = ({
  remainingSeconds,
  planName,
  onDismiss,
}) => {
  const timeRemaining = formatTimeShort(remainingSeconds);

  return (
    <>
      <style>
        {`
          @keyframes usageBannerSlideDown {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top, 0)',
          left: 0,
          right: 0,
          padding: '12px 16px',
          background: `linear-gradient(135deg, ${AppColors.warningMuted} 0%, rgba(251, 191, 36, 0.08) 100%)`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid rgba(251, 191, 36, 0.25)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          zIndex: 1000,
          animation: 'usageBannerSlideDown 0.3s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Clock icon */}
          <svg
            width="20"
            height="20"
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

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: AppColors.warning,
              }}
            >
              ~{timeRemaining} remaining this week
            </div>
            <div
              style={{
                fontSize: '12px',
                color: AppColors.textSecondary,
                opacity: 0.8,
              }}
            >
              {planName} plan - Resets Monday
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: AppColors.textSecondary,
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px',
            opacity: 0.7,
            borderRadius: radius.sm,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          aria-label="Dismiss warning"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default UsageWarningBanner;
