import React, { useMemo } from 'react';
import { AppColors } from '../../theme/colors';
import type { UserDocument } from '../../types/firestore';
import type { StudentActivityInfo } from '../../types/dashboard';

interface ClassActivitySectionProps {
  students: UserDocument[];
  onStudentClick: (studentId: string) => void;
}

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
            existing.reason += ` • low scores (${avgStars.toFixed(1)} avg)`;
            existing.avgStars = avgStars;
          } else {
            attention.push({
              id: student.uid,
              name: student.displayName,
              reason: `low scores (${avgStars.toFixed(1)} avg)`,
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

  return (
    <div
      style={{
        background: AppColors.surfaceLight,
        borderRadius: 'clamp(12px, 3vw, 16px)',
        padding: 'clamp(16px, 4vw, 20px)',
        marginBottom: 'clamp(16px, 4vw, 20px)',
      }}
    >
      <h3
        style={{
          fontSize: 'clamp(14px, 3vw, 16px)',
          fontWeight: 600,
          margin: '0 0 clamp(12px, 3vw, 16px) 0',
          color: AppColors.textPrimary,
        }}
      >
        Class Activity
      </h3>

      {/* Activity bar */}
      <div style={{ marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
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
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              color: AppColors.textSecondary,
            }}
          >
            Active this week
          </span>
          <span
            style={{
              fontSize: 'clamp(13px, 2.8vw, 14px)',
              fontWeight: 600,
              color: AppColors.textPrimary,
            }}
          >
            {activeCount}/{totalCount} students
          </span>
        </div>
        <div
          style={{
            height: 'clamp(8px, 2vw, 10px)',
            background: AppColors.surfaceMedium,
            borderRadius: 'clamp(4px, 1vw, 5px)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${activityPercent}%`,
              background:
                activityPercent >= 75
                  ? AppColors.successGreen
                  : activityPercent >= 50
                  ? AppColors.whisperAmber
                  : AppColors.errorRose,
              borderRadius: 'clamp(4px, 1vw, 5px)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Needs Attention list */}
      {needsAttention.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              fontWeight: 500,
              color: AppColors.errorRose,
              margin: '0 0 clamp(8px, 2vw, 10px) 0',
            }}
          >
            Needs Attention
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.5vw, 8px)' }}>
            {needsAttention.map((student) => (
              <button
                key={student.id}
                onClick={() => onStudentClick(student.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: AppColors.surfaceMedium,
                  border: 'none',
                  borderRadius: 'clamp(8px, 2vw, 10px)',
                  padding: 'clamp(10px, 2.5vw, 12px)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(13px, 2.8vw, 14px)',
                    fontWeight: 500,
                    color: AppColors.textPrimary,
                  }}
                >
                  {student.name}
                </span>
                <span
                  style={{
                    fontSize: 'clamp(11px, 2.2vw, 12px)',
                    color: AppColors.textSecondary,
                  }}
                >
                  {student.reason}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {needsAttention.length === 0 && totalCount > 0 && (
        <p
          style={{
            fontSize: 'clamp(13px, 2.8vw, 14px)',
            color: AppColors.successGreen,
            margin: 0,
            textAlign: 'center',
          }}
        >
          All students are active and performing well!
        </p>
      )}

      {totalCount === 0 && (
        <p
          style={{
            fontSize: 'clamp(13px, 2.8vw, 14px)',
            color: AppColors.textSecondary,
            margin: 0,
            textAlign: 'center',
          }}
        >
          No students in your class yet.
        </p>
      )}
    </div>
  );
};
