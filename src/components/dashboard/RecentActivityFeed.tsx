import React from 'react';
import { AppColors } from '../../theme/colors';

export interface ActivityItem {
  id: string;
  studentName: string;
  action: 'completed' | 'started' | 'earned_stars';
  lessonTitle: string;
  timestamp: Date;
  stars?: number;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
}

const actionConfig: Record<string, { icon: string; verb: string; color: string }> = {
  completed: {
    icon: '✅',
    verb: 'completed',
    color: AppColors.success,
  },
  started: {
    icon: '🚀',
    verb: 'started',
    color: AppColors.accentBlue,
  },
  earned_stars: {
    icon: '⭐',
    verb: 'earned',
    color: '#FDE047',
  },
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
};

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  loading = false,
}) => {
  if (loading) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 'clamp(16px, 4vw, 20px)',
          padding: 'clamp(16px, 4vw, 20px)',
          marginBottom: 'clamp(20px, 5vw, 28px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '20px' }}>📊</span>
          <h3
            style={{
              fontSize: 'clamp(15px, 3.5vw, 17px)',
              fontWeight: 600,
              color: AppColors.textPrimary,
              margin: 0,
            }}
          >
            Recent Activity
          </h3>
        </div>
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: AppColors.textSecondary,
          }}
        >
          Loading activity...
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 'clamp(16px, 4vw, 20px)',
          padding: 'clamp(20px, 5vw, 28px)',
          textAlign: 'center',
          marginBottom: 'clamp(20px, 5vw, 28px)',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
        <div
          style={{
            fontSize: 'clamp(15px, 3.5vw, 17px)',
            fontWeight: 600,
            color: AppColors.textPrimary,
            marginBottom: '4px',
          }}
        >
          No recent activity
        </div>
        <div
          style={{
            fontSize: 'clamp(13px, 3vw, 14px)',
            color: AppColors.textSecondary,
          }}
        >
          Student activity will show up here
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 'clamp(16px, 4vw, 20px)',
        padding: 'clamp(16px, 4vw, 20px)',
        marginBottom: 'clamp(20px, 5vw, 28px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: 'clamp(14px, 3.5vw, 18px)',
        }}
      >
        <span style={{ fontSize: '20px' }}>📊</span>
        <h3
          style={{
            fontSize: 'clamp(15px, 3.5vw, 17px)',
            fontWeight: 600,
            color: AppColors.textPrimary,
            margin: 0,
          }}
        >
          Recent Activity
        </h3>
      </div>

      {/* Activity List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {activities.slice(0, 5).map((activity, index) => {
          const config = actionConfig[activity.action];
          return (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: 'clamp(10px, 2.5vw, 12px) 0',
                borderBottom:
                  index < Math.min(activities.length, 5) - 1
                    ? '1px solid rgba(255, 255, 255, 0.06)'
                    : 'none',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                {config.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'clamp(13px, 3vw, 14px)',
                    color: AppColors.textPrimary,
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{activity.studentName}</span>{' '}
                  <span style={{ color: AppColors.textSecondary }}>
                    {config.verb}
                  </span>{' '}
                  {activity.action === 'earned_stars' ? (
                    <span style={{ color: config.color, fontWeight: 600 }}>
                      {activity.stars} stars
                    </span>
                  ) : (
                    <span style={{ fontWeight: 500 }}>"{activity.lessonTitle}"</span>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <div
                style={{
                  fontSize: 'clamp(11px, 2.5vw, 12px)',
                  color: AppColors.textMuted,
                  flexShrink: 0,
                }}
              >
                {formatTimeAgo(activity.timestamp)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
