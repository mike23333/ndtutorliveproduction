/**
 * Subscription Card Component
 *
 * Displays subscription plan info, weekly usage progress, and time remaining.
 * Used on the student profile page.
 */

import React from 'react';
import { AppColors, radius, typography } from '../../theme/colors';
import { getUsageStats } from '../../services/firebase/subscriptionUsage';
import { formatTimeRemaining } from '../../constants/subscriptionPlans';
import type { UserDocument } from '../../types/firestore';

interface SubscriptionCardProps {
  userDocument: UserDocument | null;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ userDocument }) => {
  const stats = getUsageStats(userDocument);
  const { plan, usedSeconds, remainingSeconds, percentUsed, isUnlimited, isAtLimit } = stats;

  const progressWidth = isUnlimited ? 0 : Math.min(percentUsed * 100, 100);

  // Color for progress bar based on usage
  const getProgressColor = () => {
    if (isAtLimit) return AppColors.error;
    if (progressWidth > 90) return AppColors.error;
    if (progressWidth > 75) return AppColors.warning;
    return plan.color;
  };

  return (
    <div
      style={{
        backgroundColor: AppColors.surface10,
        borderRadius: radius.xl,
        padding: '20px',
        marginBottom: '20px',
        border: `1px solid ${AppColors.borderColor}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: typography.md,
            fontWeight: 700,
            color: AppColors.textPrimary,
          }}
        >
          Subscription
        </h3>
        <span
          style={{
            padding: '6px 14px',
            borderRadius: radius.full,
            background: `${plan.color}20`,
            color: plan.color,
            fontSize: typography.sm,
            fontWeight: 600,
          }}
        >
          {plan.name}
        </span>
      </div>

      {/* Usage Info for non-unlimited plans */}
      {!isUnlimited && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: typography.sm,
            }}
          >
            <span style={{ color: AppColors.textSecondary }}>This week</span>
            <span style={{ color: AppColors.textPrimary, fontWeight: 500 }}>
              {formatTimeRemaining(usedSeconds)} / {formatTimeRemaining(plan.weeklyLimitSeconds)}
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: '8px',
              borderRadius: '4px',
              backgroundColor: AppColors.surface05,
              overflow: 'hidden',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressWidth}%`,
                borderRadius: '4px',
                background: getProgressColor(),
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: typography.xs,
              color: isAtLimit ? AppColors.error : AppColors.textSecondary,
            }}
          >
            {/* Clock icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {isAtLimit ? (
              <span>Weekly limit reached - Resets Monday</span>
            ) : (
              <span>{formatTimeRemaining(remainingSeconds)} remaining - Resets Monday</span>
            )}
          </div>
        </>
      )}

      {/* Unlimited plan display */}
      {isUnlimited && (
        <div
          style={{
            padding: '16px',
            borderRadius: radius.md,
            background: `${plan.color}10`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            {/* Infinity icon */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `${plan.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={plan.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: typography.sm,
                  fontWeight: 600,
                  color: AppColors.textPrimary,
                  marginBottom: '2px',
                }}
              >
                Unlimited Practice
              </div>
              <div style={{ fontSize: typography.xs, color: AppColors.textSecondary }}>
                No weekly time limits
              </div>
            </div>
          </div>
          {/* Usage this week */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '12px',
              borderTop: `1px solid ${plan.color}20`,
              fontSize: typography.xs,
              color: AppColors.textSecondary,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTimeRemaining(usedSeconds)} practiced this week</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionCard;
