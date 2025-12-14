/**
 * Practice Time Card
 * Shows total practice time, daily average, goal progress, and week chart
 */

import { AppColors } from '../../theme/colors';
import { formatPracticeTime } from '../../hooks/usePracticeHistory';

interface WeekDayData {
  date: string;
  dayLabel: string;
  minutes: number;
  percentOfGoal: number;
}

interface PracticeTimeCardProps {
  totalSeconds: number;
  dailyAverageMinutes: number;
  dailyGoalMinutes: number;
  todayGoalPercent: number;
  weekData: WeekDayData[];
}

export default function PracticeTimeCard({
  totalSeconds,
  dailyAverageMinutes,
  dailyGoalMinutes,
  todayGoalPercent,
  weekData,
}: PracticeTimeCardProps) {
  // Find max minutes in week for chart scaling
  const maxMinutes = Math.max(dailyGoalMinutes, ...weekData.map(d => d.minutes));

  return (
    <div style={{
      backgroundColor: AppColors.surfaceMedium,
      borderRadius: '20px',
      padding: 'clamp(16px, 4vw, 24px)',
    }}>
      {/* Header */}
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: 'clamp(16px, 4vw, 18px)',
        fontWeight: '700',
        color: AppColors.textPrimary,
      }}>
        Practice Time
      </h3>

      {/* Total Time - Large Display */}
      <div style={{
        textAlign: 'center',
        marginBottom: '16px',
      }}>
        <div style={{
          fontSize: 'clamp(32px, 8vw, 42px)',
          fontWeight: '700',
          color: AppColors.accentBlue,
        }}>
          {formatPracticeTime(totalSeconds)}
        </div>
        <div style={{
          fontSize: '14px',
          color: AppColors.textSecondary,
        }}>
          total practice
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        backgroundColor: AppColors.borderColor,
        margin: '16px 0',
      }} />

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '20px',
      }}>
        {/* Daily Average */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'clamp(18px, 4.5vw, 22px)',
            fontWeight: '700',
            color: AppColors.textPrimary,
          }}>
            {dailyAverageMinutes} min
          </div>
          <div style={{
            fontSize: '11px',
            color: AppColors.textSecondary,
          }}>
            daily average
          </div>
        </div>

        {/* Daily Goal */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'clamp(18px, 4.5vw, 22px)',
            fontWeight: '700',
            color: AppColors.textPrimary,
          }}>
            {dailyGoalMinutes} min
          </div>
          <div style={{
            fontSize: '11px',
            color: AppColors.textSecondary,
          }}>
            daily goal
          </div>
        </div>

        {/* Today's Progress */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'clamp(18px, 4.5vw, 22px)',
            fontWeight: '700',
            color: todayGoalPercent >= 100 ? AppColors.successGreen : AppColors.accentPurple,
          }}>
            {todayGoalPercent}%
          </div>
          <div style={{
            fontSize: '11px',
            color: AppColors.textSecondary,
          }}>
            of goal today
          </div>
        </div>
      </div>

      {/* Week Bar Chart */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: '60px',
        paddingTop: '8px',
      }}>
        {weekData.map((day) => {
          const barHeight = maxMinutes > 0
            ? Math.max(4, (day.minutes / maxMinutes) * 52)
            : 4;

          return (
            <div
              key={day.date}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                flex: 1,
              }}
            >
              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '24px',
                  height: `${barHeight}px`,
                  backgroundColor: day.percentOfGoal >= 100
                    ? AppColors.successGreen
                    : day.minutes > 0
                      ? AppColors.accentPurple
                      : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  transition: 'height 0.3s ease',
                }}
              />
              {/* Day label */}
              <span style={{
                fontSize: '10px',
                color: AppColors.textSecondary,
              }}>
                {day.dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
