/**
 * Progress Page
 * Main dashboard showing mistakes, streaks, badges, and practice time
 */

import { AppColors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { useMistakesByType } from '../hooks/useMistakesByType';
import { useStreakCalendar } from '../hooks/useStreakCalendar';
import { usePracticeHistory } from '../hooks/usePracticeHistory';
import {
  MistakeTypeCard,
  StreakWeekView,
  BadgesPreview,
  PracticeTimeCard,
} from '../components/progress';

export default function ProgressPage() {
  const { user, userDocument } = useAuth();
  const { mistakes, loading: mistakesLoading } = useMistakesByType(user?.uid);
  const streakData = useStreakCalendar(userDocument);
  const practiceData = usePracticeHistory(userDocument);

  // Calculate total mistakes
  const totalMistakes = mistakes.reduce((sum, m) => sum + m.count, 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: AppColors.bgPrimary,
      color: AppColors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Header */}
        <div style={{
          padding: 'clamp(16px, 4vw, 24px)',
          paddingTop: 'clamp(20px, 5vw, 32px)',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(24px, 6vw, 32px)',
            fontWeight: '700',
          }}>
            Progress
          </h1>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            color: AppColors.textSecondary,
          }}>
            Track your learning journey
          </p>
        </div>

        {/* Content */}
        <div style={{
          padding: '0 clamp(16px, 4vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(16px, 4vw, 24px)',
        }}>
          {/* Mistakes Section */}
          <section>
            <h2 style={{
              margin: '0 0 12px 0',
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: '600',
              color: AppColors.textPrimary,
            }}>
              Areas to Improve
            </h2>

            {mistakesLoading ? (
              <div style={{
                backgroundColor: AppColors.surfaceMedium,
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                color: AppColors.textSecondary,
              }}>
                Loading...
              </div>
            ) : totalMistakes === 0 ? (
              <div style={{
                backgroundColor: AppColors.surfaceMedium,
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>
                  {'\u{1F389}'}
                </span>
                <p style={{
                  margin: 0,
                  color: AppColors.successGreen,
                  fontWeight: '600',
                }}>
                  No mistakes to review!
                </p>
                <p style={{
                  margin: '4px 0 0 0',
                  color: AppColors.textSecondary,
                  fontSize: '14px',
                }}>
                  Keep practicing to maintain your progress.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}>
                {mistakes.map((mistake) => (
                  <MistakeTypeCard
                    key={mistake.type}
                    type={mistake.type}
                    count={mistake.count}
                    newThisWeek={mistake.newThisWeek}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Streaks Section */}
          <section>
            <StreakWeekView
              weekDays={streakData.weekDays}
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
            />
          </section>

          {/* Badges Section */}
          <section>
            <BadgesPreview userId={user?.uid} />
          </section>

          {/* Practice Time Section */}
          <section>
            <PracticeTimeCard
              totalSeconds={practiceData.totalSeconds}
              dailyAverageMinutes={practiceData.dailyAverageMinutes}
              dailyGoalMinutes={practiceData.dailyGoalMinutes}
              todayGoalPercent={practiceData.todayGoalPercent}
              weekData={practiceData.weekData}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
