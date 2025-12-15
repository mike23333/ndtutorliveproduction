import React from 'react';
import { AppColors } from '../../theme/colors';
import { QuickStatsGrid } from './QuickStatsGrid';
import { NeedsAttentionCard, AttentionStudent } from './NeedsAttentionCard';
import { RecentActivityFeed, ActivityItem } from './RecentActivityFeed';
import { PlusIcon, SparklesIcon } from '../../theme/icons';

interface DashboardHomeProps {
  teacherName: string;
  lessonsCount: number;
  studentsCount: number;
  activeToday: number;
  attentionStudents: AttentionStudent[];
  recentActivity: ActivityItem[];
  activityLoading?: boolean;
  onCreateLesson: () => void;
  onGenerateInsights: () => void;
  onNavigateToStudent: (studentId: string) => void;
  onNavigateToStudents: () => void;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getMotivationalMessage = (
  studentsCount: number,
  activeToday: number
): string => {
  if (studentsCount === 0) return 'Ready to welcome your first students!';
  if (activeToday === 0) return 'Your students are warming up';
  const ratio = activeToday / studentsCount;
  if (ratio > 0.5) return 'Your class is thriving!';
  if (ratio > 0.2) return 'Great engagement today';
  return 'Learning is happening';
};

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  teacherName,
  lessonsCount,
  studentsCount,
  activeToday,
  attentionStudents,
  recentActivity,
  activityLoading = false,
  onCreateLesson,
  onGenerateInsights,
  onNavigateToStudent,
  onNavigateToStudents,
}) => {
  const firstName = teacherName.split(' ')[0];

  return (
    <div>
      {/* Hero Section */}
      <div
        style={{
          position: 'relative',
          marginBottom: 'clamp(24px, 6vw, 32px)',
          padding: 'clamp(24px, 6vw, 32px)',
          background: `linear-gradient(180deg,
            rgba(139, 92, 246, 0.12) 0%,
            rgba(139, 92, 246, 0.04) 60%,
            transparent 100%)`,
          borderRadius: 'clamp(20px, 5vw, 28px)',
          overflow: 'hidden',
        }}
      >
        {/* Background decorations */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '50%',
            height: '100%',
            background:
              'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '-15%',
            width: '40%',
            height: '80%',
            background:
              'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              fontSize: 'clamp(24px, 6vw, 32px)',
              fontWeight: 700,
              color: AppColors.textPrimary,
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            {getGreeting()}, {firstName}! 👋
          </h1>
          <p
            style={{
              fontSize: 'clamp(15px, 3.5vw, 17px)',
              color: AppColors.textSecondary,
              margin: 0,
            }}
          >
            {getMotivationalMessage(studentsCount, activeToday)}
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <QuickStatsGrid
        lessonsCount={lessonsCount}
        studentsCount={studentsCount}
        activeToday={activeToday}
      />

      {/* Needs Attention */}
      <NeedsAttentionCard
        students={attentionStudents}
        onStudentClick={onNavigateToStudent}
        onViewAll={onNavigateToStudents}
      />

      {/* Recent Activity Feed */}
      <RecentActivityFeed activities={recentActivity} loading={activityLoading} />

      {/* Quick Actions */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 'clamp(16px, 4vw, 20px)',
          padding: 'clamp(16px, 4vw, 20px)',
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
          <span style={{ fontSize: '20px' }}>⚡</span>
          <h3
            style={{
              fontSize: 'clamp(15px, 3.5vw, 17px)',
              fontWeight: 600,
              color: AppColors.textPrimary,
              margin: 0,
            }}
          >
            Quick Actions
          </h3>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'clamp(10px, 2.5vw, 14px)',
          }}
        >
          <button
            onClick={onCreateLesson}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: 'clamp(14px, 3.5vw, 18px)',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
              border: 'none',
              borderRadius: 'clamp(12px, 3vw, 14px)',
              color: '#ffffff',
              fontSize: 'clamp(14px, 3vw, 15px)',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <PlusIcon size={18} />
            New Lesson
          </button>

          <button
            onClick={onGenerateInsights}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: 'clamp(14px, 3.5vw, 18px)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'clamp(12px, 3vw, 14px)',
              color: AppColors.textPrimary,
              fontSize: 'clamp(14px, 3vw, 15px)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <SparklesIcon size={18} />
            Get Insights
          </button>
        </div>
      </div>
    </div>
  );
};
