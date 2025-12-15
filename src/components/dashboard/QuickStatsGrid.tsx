import React from 'react';
import { AppColors } from '../../theme/colors';

interface StatItem {
  label: string;
  value: number | string;
  icon: string;
  gradient: string;
  glowColor: string;
}

interface QuickStatsGridProps {
  lessonsCount: number;
  studentsCount: number;
  activeToday: number;
}

export const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({
  lessonsCount,
  studentsCount,
  activeToday,
}) => {
  const stats: StatItem[] = [
    {
      label: 'Lessons',
      value: lessonsCount,
      icon: '📚',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
      glowColor: 'rgba(139, 92, 246, 0.2)',
    },
    {
      label: 'Students',
      value: studentsCount,
      icon: '👥',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
      glowColor: 'rgba(59, 130, 246, 0.2)',
    },
    {
      label: 'Active Today',
      value: activeToday,
      icon: '✨',
      gradient: 'linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.15) 100%)',
      glowColor: 'rgba(74, 222, 128, 0.2)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'clamp(10px, 2.5vw, 14px)',
        marginBottom: 'clamp(20px, 5vw, 28px)',
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="stat-card"
          style={{
            background: stat.gradient,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 'clamp(14px, 3.5vw, 18px)',
            padding: 'clamp(14px, 3.5vw, 20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: '60%',
              background: `radial-gradient(ellipse at center, ${stat.glowColor} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Icon */}
          <div
            style={{
              fontSize: 'clamp(24px, 6vw, 32px)',
              marginBottom: 'clamp(6px, 1.5vw, 10px)',
              position: 'relative',
            }}
          >
            {stat.icon}
          </div>

          {/* Value */}
          <div
            style={{
              fontSize: 'clamp(24px, 6vw, 32px)',
              fontWeight: 800,
              color: AppColors.textPrimary,
              letterSpacing: '-0.02em',
              position: 'relative',
            }}
          >
            {stat.value}
          </div>

          {/* Label */}
          <div
            style={{
              fontSize: 'clamp(11px, 2.5vw, 13px)',
              color: AppColors.textSecondary,
              fontWeight: 500,
              marginTop: '4px',
              position: 'relative',
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
