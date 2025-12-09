/**
 * Badges Page
 * Full badge collection view with all categories and progress
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppColors, gradientBackground } from '../theme/colors';
import { ChevronLeftIcon } from '../theme/icons';
import { useAuth } from '../hooks/useAuth';
import { useBadgeProgress } from '../hooks/useBadges';
import { BadgeGrid, BadgeDetail } from '../components/badges';
import type { BadgeProgress } from '../types/badges';

export default function BadgesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    badgesByCategory,
    loading,
    error,
    earnedBadges,
    totalBadges,
    earnedPercent,
  } = useBadgeProgress(user?.uid);

  const [selectedBadge, setSelectedBadge] = useState<BadgeProgress | null>(null);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: gradientBackground,
      color: AppColors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px)',
        borderBottom: `1px solid ${AppColors.borderColor}`,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: AppColors.textSecondary,
            cursor: 'pointer',
          }}
        >
          <ChevronLeftIcon size={24} />
        </button>
        <h1 style={{
          flex: 1,
          margin: 0,
          fontSize: 'clamp(18px, 4.5vw, 22px)',
          fontWeight: '700',
          textAlign: 'center',
        }}>
          Badge Collection
        </h1>
        <div style={{ width: '40px' }} /> {/* Spacer for centering */}
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'clamp(16px, 4vw, 24px)',
      }}>
        {/* Progress Overview */}
        <div style={{
          backgroundColor: AppColors.surfaceMedium,
          borderRadius: '20px',
          padding: 'clamp(16px, 4vw, 24px)',
          marginBottom: 'clamp(20px, 5vw, 32px)',
        }}>
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
            }}>
              Collection Progress
            </h3>
            <span style={{
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              fontWeight: '600',
              color: AppColors.accentPurple,
            }}>
              {earnedBadges}/{totalBadges}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '5px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${earnedPercent}%`,
              height: '100%',
              backgroundColor: AppColors.accentPurple,
              borderRadius: '5px',
              transition: 'width 0.3s ease',
            }} />
          </div>

          <p style={{
            margin: '12px 0 0 0',
            fontSize: 'clamp(12px, 3vw, 14px)',
            color: AppColors.textSecondary,
          }}>
            {earnedPercent}% complete - Keep practicing to unlock more!
          </p>
        </div>

        {/* Badge Grid */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            color: AppColors.textSecondary,
            padding: '40px',
          }}>
            Loading badges...
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            color: '#ef4444',
            padding: '40px',
          }}>
            {error}
          </div>
        ) : (
          <BadgeGrid
            badgesByCategory={badgesByCategory}
            onBadgeClick={setSelectedBadge}
          />
        )}
      </div>

      {/* Badge Detail Modal */}
      <BadgeDetail
        badgeProgress={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  );
}
