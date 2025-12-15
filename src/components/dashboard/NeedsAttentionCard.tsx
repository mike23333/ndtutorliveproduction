import React from 'react';
import { AppColors } from '../../theme/colors';
import { ChevronRightIcon } from '../../theme/icons';

export interface AttentionStudent {
  uid: string;
  name: string;
  reason: 'inactive' | 'struggling' | 'streak_risk';
  details: string;
}

interface NeedsAttentionCardProps {
  students: AttentionStudent[];
  onStudentClick?: (studentId: string) => void;
  onViewAll?: () => void;
}

const reasonConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  inactive: {
    icon: '😴',
    color: AppColors.whisperAmber,
    bgColor: 'rgba(251, 191, 36, 0.15)',
  },
  struggling: {
    icon: '📉',
    color: AppColors.errorRose,
    bgColor: 'rgba(248, 113, 113, 0.15)',
  },
  streak_risk: {
    icon: '🔥',
    color: '#FB923C',
    bgColor: 'rgba(251, 146, 60, 0.15)',
  },
};

export const NeedsAttentionCard: React.FC<NeedsAttentionCardProps> = ({
  students,
  onStudentClick,
  onViewAll,
}) => {
  if (students.length === 0) {
    return (
      <div
        style={{
          background: 'rgba(74, 222, 128, 0.08)',
          border: '1px solid rgba(74, 222, 128, 0.2)',
          borderRadius: 'clamp(14px, 3.5vw, 18px)',
          padding: 'clamp(20px, 5vw, 28px)',
          textAlign: 'center',
          marginBottom: 'clamp(20px, 5vw, 28px)',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</div>
        <div
          style={{
            fontSize: 'clamp(15px, 3.5vw, 17px)',
            fontWeight: 600,
            color: AppColors.textPrimary,
            marginBottom: '4px',
          }}
        >
          All students on track!
        </div>
        <div
          style={{
            fontSize: 'clamp(13px, 3vw, 14px)',
            color: AppColors.textSecondary,
          }}
        >
          No one needs extra attention right now
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
          justifyContent: 'space-between',
          marginBottom: 'clamp(14px, 3.5vw, 18px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <h3
            style={{
              fontSize: 'clamp(15px, 3.5vw, 17px)',
              fontWeight: 600,
              color: AppColors.textPrimary,
              margin: 0,
            }}
          >
            Needs Attention
          </h3>
          <span
            style={{
              background: AppColors.errorMuted,
              color: AppColors.errorRose,
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            {students.length}
          </span>
        </div>
        {onViewAll && students.length > 3 && (
          <button
            onClick={onViewAll}
            style={{
              background: 'transparent',
              border: 'none',
              color: AppColors.accentPurple,
              fontSize: 'clamp(13px, 3vw, 14px)',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View All
            <ChevronRightIcon size={16} />
          </button>
        )}
      </div>

      {/* Student List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {students.slice(0, 3).map((student) => {
          const config = reasonConfig[student.reason];
          return (
            <button
              key={student.uid}
              onClick={() => onStudentClick?.(student.uid)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: 'clamp(12px, 3vw, 14px)',
                background: config.bgColor,
                border: 'none',
                borderRadius: 'clamp(10px, 2.5vw, 12px)',
                cursor: onStudentClick ? 'pointer' : 'default',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                    fontSize: 'clamp(14px, 3vw, 15px)',
                    fontWeight: 600,
                    color: AppColors.textPrimary,
                    marginBottom: '2px',
                  }}
                >
                  {student.name}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(12px, 2.5vw, 13px)',
                    color: config.color,
                  }}
                >
                  {student.details}
                </div>
              </div>

              {/* Arrow */}
              {onStudentClick && (
                <ChevronRightIcon size={18} color={AppColors.textSecondary} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
