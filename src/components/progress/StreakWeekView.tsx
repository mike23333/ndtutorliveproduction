/**
 * Streak Week View
 * Shows 7-day calendar with practice indicators
 */

import { AppColors } from '../../theme/colors';
import { FireIcon, StarIcon } from '../../theme/icons';
import { DayData } from '../../hooks/useStreakCalendar';

interface StreakWeekViewProps {
  weekDays: DayData[];
  currentStreak: number;
  longestStreak: number;
}

export default function StreakWeekView({
  weekDays,
  currentStreak,
  longestStreak
}: StreakWeekViewProps) {
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
        Your Streak
      </h3>

      {/* Week Calendar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        {weekDays.map((day) => (
          <div
            key={day.date}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {/* Day label */}
            <span style={{
              fontSize: '12px',
              fontWeight: '500',
              color: day.isToday ? AppColors.accent : AppColors.textSecondary,
            }}>
              {day.dayLabel}
            </span>

            {/* Circle indicator */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: day.practiced
                ? AppColors.successGreen
                : day.isToday
                  ? 'rgba(139, 92, 246, 0.3)'
                  : 'rgba(255, 255, 255, 0.1)',
              border: day.isToday ? `2px solid ${AppColors.accentPurple}` : 'none',
            }}>
              {day.practiced && (
                <span style={{ color: 'white', fontSize: '14px' }}>
                  {'\u2713'}
                </span>
              )}
            </div>

            {/* Today indicator */}
            {day.isToday && (
              <span style={{
                fontSize: '10px',
                color: AppColors.accentPurple,
                position: 'absolute',
                marginTop: '70px',
              }}>
                today
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        backgroundColor: AppColors.borderColor,
        margin: '16px 0',
      }} />

      {/* Stats Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
      }}>
        {/* Current Streak */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <FireIcon size={24} color={AppColors.whisperAmber} />
          <div>
            <div style={{
              fontSize: 'clamp(18px, 4.5vw, 22px)',
              fontWeight: '700',
              color: AppColors.whisperAmber,
            }}>
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </div>
            <div style={{
              fontSize: '12px',
              color: AppColors.textSecondary,
            }}>
              current streak
            </div>
          </div>
        </div>

        {/* Best Streak */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <StarIcon size={24} color={AppColors.whisperAmber} />
          <div>
            <div style={{
              fontSize: 'clamp(18px, 4.5vw, 22px)',
              fontWeight: '700',
              color: AppColors.whisperAmber,
            }}>
              {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
            </div>
            <div style={{
              fontSize: '12px',
              color: AppColors.textSecondary,
            }}>
              best streak
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
