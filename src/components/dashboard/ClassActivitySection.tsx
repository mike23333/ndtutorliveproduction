import React, { useMemo } from 'react';
import { AppColors } from '../../theme/colors';
import type { UserDocument } from '../../types/firestore';
import type { StudentActivityInfo } from '../../types/dashboard';

interface ClassActivitySectionProps {
  students: UserDocument[];
  onStudentClick: (studentId: string) => void;
}

// Activity ring component
const ActivityRing: React.FC<{ percent: number; size: number }> = ({ percent, size }) => {
  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const getColor = () => {
    if (percent >= 75) return AppColors.success;
    if (percent >= 50) return AppColors.warning;
    return AppColors.error;
  };

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={AppColors.surface10}
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getColor()}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
};

// Get attention type info
const getAttentionInfo = (student: StudentActivityInfo) => {
  if (student.daysInactive !== undefined) {
    if (student.daysInactive >= 7) {
      return { icon: '😴', color: AppColors.error, priority: 'high' };
    }
    return { icon: '⏰', color: AppColors.warning, priority: 'medium' };
  }
  if (student.reason.includes('Never')) {
    return { icon: '🆕', color: AppColors.accentBlue, priority: 'low' };
  }
  if (student.avgStars !== undefined) {
    return { icon: '📉', color: AppColors.warning, priority: 'medium' };
  }
  return { icon: '👀', color: AppColors.textSecondary, priority: 'low' };
};

// Generate avatar initials and color
const getAvatarInfo = (name: string) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate consistent color from name
  const colors = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#a78bfa'];
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

  return { initials, color: colors[colorIndex] };
};

