import React from 'react';
import { AppColors } from '../../theme/colors';
import { BarChartIcon } from '../../theme/icons';
import type { AnalyticsData, AnalyticsPeriod, AnalyticsLevel, LevelAnalytics, CostData, StudentCostData } from '../../types/dashboard';

interface AnalyticsTabProps {
  data: AnalyticsData | null;
  loading: boolean;
  period: AnalyticsPeriod;
  level: AnalyticsLevel;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  onLevelChange: (level: AnalyticsLevel) => void;
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

const StatCard: React.FC<{ label: string; value: string | number; color?: string; subtext?: string }> = ({ label, value, color, subtext }) => (
  <div style={{ background: AppColors.surfaceLight, borderRadius: 'clamp(10px, 2.5vw, 14px)', padding: 'clamp(14px, 3.5vw, 18px)' }}>
    <div style={{ fontSize: 'clamp(11px, 2.2vw, 12px)', color: AppColors.textSecondary, marginBottom: 'clamp(4px, 1vw, 6px)' }}>{label}</div>
    <div style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, color: color || AppColors.textPrimary }}>{value}</div>
    {subtext && <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: AppColors.textSecondary, marginTop: '2px' }}>{subtext}</div>}
  </div>
);

const formatCurrency = (amount: number): string => {
  if (amount < 0.01) return '$0.00';
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
};

const formatTokens = (tokens: number): string => {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
};

