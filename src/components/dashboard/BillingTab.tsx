import React from 'react';
import { AppColors } from '../../theme/colors';
import { BarChartIcon } from '../../theme/icons';
import type { AnalyticsData, AnalyticsPeriod, CostData, StudentCostData } from '../../types/dashboard';

interface BillingTabProps {
  data: AnalyticsData | null;
  loading: boolean;
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
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

const CostCard: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div
    style={{
      background: AppColors.surfaceMedium,
      borderRadius: 'clamp(8px, 2vw, 10px)',
      padding: 'clamp(12px, 3vw, 16px)',
    }}
  >
    <div
      style={{
        fontSize: 'clamp(10px, 2vw, 11px)',
        color: AppColors.textSecondary,
        marginBottom: 'clamp(4px, 1vw, 6px)',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 'clamp(20px, 5vw, 26px)',
        fontWeight: 700,
        color: color || AppColors.textPrimary,
      }}
    >
      {value}
    </div>
  </div>
);

const CostSection: React.FC<{ costs: CostData; studentCosts?: StudentCostData[] }> = ({
  costs,
  studentCosts,
}) => (
  <div
    style={{
      background: AppColors.surfaceLight,
      borderRadius: 'clamp(12px, 3vw, 16px)',
      padding: 'clamp(16px, 4vw, 20px)',
    }}
  >
    <h3
      style={{
        fontSize: 'clamp(16px, 3.5vw, 18px)',
        fontWeight: 600,
        margin: '0 0 clamp(16px, 4vw, 20px) 0',
        color: AppColors.accentBlue,
      }}
    >
      API Costs (Gemini 2.5 Flash Live)
    </h3>

    {/* Cost Overview Cards */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 'clamp(10px, 2.5vw, 14px)',
        marginBottom: 'clamp(18px, 4.5vw, 24px)',
      }}
    >
      <CostCard label="Total Cost" value={formatCurrency(costs.totalCost)} />
      <CostCard label="Per Student" value={formatCurrency(costs.costPerStudent)} color={AppColors.accentPurple} />
      <CostCard label="Daily Avg" value={formatCurrency(costs.dailyCost)} color={AppColors.successGreen} />
      <CostCard label="Monthly Est." value={formatCurrency(costs.monthlyCost)} color={AppColors.whisperAmber} />
    </div>

    {/* Token Usage */}
    <div
      style={{
        display: 'flex',
        gap: 'clamp(16px, 4vw, 24px)',
        marginBottom: 'clamp(18px, 4.5vw, 24px)',
        flexWrap: 'wrap',
        padding: 'clamp(12px, 3vw, 16px)',
        background: AppColors.surfaceMedium,
        borderRadius: 'clamp(8px, 2vw, 10px)',
      }}
    >
      <div style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary }}>
        Input:{' '}
        <span style={{ color: AppColors.textPrimary, fontWeight: 500 }}>
          {formatTokens(costs.inputTokens)} tokens
        </span>
        <span style={{ color: AppColors.textSecondary }}> ($3/1M)</span>
      </div>
      <div style={{ fontSize: 'clamp(12px, 2.5vw, 13px)', color: AppColors.textSecondary }}>
        Output:{' '}
        <span style={{ color: AppColors.textPrimary, fontWeight: 500 }}>
          {formatTokens(costs.outputTokens)} tokens
        </span>
        <span style={{ color: AppColors.textSecondary }}> ($12/1M)</span>
      </div>
    </div>

    {/* Per-Student Breakdown */}
    {studentCosts && studentCosts.length > 0 && (
      <div>
        <h4
          style={{
            fontSize: 'clamp(13px, 2.8vw, 14px)',
            fontWeight: 500,
            color: AppColors.textSecondary,
            margin: '0 0 clamp(10px, 2.5vw, 14px) 0',
          }}
        >
          Cost by Student
        </h4>
        <div
          style={{
            display: 'grid',
            gap: 'clamp(8px, 2vw, 10px)',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {studentCosts.map((student) => (
            <div
              key={student.userId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'clamp(10px, 2.5vw, 14px)',
                background: AppColors.surfaceMedium,
                borderRadius: 'clamp(8px, 2vw, 10px)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 'clamp(13px, 2.8vw, 14px)',
                    color: AppColors.textPrimary,
                    fontWeight: 500,
                  }}
                >
                  {student.displayName}
                </span>
                <span
                  style={{
                    fontSize: 'clamp(11px, 2.2vw, 12px)',
                    color: AppColors.textSecondary,
                    marginLeft: '8px',
                  }}
                >
                  ({student.sessionCount} sessions)
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 'clamp(14px, 3vw, 16px)',
                    fontWeight: 600,
                    color: AppColors.accentPurple,
                  }}
                >
                  {formatCurrency(student.totalCost)}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(10px, 2vw, 11px)',
                    color: AppColors.textSecondary,
                  }}
                >
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

export const BillingTab: React.FC<BillingTabProps> = ({
  data,
  loading,
  period,
  onPeriodChange,
}) => {
  return (
    <div>
      {/* Period filter */}
      <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as AnalyticsPeriod)}
          style={selectStyle}
        >
          <option value="week" style={optionStyle}>This Week</option>
          <option value="month" style={optionStyle}>This Month</option>
          <option value="all-time" style={optionStyle}>All Time</option>
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
          Loading billing data...
        </div>
      ) : data?.costs ? (
        <CostSection costs={data.costs} studentCosts={data.studentCosts} />
      ) : (
        <EmptyState message="No billing data available for the selected period." />
      )}
    </div>
  );
};
