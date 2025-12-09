/**
 * Badge Grid Component
 * Displays badges grouped by category
 */

import { BadgeIcon } from './BadgeIcon';
import { CATEGORY_INFO } from '../../services/firebase/badges';
import { AppColors } from '../../theme/colors';
import type { BadgeProgress, BadgeCategory } from '../../types/badges';
import { LEVEL_ORDER } from '../../types/badges';
import type { ProficiencyLevel } from '../../types/firestore';

/**
 * Format progress display for level badges
 * Shows level names (A1 → A2) instead of numbers (1/2)
 */
const formatLevelProgress = (progress: number, target: number): string => {
  // progress and target are 1-indexed (1 = A1, 2 = A2, etc.)
  const currentLevel = progress > 0 ? LEVEL_ORDER[progress - 1] : 'Start';
  const targetLevel = LEVEL_ORDER[target - 1] as ProficiencyLevel;
  return `${currentLevel} → ${targetLevel}`;
};

interface BadgeGridProps {
  badgesByCategory: Record<BadgeCategory, BadgeProgress[]>;
  onBadgeClick?: (badge: BadgeProgress) => void;
}

// Category order for display
const CATEGORY_ORDER: BadgeCategory[] = ['consistency', 'excellence', 'time', 'explorer', 'level'];

export function BadgeGrid({ badgesByCategory, onBadgeClick }: BadgeGridProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {CATEGORY_ORDER.map((category) => {
        const badges = badgesByCategory[category];
        const info = CATEGORY_INFO[category];
        const earnedCount = badges.filter((b) => b.earned).length;

        return (
          <div key={category}>
            {/* Category Header */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: 'clamp(16px, 4vw, 18px)',
                  fontWeight: '600',
                  color: AppColors.textPrimary,
                  textTransform: 'capitalize',
                }}>
                  {info.name}
                </h3>
                <span style={{
                  fontSize: 'clamp(12px, 3vw, 14px)',
                  color: AppColors.textSecondary,
                }}>
                  {earnedCount}/{badges.length}
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: 'clamp(12px, 3vw, 14px)',
                color: AppColors.textSecondary,
              }}>
                {info.description}
              </p>
            </div>

            {/* Badge Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'clamp(12px, 3vw, 16px)',
            }}>
              {badges.map((badgeProgress) => (
                <button
                  key={badgeProgress.badge.id}
                  onClick={() => onBadgeClick?.(badgeProgress)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <BadgeIcon
                    iconName={badgeProgress.badge.iconName}
                    category={badgeProgress.badge.category}
                    size="md"
                    earned={badgeProgress.earned}
                  />
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <p style={{
                      margin: 0,
                      fontSize: 'clamp(10px, 2.5vw, 12px)',
                      fontWeight: '500',
                      color: badgeProgress.earned ? AppColors.textPrimary : AppColors.textSecondary,
                      lineHeight: 1.2,
                      wordBreak: 'break-word',
                    }}>
                      {badgeProgress.badge.name}
                    </p>
                    {!badgeProgress.earned && badgeProgress.progressPercent !== undefined && (
                      <div style={{
                        marginTop: '6px',
                        width: '100%',
                        height: '3px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}>
                        <div
                          style={{
                            width: `${badgeProgress.progressPercent}%`,
                            height: '100%',
                            backgroundColor: AppColors.accentPurple,
                            borderRadius: '2px',
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== Badge Detail Modal ====================

interface BadgeDetailProps {
  badgeProgress: BadgeProgress | null;
  onClose: () => void;
}

export function BadgeDetail({ badgeProgress, onClose }: BadgeDetailProps) {
  if (!badgeProgress) return null;

  const { badge, earned, earnedAt, progress, target, progressPercent } = badgeProgress;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: AppColors.surfaceDark,
        borderRadius: '20px',
        maxWidth: '360px',
        width: '100%',
        padding: '24px',
        position: 'relative',
        border: `1px solid ${AppColors.borderColor}`,
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: AppColors.textSecondary,
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Badge Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <BadgeIcon
            iconName={badge.iconName}
            category={badge.category}
            size="xl"
            earned={earned}
          />
        </div>

        {/* Badge Info */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: earned ? AppColors.textPrimary : AppColors.textSecondary,
          }}>
            {badge.name}
          </h3>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: AppColors.textSecondary,
          }}>
            {badge.description}
          </p>

          {/* Earned date or progress */}
          {earned && earnedAt ? (
            <p style={{
              margin: '16px 0 0 0',
              fontSize: '14px',
              color: AppColors.successGreen,
            }}>
              Earned on {earnedAt.toLocaleDateString()}
            </p>
          ) : (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
                color: AppColors.textSecondary,
                marginBottom: '8px',
              }}>
                <span>Progress</span>
                <span>
                  {badge.criteria.type === 'level_reached'
                    ? formatLevelProgress(progress || 0, target || 1)
                    : `${progress}/${target}`}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    backgroundColor: AppColors.accentPurple,
                    borderRadius: '4px',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '24px',
            padding: '12px 16px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '12px',
            color: AppColors.textPrimary,
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default BadgeGrid;
