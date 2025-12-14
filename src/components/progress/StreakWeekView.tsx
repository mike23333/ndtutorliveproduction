/**
 * Streak Week View - Redesigned
 * Beautiful 7-day calendar with elegant day indicators
 * Premium glass card with subtle animations
 */

import { AppColors } from '../../theme/colors';
import { DayData } from '../../hooks/useStreakCalendar';

interface StreakWeekViewProps {
  weekDays: DayData[];
  currentStreak: number;
  longestStreak: number;
}

export default function StreakWeekView({
  weekDays,
  currentStreak: _currentStreak,
  longestStreak: _longestStreak,
}: StreakWeekViewProps) {
  // Props kept for API compatibility but displayed in ProgressHero now
  void _currentStreak;
  void _longestStreak;
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
        @keyframes check-pop {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes today-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(216, 180, 254, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(216, 180, 254, 0); }
        }
        .day-practiced .check-mark {
          animation: check-pop 0.3s ease-out;
        }
        .day-today {
          animation: today-pulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Subtle gradient accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent 0%, ${AppColors.accent}40 50%, transparent 100%)`,
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '17px',
          fontWeight: '600',
          color: AppColors.textPrimary,
        }}>
          This Week
        </h3>
        <span style={{
          fontSize: '13px',
          color: AppColors.textSecondary,
        }}>
          {weekDays.filter(d => d.practiced).length} of 7 days
        </span>
      </div>

      {/* Week Calendar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        {weekDays.map((day) => {
          const isCompleted = day.practiced;
          const isFuture = !day.isToday && new Date(day.date) > new Date();

          return (
            <div
              key={day.date}
              className={`${isCompleted ? 'day-practiced' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                flex: 1,
              }}
            >
              {/* Day label */}
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: day.isToday
                  ? AppColors.accent
                  : AppColors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {day.dayLabel.slice(0, 1)}
              </span>

              {/* Day indicator */}
              <div
                className={day.isToday && !isCompleted ? 'day-today' : ''}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCompleted
                    ? AppColors.successGreen
                    : day.isToday
                      ? 'rgba(216, 180, 254, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border: day.isToday && !isCompleted
                    ? `2px solid ${AppColors.accent}`
                    : isCompleted
                      ? 'none'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.3s ease',
                  boxShadow: isCompleted
                    ? '0 4px 12px rgba(74, 222, 128, 0.3)'
                    : 'none',
                }}
              >
                {isCompleted ? (
                  <span className="check-mark" style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600',
                  }}>
                    ✓
                  </span>
                ) : isFuture ? (
                  <span style={{
                    color: AppColors.textMuted,
                    fontSize: '10px'
                  }}>
                    •
                  </span>
                ) : day.isToday ? (
                  <span style={{
                    color: AppColors.accent,
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    ?
                  </span>
                ) : (
                  <span style={{
                    color: AppColors.textMuted,
                    fontSize: '16px'
                  }}>
                    –
                  </span>
                )}
              </div>

              {/* Today label */}
              {day.isToday && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  color: AppColors.accent,
                  marginTop: '-4px',
                }}>
                  today
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
