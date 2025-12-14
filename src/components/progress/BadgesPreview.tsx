/**
 * Badges Preview - Redesigned
 * Elegant badge showcase with glass-morphic cards
 * Premium visual treatment for achievements
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

  const progressPercent = totalBadges > 0 ? (earnedBadges / totalBadges) * 100 : 0;

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes badge-shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
        .badge-item:hover .badge-shine {
          animation: badge-shine 0.6s ease-out;
        }
        .badge-item {
          transition: transform 0.2s ease;
        }
        .badge-item:hover {
          transform: translateY(-4px);
        }
        .view-all-btn {
          transition: all 0.2s ease;
        }
        .view-all-btn:hover {
          background-color: rgba(255, 255, 255, 0.12) !important;
          transform: translateX(2px);
        }
      `}</style>

      {/* Decorative gradient */}
      <div style={{
        position: 'absolute',
        top: '-30%',
        right: '-20%',
        width: '200px',
        height: '200px',
        background: `radial-gradient(circle, ${AppColors.whisperAmber}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '20px' }}>🏆</span>
          <h3 style={{
            margin: 0,
            fontSize: '17px',
            fontWeight: '600',
            color: AppColors.textPrimary,
          }}>
            Achievements
          </h3>
        </div>

        <button
          className="view-all-btn"
          onClick={() => navigate('/badges')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            color: AppColors.textPrimary,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          {earnedBadges}/{totalBadges}
          <ChevronRightIcon size={14} color={AppColors.textSecondary} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{
        marginBottom: '20px',
      }}>
        <div style={{
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${AppColors.whisperAmber} 0%, #f59e0b 100%)`,
            borderRadius: '3px',
            transition: 'width 0.5s ease-out',
          }} />
        </div>
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '12px',
          color: AppColors.textSecondary,
        }}>
          {totalBadges - earnedBadges} more to unlock
        </p>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
        }}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
              }}
            />
          ))}
        </div>
      ) : recentBadges.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
        }}>
          {recentBadges.map((userBadge) => (
            <div
              key={userBadge.badgeId}
              className="badge-item"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/badges')}
            >
              {/* Shine effect */}
              <div
                className="badge-shine"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '30px',
                  height: '200%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                  transform: 'translateX(-100%) rotate(45deg)',
                }}
              />

              <BadgeIcon
                iconName={userBadge.iconName}
                category={userBadge.category}
                size="md"
                earned={true}
              />
              <span style={{
                fontSize: '11px',
                color: AppColors.textSecondary,
                textAlign: 'center',
                lineHeight: 1.3,
                fontWeight: '500',
              }}>
                {userBadge.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '32px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '16px',
        }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>
            ✨
          </span>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: AppColors.textSecondary,
            lineHeight: 1.5,
          }}>
            Complete lessons to earn<br />your first achievement!
          </p>
        </div>
      )}
    </div>
  );
}