const CostSection: React.FC<{ costs: CostData; studentCosts?: StudentCostData[] }> = ({ costs, studentCosts }) => (
  <div style={{ background: AppColors.surfaceLight, borderRadius: 'clamp(12px, 3vw, 16px)', padding: 'clamp(16px, 4vw, 20px)', marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
    <h3 style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', fontWeight: 600, margin: '0 0 clamp(12px, 3vw, 16px) 0', color: AppColors.accentBlue }}>
      API Costs (Gemini 2.5 Flash Live)
    </h3>

    {/* Cost Overview */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 'clamp(8px, 2vw, 12px)', marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
      <div style={{ background: AppColors.surfaceMedium, borderRadius: 'clamp(8px, 2vw, 10px)', padding: 'clamp(10px, 2.5vw, 12px)' }}>
        <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: AppColors.textSecondary }}>Total Cost</div>
        <div style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, color: AppColors.textPrimary }}>{formatCurrency(costs.totalCost)}</div>
      </div>
      <div style={{ background: AppColors.surfaceMedium, borderRadius: 'clamp(8px, 2vw, 10px)', padding: 'clamp(10px, 2.5vw, 12px)' }}>
        <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: AppColors.textSecondary }}>Per Student</div>
        <div style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, color: AppColors.accentPurple }}>{formatCurrency(costs.costPerStudent)}</div>
      </div>
      <div style={{ background: AppColors.surfaceMedium, borderRadius: 'clamp(8px, 2vw, 10px)', padding: 'clamp(10px, 2.5vw, 12px)' }}>
        <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: AppColors.textSecondary }}>Daily Avg</div>
        <div style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, color: AppColors.successGreen }}>{formatCurrency(costs.dailyCost)}</div>
      </div>
      <div style={{ background: AppColors.surfaceMedium, borderRadius: 'clamp(8px, 2vw, 10px)', padding: 'clamp(10px, 2.5vw, 12px)' }}>
        <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: AppColors.textSecondary }}>Monthly Est.</div>
        <div style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, color: AppColors.whisperAmber }}>{formatCurrency(costs.monthlyCost)}</div>
      </div>
    </div>

    {/* Token Usage */}
    <div style={{ display: 'flex', gap: 'clamp(10px, 2.5vw, 14px)', marginBottom: 'clamp(12px, 3vw, 16px)', flexWrap: 'wrap' }}>
      <div style={{ fontSize: 'clamp(11px, 2.2vw, 12px)', color: AppColors.textSecondary }}>
        Input: <span style={{ color: AppColors.textPrimary, fontWeight: 500 }}>{formatTokens(costs.inputTokens)} tokens</span>
        <span style={{ color: AppColors.textSecondary }}> ($3/1M)</span>
      </div>
      <div style={{ fontSize: 'clamp(11px, 2.2vw, 12px)', color: AppColors.textSecondary }}>
        Output: <span style={{ color: AppColors.textPrimary, fontWeight: 500 }}>{formatTokens(costs.outputTokens)} tokens</span>
        <span style={{ color: AppColors.textSecondary }}> ($12/1M)</span>
      </div>
    </div>

    {/* Per-Student Breakdown */}
    {studentCosts && studentCosts.length > 0 && (
      <div>
        <div style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary, marginBottom: 'clamp(6px, 1.5vw, 8px)' }}>Cost by Student:</div>
        <div style={{ display: 'grid', gap: 'clamp(6px, 1.5vw, 8px)', maxHeight: '200px', overflowY: 'auto' }}>
          {studentCosts.slice(0, 10).map((student) => (
            <div key={student.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(8px, 2vw, 10px)', background: AppColors.surfaceMedium, borderRadius: 'clamp(6px, 1.5vw, 8px)' }}>
              <div>
                <span style={{ fontSize: 'clamp(13px, 2.8vw, 14px)', color: AppColors.textPrimary }}>{student.displayName}</span>
                <span style={{ fontSize: 'clamp(11px, 2.2vw, 12px)', color: AppColors.textSecondary, marginLeft: '8px' }}>
                  ({student.sessionCount} sessions)
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: 600, color: AppColors.accentPurple }}>
                  {formatCurrency(student.totalCost)}
                </div>
                <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: AppColors.textSecondary }}>
                  {formatCurrency(student.avgCostPerSession)}/session
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const LevelBreakdown: React.FC<{ level: string; data: LevelAnalytics }> = ({ level, data }) => (
  <div style={{ background: AppColors.surfaceLight, borderRadius: 'clamp(12px, 3vw, 16px)', padding: 'clamp(16px, 4vw, 20px)', marginBottom: 'clamp(14px, 3.5vw, 18px)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(12px, 3vw, 16px)' }}>
      <h3 style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', fontWeight: 600, margin: 0, color: AppColors.accentPurple }}>{level} Level</h3>
      <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 16px)' }}>
        <span style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary }}>{data.studentCount} students</span>
        <span style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary }}>{data.sessionCount} sessions</span>
      </div>
    </div>

    {/* Trends */}
    {data.trends && (
      <div style={{ display: 'flex', gap: 'clamp(14px, 3.5vw, 20px)', marginBottom: 'clamp(12px, 3vw, 16px)' }}>
        <span style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: data.trends.sessions.startsWith('+') ? AppColors.successGreen : AppColors.errorRose }}>
          Sessions: {data.trends.sessions}
        </span>
        <span style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: data.trends.avgStars.startsWith('+') ? AppColors.successGreen : AppColors.errorRose }}>
          Stars: {data.trends.avgStars}
        </span>
      </div>
    )}

    {/* Lessons */}
    {data.lessons && data.lessons.length > 0 && (
      <div style={{ marginTop: 'clamp(10px, 2.5vw, 14px)' }}>
        <div style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary, marginBottom: 'clamp(6px, 1.5vw, 8px)' }}>Lessons:</div>
        <div style={{ display: 'grid', gap: 'clamp(8px, 2vw, 10px)' }}>
          {data.lessons.slice(0, 5).map((lesson) => (
            <div
              key={lesson.missionId}
              style={{
                background: lesson.warning ? 'rgba(239, 68, 68, 0.1)' : AppColors.surfaceMedium,
                padding: 'clamp(10px, 2.5vw, 12px)',
                borderRadius: 'clamp(8px, 2vw, 10px)',
                border: lesson.warning ? `1px solid ${AppColors.errorRose}` : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: lesson.topStruggles?.length ? 'clamp(6px, 1.5vw, 8px)' : 0 }}>
                <span style={{ fontSize: 'clamp(13px, 2.8vw, 14px)', fontWeight: 500, color: AppColors.textPrimary }}>
                  {lesson.title}
                  {lesson.warning && <span style={{ color: AppColors.errorRose, marginLeft: '6px' }}>⚠️</span>}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.5vw, 14px)' }}>
                  <span style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary }}>{lesson.completions} sessions</span>
                  <span style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: lesson.avgStars < 3 ? AppColors.errorRose : AppColors.whisperAmber }}>{lesson.avgStars} ⭐</span>
                </div>
              </div>
              {lesson.topStruggles && lesson.topStruggles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(4px, 1vw, 6px)' }}>
                  <span style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: AppColors.textSecondary }}>Struggles:</span>
                  {lesson.topStruggles.slice(0, 3).map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(251, 191, 36, 0.15)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: 'clamp(10px, 2vw, 11px)',
                        color: AppColors.whisperAmber,
                      }}
                    >
                      {s.word} ({s.count})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Top Struggles */}
    {data.topStruggles && data.topStruggles.length > 0 && (
      <div style={{ marginTop: 'clamp(10px, 2.5vw, 14px)' }}>
        <div style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary, marginBottom: 'clamp(6px, 1.5vw, 8px)' }}>Top Struggles (all lessons):</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px, 1.5vw, 8px)' }}>
          {data.topStruggles.slice(0, 5).map((struggle, idx) => (
            <span
              key={idx}
              style={{
                background: struggle.severity === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)',
                borderRadius: 'clamp(6px, 1.5vw, 8px)',
                fontSize: 'clamp(11px, 2.2vw, 12px)',
                color: AppColors.textPrimary,
              }}
            >
              {struggle.text} ({struggle.count})
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Students */}
    {data.students && data.students.length > 0 && (
      <div style={{ marginTop: 'clamp(12px, 3vw, 16px)' }}>
        <div style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary, marginBottom: 'clamp(6px, 1.5vw, 8px)' }}>Students:</div>
        <div style={{ display: 'grid', gap: 'clamp(6px, 1.5vw, 8px)' }}>
          {data.students.slice(0, 5).map((student) => (
            <div key={student.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(6px, 1.5vw, 8px)', background: AppColors.surfaceMedium, borderRadius: 'clamp(6px, 1.5vw, 8px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 10px)' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: student.activityStatus === 'active' ? AppColors.successGreen : student.activityStatus === 'warning' ? AppColors.whisperAmber : AppColors.errorRose,
                  }}
                />
                <span style={{ fontSize: 'clamp(13px, 2.8vw, 14px)', color: AppColors.textPrimary }}>{student.displayName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.5vw, 14px)' }}>
                <span style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary }}>{student.sessionCount} sessions</span>
                <span style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.whisperAmber }}>{student.avgStars.toFixed(1)} ⭐</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      background: AppColors.surfaceLight,
      borderRadius: 'clamp(12px, 3vw, 16px)',
      padding: 'clamp(30px, 8vw, 50px)',
      textAlign: 'center',
    }}
  >
    <div style={{ color: AppColors.textSecondary, marginBottom: 'clamp(10px, 2.5vw, 12px)' }}>
      <BarChartIcon size={40} />
    </div>
    <p style={{ fontSize: 'clamp(13px, 2.8vw, 14px)', color: AppColors.textSecondary, margin: 0 }}>
      {message}
    </p>
  </div>
);

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  data,
  loading,
  period,
  level,
  onPeriodChange,
  onLevelChange,
}) => {
  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 'clamp(10px, 2.5vw, 14px)', marginBottom: 'clamp(16px, 4vw, 20px)', flexWrap: 'wrap' }}>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as AnalyticsPeriod)}
          style={selectStyle}
        >
          <option value="week" style={optionStyle}>This Week</option>
          <option value="month" style={optionStyle}>This Month</option>
          <option value="all-time" style={optionStyle}>All Time</option>
        </select>
        <select
          value={level}
          onChange={(e) => onLevelChange(e.target.value as AnalyticsLevel)}
          style={selectStyle}
        >
          <option value="all" style={optionStyle}>All Levels</option>
          <option value="A1" style={optionStyle}>A1 - Beginner</option>
          <option value="A2" style={optionStyle}>A2 - Elementary</option>
          <option value="B1" style={optionStyle}>B1 - Intermediate</option>
          <option value="B2" style={optionStyle}>B2 - Upper-Intermediate</option>
          <option value="C1" style={optionStyle}>C1 - Advanced</option>
          <option value="C2" style={optionStyle}>C2 - Proficient</option>
        </select>
      </div>

      {loading ? (
        <div
          style={{
            background: AppColors.surfaceLight,
            borderRadius: 'clamp(12px, 3vw, 16px)',
            padding: 'clamp(30px, 8vw, 50px)',
            textAlign: 'center',
            color: AppColors.textSecondary,
          }}
        >
          Loading analytics...
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'clamp(10px, 2.5vw, 14px)', marginBottom: 'clamp(20px, 5vw, 28px)' }}>
            <StatCard label="Students" value={data.totals.studentCount} />
            <StatCard label="Sessions" value={data.totals.sessionCount} />
            <StatCard label="Avg Stars" value={`${data.totals.avgStars.toFixed(1)} ⭐`} color={AppColors.whisperAmber} />
            <StatCard label="Practice Time" value={`${data.totals.totalPracticeMinutes}m`} color={AppColors.accentBlue} />
          </div>

          {/* Cost Section */}
          {data.costs && (
            <CostSection costs={data.costs} studentCosts={data.studentCosts} />
          )}

          {/* Level Breakdown */}
          {Object.entries(data.byLevel).map(([levelKey, levelData]) => (
            <LevelBreakdown key={levelKey} level={levelKey} data={levelData} />
          ))}

          {Object.keys(data.byLevel).length === 0 && (
            <EmptyState message="No session data found for the selected period and level." />
          )}
        </>
      ) : (
        <EmptyState message="Unable to load analytics data. Please try again later." />
      )}
    </div>
  );
};
