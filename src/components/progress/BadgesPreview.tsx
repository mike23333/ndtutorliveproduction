/**
 * Badges Preview
 * Shows 4 most recent badges with link to full collection
 */

import { useNavigate } from 'react-router-dom';
import { AppColors } from '../../theme/colors';
import { ChevronRightIcon } from '../../theme/icons';
import { useRecentBadges, useBadgeProgress } from '../../hooks/useBadges';
import { BadgeIcon } from '../badges';

interface BadgesPreviewProps {
  userId: string | undefined;
}

export default function BadgesPreview({ userId }: BadgesPreviewProps) {
  const navigate = useNavigate();
  const { recentBadges, loading } = useRecentBadges(userId, 4);
  const { earnedBadges, totalBadges } = useBadgeProgress(userId);

  return (
    <div style={{
      backgroundColor: AppColors.surfaceMedium,
      borderRadius: '20px',
      padding: 'clamp(16px, 4vw, 24px)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: 'clamp(16px, 4vw, 18px)',
          fontWeight: '700',
          color: AppColors.textPrimary,
        }}>
          Achievements
        </h3>
        <button
          onClick={() => navigate('/badges')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '16px',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: AppColors.accentPurple,
            fontSize: 'clamp(12px, 3vw, 14px)',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          {earnedBadges} of {totalBadges}
          <ChevronRightIcon size={16} />
        </button>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          color: AppColors.textSecondary,
          padding: '20px',
          fontSize: '14px',
        }}>
          Loading...
        </div>
      ) : recentBadges.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'clamp(8px, 2vw, 12px)',
        }}>
          {recentBadges.map((userBadge) => (
            <div
              key={userBadge.badgeId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <BadgeIcon
                iconName={userBadge.iconName}
                category={userBadge.category}
                size="md"
                earned={true}
              />
              <span style={{
                fontSize: 'clamp(9px, 2.2vw, 11px)',
                color: AppColors.textSecondary,
                textAlign: 'center',
                lineHeight: 1.2,
              }}>
                {userBadge.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          color: AppColors.textSecondary,
          padding: '20px',
          fontSize: '14px',
        }}>
          Complete lessons to earn badges!
        </div>
      )}
    </div>
  );
}
