/**
 * Practice Time Card - Redesigned
 * Beautiful visualization with circular progress and bar chart
 * Premium glass-morphic design
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
  const maxMinutes = Math.max(dailyGoalMinutes, ...weekData.map(d => d.minutes));
  const circumference = 2 * Math.PI * 36;
  const progressOffset = circumference - (Math.min(todayGoalPercent, 100) / 100) * circumference;
  const goalMet = todayGoalPercent >= 100;

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes progress-fill {
          from { stroke-dashoffset: ${circumference}; }
        }
        .progress-ring {
          animation: progress-fill 1s ease-out;
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '17px',
          fontWeight: '600',
          color: AppColors.textPrimary,
        }}>
          Practice Time
        </h3>
        <span style={{
          fontSize: '24px',
          fontWeight: '700',
          color: AppColors.accentBlue,
        }}>
          {formatPracticeTime(totalSeconds)}
        </span>
      </div>

      {/* Main stats row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '24px',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '16px',
      }}>
        {/* Today's progress ring */}
        <div style={{
          position: 'relative',
          width: '88px',
          height: '88px',
          flexShrink: 0,
        }}>
          <svg
            style={{ transform: 'rotate(-90deg)' }}
            viewBox="0 0 88 88"
          >
            <defs>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={goalMet ? AppColors.successGreen : AppColors.accentBlue} />
                <stop offset="100%" stopColor={goalMet ? '#22c55e' : '#3b82f6'} />
              </linearGradient>
            </defs>

            {/* Background track */}
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="6"
            />

            {/* Progress arc */}
            <circle
              className="progress-ring"
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="url(#progress-gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
            />
          </svg>

          {/* Center text */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '20px',
              fontWeight: '700',
              color: goalMet ? AppColors.successGreen : AppColors.textPrimary,
            }}>
              {todayGoalPercent}%
            </span>
            <span style={{
              fontSize: '10px',
              color: AppColors.textSecondary,
            }}>
              today
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Daily average */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '13px',
              color: AppColors.textSecondary,
            }}>
              Daily average
            </span>
            <span style={{
              fontSize: '15px',
              fontWeight: '600',
              color: AppColors.textPrimary,
            }}>
              {dailyAverageMinutes} min
            </span>
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          }} />

          {/* Daily goal */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '13px',
              color: AppColors.textSecondary,
            }}>
              Daily goal
            </span>
            <span style={{
              fontSize: '15px',
              fontWeight: '600',
              color: AppColors.accent,
            }}>
              {dailyGoalMinutes} min
            </span>
          </div>
        </div>
      </div>

      {/* Week bar chart */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: '80px',
        gap: '8px',
      }}>
        {weekData.map((day, index) => {
          const barHeight = maxMinutes > 0
            ? Math.max(8, (day.minutes / maxMinutes) * 60)
            : 8;
          const meetsGoal = day.percentOfGoal >= 100;
          const isToday = index === weekData.length - 1; // Assuming last day is today

          return (
            <div
              key={day.date}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
              }}
            >
              {/* Minutes label (shown on hover, or for notable values) */}
              {day.minutes > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  color: meetsGoal ? AppColors.successGreen : AppColors.textSecondary,
                  height: '14px',
                }}>
                  {day.minutes}m
                </span>
              )}

              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '32px',
                  height: `${barHeight}px`,
                  backgroundColor: meetsGoal
                    ? AppColors.successGreen
                    : day.minutes > 0
                      ? AppColors.accentPurple
                      : 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  transition: 'height 0.5s ease-out, background-color 0.3s ease',
                  boxShadow: meetsGoal
                    ? '0 4px 12px rgba(74, 222, 128, 0.25)'
                    : day.minutes > 0
                      ? '0 2px 8px rgba(216, 180, 254, 0.15)'
                      : 'none',
                }}
              />

              {/* Day label */}
              <span style={{
                fontSize: '11px',
                fontWeight: isToday ? '600' : '500',
                color: isToday ? AppColors.accent : AppColors.textSecondary,
              }}>
                {day.dayLabel.slice(0, 1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Goal line indicator */}
      <div style={{
        position: 'absolute',
        right: '24px',
        bottom: '100px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <div style={{
          width: '12px',
          height: '2px',
          backgroundColor: AppColors.accent,
          borderRadius: '1px',
        }} />
        <span style={{
          fontSize: '10px',
          color: AppColors.textMuted,
        }}>
          goal
        </span>
      </div>
    </div>
  );
}
