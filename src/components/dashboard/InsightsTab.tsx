import React, { useState } from 'react';
import { AppColors } from '../../theme/colors';
import { ClassPulseSection } from './ClassPulseSection';
import { ClassActivitySection } from './ClassActivitySection';
import { CommonMistakesSection } from './CommonMistakesSection';
import { MistakeDrillDown } from './MistakeDrillDown';
import { useClassMistakes } from '../../hooks/useClassMistakes';
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

const selectStyle: React.CSSProperties = {
  padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)',
  background: AppColors.surfaceLight,
  border: `1px solid ${AppColors.borderColor}`,
  borderRadius: 'clamp(8px, 2vw, 10px)',
  color: AppColors.textPrimary,
  fontSize: 'clamp(13px, 2.8vw, 14px)',
};

const optionStyle = { background: '#1a1a2e', color: '#e0e0e0' };

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

  return (
    <div>
      {/* Period filter */}
      <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
          style={selectStyle}
        >
          <option value="week" style={optionStyle}>This Week</option>
          <option value="month" style={optionStyle}>This Month</option>
          <option value="all-time" style={optionStyle}>All Time</option>
        </select>
      </div>

      {/* AI Summary (Class Pulse) */}
      <ClassPulseSection
        insights={classPulseInsights}
        loading={classPulseLoading}
        generating={classPulseGenerating}
        lastGenerated={classPulseLastGenerated}
        onGenerate={onGeneratePulse}
      />

      {/* Class Activity */}
      <ClassActivitySection
        students={students}
        onStudentClick={onNavigateToStudent}
      />

      {/* Common Mistakes */}
      <CommonMistakesSection
        data={mistakesData}
        loading={mistakesLoading}
        onSeeAll={() => setShowDrillDown(true)}
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