export const ClassActivitySection: React.FC<ClassActivitySectionProps> = ({
  students,
  onStudentClick,
}) => {
  // Calculate activity metrics
  const { activeCount, totalCount, needsAttention } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    let active = 0;
    const attention: StudentActivityInfo[] = [];

    students.forEach((student) => {
      // Check if student practiced in last 7 days
      let lastPractice: Date | null = null;
      if (student.lastPracticeDate) {
        lastPractice = new Date(student.lastPracticeDate + 'T00:00:00');
      } else if (student.lastSessionAt) {
        lastPractice = student.lastSessionAt.toDate();
      }

      const isActive = lastPractice && lastPractice >= sevenDaysAgo;
      if (isActive) active++;

      // Check for "needs attention"
      // 1. Inactive for 3+ days
      if (lastPractice && lastPractice < threeDaysAgo) {
        const daysInactive = Math.floor(
          (today.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24)
        );
        attention.push({
          id: student.uid,
          name: student.displayName,
          reason: `${daysInactive} days inactive`,
          daysInactive,
        });
      } else if (!lastPractice) {
        // Never practiced
        attention.push({
          id: student.uid,
          name: student.displayName,
          reason: 'Never practiced',
          daysInactive: undefined,
        });
      }

      // 2. Low average stars (< 3.0)
      if (student.totalSessions && student.totalSessions > 0 && student.totalStars !== undefined) {
        const avgStars = student.totalStars / student.totalSessions;
        if (avgStars < 3.0) {
          // Check if already in attention list
          const existing = attention.find((a) => a.id === student.uid);
          if (existing) {
            existing.reason += ` • ${avgStars.toFixed(1)}★ avg`;
            existing.avgStars = avgStars;
          } else {
            attention.push({
              id: student.uid,
              name: student.displayName,
              reason: `${avgStars.toFixed(1)}★ avg score`,
              avgStars,
            });
          }
        }
      }
    });

    // Sort: inactive first, then low scores
    attention.sort((a, b) => {
      if (a.daysInactive !== undefined && b.daysInactive === undefined) return -1;
      if (a.daysInactive === undefined && b.daysInactive !== undefined) return 1;
      if (a.daysInactive !== undefined && b.daysInactive !== undefined) {
        return b.daysInactive - a.daysInactive;
      }
      return 0;
    });

    return {
      activeCount: active,
      totalCount: students.length,
      needsAttention: attention.slice(0, 5), // Top 5
    };
  }, [students]);

  const activityPercent = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;
  const inactiveCount = totalCount - activeCount;

  return (
    <div
      style={{
        background: AppColors.surfaceLight,
        borderRadius: 'clamp(14px, 3.5vw, 18px)',
        padding: 'clamp(18px, 4.5vw, 24px)',
        marginBottom: 'clamp(16px, 4vw, 20px)',
        border: `1px solid ${AppColors.borderColor}`,
      }}
    >
      {/* Header with ring */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(14px, 3.5vw, 18px)',
          marginBottom: 'clamp(16px, 4vw, 20px)',
        }}
      >
        {/* Activity ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ActivityRing percent={activityPercent} size={70} />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(16px, 3.5vw, 18px)',
                fontWeight: 700,
                color: AppColors.textPrimary,
                lineHeight: 1,
              }}
            >
              {Math.round(activityPercent)}%
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: 'clamp(15px, 3.2vw, 17px)',
              fontWeight: 600,
              margin: '0 0 clamp(6px, 1.5vw, 8px) 0',
              color: AppColors.textPrimary,
            }}
          >
            Class Activity
          </h3>
          <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 16px)' }}>
            <div>
              <span
                style={{
                  fontSize: 'clamp(18px, 4vw, 22px)',
                  fontWeight: 700,
                  color: AppColors.success,
                }}
              >
                {activeCount}
              </span>
              <span
                style={{
                  fontSize: 'clamp(11px, 2.2vw, 12px)',
                  color: AppColors.textSecondary,
                  marginLeft: '4px',
                }}
              >
                active
              </span>
            </div>
            <div
              style={{
                width: '1px',
                background: AppColors.borderColor,
                alignSelf: 'stretch',
              }}
            />
            <div>
              <span
                style={{
                  fontSize: 'clamp(18px, 4vw, 22px)',
                  fontWeight: 700,
                  color: inactiveCount > 0 ? AppColors.warning : AppColors.textMuted,
                }}
              >
                {inactiveCount}
              </span>
              <span
                style={{
                  fontSize: 'clamp(11px, 2.2vw, 12px)',
                  color: AppColors.textSecondary,
                  marginLeft: '4px',
                }}
              >
                inactive
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(6px, 1.5vw, 8px)',
          }}
        >
          <span
            style={{
              fontSize: 'clamp(11px, 2.2vw, 12px)',
              color: AppColors.textSecondary,
            }}
          >
            Weekly engagement
          </span>
          <span
            style={{
              fontSize: 'clamp(11px, 2.2vw, 12px)',
              color: AppColors.textSecondary,
            }}
          >
            {activeCount} of {totalCount} students
          </span>
        </div>
        <div
          style={{
            height: 'clamp(6px, 1.5vw, 8px)',
            background: AppColors.surface10,
            borderRadius: 'clamp(3px, 0.75vw, 4px)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${activityPercent}%`,
              background:
                activityPercent >= 75
                  ? `linear-gradient(90deg, ${AppColors.success}, #34d399)`
                  : activityPercent >= 50
                  ? `linear-gradient(90deg, ${AppColors.warning}, #fcd34d)`
                  : `linear-gradient(90deg, ${AppColors.error}, #fca5a5)`,
              borderRadius: 'clamp(3px, 0.75vw, 4px)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Needs Attention list */}
      {needsAttention.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1.5vw, 8px)',
              marginBottom: 'clamp(10px, 2.5vw, 12px)',
            }}
          >
            <div
              style={{
                width: 'clamp(20px, 5vw, 24px)',
                height: 'clamp(20px, 5vw, 24px)',
                borderRadius: '6px',
                background: `${AppColors.error}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(10px, 2vw, 12px)',
              }}
            >
              ⚠️
            </div>
            <h4
              style={{
                fontSize: 'clamp(13px, 2.8vw, 14px)',
                fontWeight: 600,
                color: AppColors.textPrimary,
                margin: 0,
              }}
            >
              Needs Attention
            </h4>
            <span
              style={{
                fontSize: 'clamp(10px, 2vw, 11px)',
                fontWeight: 600,
                color: AppColors.error,
                background: `${AppColors.error}20`,
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {needsAttention.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2vw, 10px)' }}>
            {needsAttention.map((student, index) => {
              const attentionInfo = getAttentionInfo(student);
              const avatarInfo = getAvatarInfo(student.name);

              return (
                <button
                  key={student.id}
                  onClick={() => onStudentClick(student.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(10px, 2.5vw, 12px)',
                    background: AppColors.surface05,
                    border: `1px solid ${AppColors.borderColor}`,
                    borderRadius: 'clamp(10px, 2.5vw, 12px)',
                    padding: 'clamp(10px, 2.5vw, 12px)',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    animation: `fadeSlideIn 0.3s ease ${index * 0.05}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = AppColors.surface10;
                    e.currentTarget.style.borderColor = AppColors.borderHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = AppColors.surface05;
                    e.currentTarget.style.borderColor = AppColors.borderColor;
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 'clamp(36px, 9vw, 42px)',
                      height: 'clamp(36px, 9vw, 42px)',
                      borderRadius: '10px',
                      background: `${avatarInfo.color}25`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(12px, 2.5vw, 14px)',
                      fontWeight: 600,
                      color: avatarInfo.color,
                      flexShrink: 0,
                    }}
                  >
                    {avatarInfo.initials}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'clamp(13px, 2.8vw, 14px)',
                        fontWeight: 500,
                        color: AppColors.textPrimary,
                        marginBottom: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {student.name}
                    </div>
                    <div
                      style={{
                        fontSize: 'clamp(11px, 2.2vw, 12px)',
                        color: attentionInfo.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>{attentionInfo.icon}</span>
                      <span>{student.reason}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div
                    style={{
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      color: AppColors.textMuted,
                      flexShrink: 0,
                    }}
                  >
                    →
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All good state */}
      {needsAttention.length === 0 && totalCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(10px, 2.5vw, 12px)',
            padding: 'clamp(14px, 3.5vw, 18px)',
            background: `${AppColors.success}10`,
            borderRadius: 'clamp(10px, 2.5vw, 12px)',
            border: `1px solid ${AppColors.success}30`,
          }}
        >
          <div
            style={{
              width: 'clamp(36px, 9vw, 42px)',
              height: 'clamp(36px, 9vw, 42px)',
              borderRadius: '10px',
              background: `${AppColors.success}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(18px, 4vw, 22px)',
              flexShrink: 0,
            }}
          >
            🎉
          </div>
          <div>
            <div
              style={{
                fontSize: 'clamp(13px, 2.8vw, 14px)',
                fontWeight: 600,
                color: AppColors.success,
                marginBottom: '2px',
              }}
            >
              Everyone's on track!
            </div>
            <div
              style={{
                fontSize: 'clamp(11px, 2.2vw, 12px)',
                color: AppColors.textSecondary,
              }}
            >
              All students are active and performing well
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 'clamp(20px, 5vw, 30px)',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(32px, 8vw, 40px)',
              marginBottom: 'clamp(8px, 2vw, 12px)',
            }}
          >
            👥
          </div>
          <p
            style={{
              fontSize: 'clamp(13px, 2.8vw, 14px)',
              color: AppColors.textSecondary,
              margin: 0,
            }}
          >
            No students in your class yet
          </p>
        </div>
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
