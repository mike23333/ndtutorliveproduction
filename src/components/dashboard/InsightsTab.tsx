import React, { useState } from 'react';
import { AppColors } from '../../theme/colors';
import { ClassPulseSection } from './ClassPulseSection';
import { ClassActivitySection } from './ClassActivitySection';
import { CommonMistakesSection } from './CommonMistakesSection';
import { MistakeDrillDown } from './MistakeDrillDown';
import { useClassMistakes } from '../../hooks/useClassMistakes';
import { SparklesIcon } from '../../theme/icons';
import type { UserDocument } from '../../types/firestore';
import type { ClassPulseInsight, AnalyticsPeriod } from '../../types/dashboard';

interface InsightsTabProps {
  teacherId: string;
  students: UserDocument[];
  onNavigateToStudent: (studentId: string) => void;
  // Class Pulse props
  classPulseInsights: ClassPulseInsight[];
  classPulseLoading: boolean;
  classPulseGenerating: boolean;
  classPulseLastGenerated: string | null;
  onGeneratePulse: () => void;
}

// Period selector pill button
const PeriodPill: React.FC<{
  label: string;
  value: AnalyticsPeriod;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3.5vw, 18px)',
      background: isActive
        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(96, 165, 250, 0.25) 100%)'
        : 'transparent',
      border: isActive
        ? '1px solid rgba(139, 92, 246, 0.3)'
        : '1px solid transparent',
      borderRadius: 'clamp(8px, 2vw, 10px)',
      color: isActive ? AppColors.textPrimary : AppColors.textSecondary,
      fontSize: 'clamp(13px, 2.8vw, 14px)',
      fontWeight: isActive ? 600 : 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

export const InsightsTab: React.FC<InsightsTabProps> = ({
  teacherId,
  students,
  onNavigateToStudent,
  classPulseInsights,
  classPulseLoading,
  classPulseGenerating,
  classPulseLastGenerated,
  onGeneratePulse,
}) => {
  const [showDrillDown, setShowDrillDown] = useState(false);

  const {
    data: mistakesData,
    loading: mistakesLoading,
    period,
    setPeriod,
  } = useClassMistakes(teacherId, true);

  // Calculate some quick stats
  const totalMistakes = mistakesData?.mistakes.length || 0;
  const activeStudentsCount = students.filter(s => s.status !== 'suspended').length;

  return (
    <div>
      {/* Hero Section */}
      <div
        style={{
          position: 'relative',
          marginBottom: 'clamp(24px, 6vw, 32px)',
          padding: 'clamp(24px, 6vw, 32px)',
          background: `linear-gradient(135deg,
            rgba(139, 92, 246, 0.15) 0%,
            rgba(96, 165, 250, 0.08) 50%,
            transparent 100%)`,
          borderRadius: 'clamp(20px, 5vw, 28px)',
          overflow: 'hidden',
        }}
      >
        {/* Background decorations */}
        <div
          style={{
            position: 'absolute',
            top: '-30%',
            right: '-20%',
            width: '60%',
            height: '120%',
            background:
              'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-40%',
            left: '-15%',
            width: '50%',
            height: '100%',
            background:
              'radial-gradient(ellipse at center, rgba(96, 165, 250, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(96, 165, 250, 0.3) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
              }}
            >
              <SparklesIcon size={22} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 'clamp(22px, 5.5vw, 28px)',
                  fontWeight: 700,
                  color: AppColors.textPrimary,
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Class Insights
              </h1>
            </div>
          </div>

          <p
            style={{
              fontSize: 'clamp(14px, 3vw, 15px)',
              color: AppColors.textSecondary,
              margin: '0 0 20px 0',
              lineHeight: 1.5,
            }}
          >
            AI-powered analysis of your students' progress and common challenges
          </p>

          {/* Quick Stats Row */}
          <div
            style={{
              display: 'flex',
              gap: 'clamp(12px, 3vw, 16px)',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'clamp(10px, 2.5vw, 12px)',
                padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(20px, 5vw, 24px)',
                  fontWeight: 700,
                  color: AppColors.textPrimary,
                }}
              >
                {activeStudentsCount}
              </div>
              <div
                style={{
                  fontSize: 'clamp(11px, 2.5vw, 12px)',
                  color: AppColors.textSecondary,
                  marginTop: '2px',
                }}
              >
                Active Students
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'clamp(10px, 2.5vw, 12px)',
                padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(20px, 5vw, 24px)',
                  fontWeight: 700,
                  color: totalMistakes > 0 ? '#FF6B81' : AppColors.success,
                }}
              >
                {totalMistakes}
              </div>
              <div
                style={{
                  fontSize: 'clamp(11px, 2.5vw, 12px)',
                  color: AppColors.textSecondary,
                  marginTop: '2px',
                }}
              >
                Mistakes Found
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'clamp(10px, 2.5vw, 12px)',
                padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(20px, 5vw, 24px)',
                  fontWeight: 700,
                  color: AppColors.accentPurple,
                }}
              >
                {classPulseInsights.length}
              </div>
              <div
                style={{
                  fontSize: 'clamp(11px, 2.5vw, 12px)',
                  color: AppColors.textSecondary,
                  marginTop: '2px',
                }}
              >
                AI Insights
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector Pills */}
      <div
        style={{
          display: 'flex',
          gap: 'clamp(6px, 1.5vw, 8px)',
          marginBottom: 'clamp(24px, 6vw, 32px)',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: 'clamp(4px, 1vw, 6px)',
          borderRadius: 'clamp(12px, 3vw, 14px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <PeriodPill
          label="This Week"
          value="week"
          isActive={period === 'week'}
          onClick={() => setPeriod('week')}
        />
        <PeriodPill
          label="This Month"
          value="month"
          isActive={period === 'month'}
          onClick={() => setPeriod('month')}
        />
        <PeriodPill
          label="All Time"
          value="all-time"
          isActive={period === 'all-time'}
          onClick={() => setPeriod('all-time')}
        />
      </div>

      {/* AI Summary (Class Pulse) */}
      <ClassPulseSection
        insights={classPulseInsights}
        loading={classPulseLoading}
        generating={classPulseGenerating}
        lastGenerated={classPulseLastGenerated}
        onGenerate={onGeneratePulse}
      />

      {/* Common Mistakes */}
      <CommonMistakesSection
        data={mistakesData}
        loading={mistakesLoading}
        onSeeAll={() => setShowDrillDown(true)}
      />

      {/* Class Activity */}
      <ClassActivitySection
        students={students}
        onStudentClick={onNavigateToStudent}
      />

      {/* Drill-down modal */}
      {showDrillDown && (
        <MistakeDrillDown
          data={mistakesData}
          onClose={() => setShowDrillDown(false)}
        />
      )}
    </div>
  );
};
