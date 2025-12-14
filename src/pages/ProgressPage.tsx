/**
 * Progress Page - Redesigned
 * Premium dashboard with stunning visuals and engaging interactions
 * Inspired by world-class fitness and learning app design
 */

import { AppColors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { useMistakesByType } from '../hooks/useMistakesByType';
import { useStreakCalendar } from '../hooks/useStreakCalendar';
import { usePracticeHistory } from '../hooks/usePracticeHistory';
import {
  ProgressHero,
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

  // Check if today is completed (has practice)
  const todayCompleted = streakData.weekDays.find(d => d.isToday)?.practiced || false;

  // User's display name
  const displayName = userDocument?.displayName?.split(' ')[0] || undefined;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: AppColors.bgPrimary,
      color: AppColors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        .progress-content::-webkit-scrollbar { width: 0; display: none; }
        .progress-content { -ms-overflow-style: none; scrollbar-width: none; }
        @media (min-width: 640px) {
          .progress-content { max-width: 540px; margin: 0 auto; }
        }
        @media (min-width: 1024px) {
          .progress-content { max-width: 640px; }
        }
      `}</style>

      {/* Scrollable content */}
      <div
        className="progress-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Hero Section with Streak Ring */}
        <ProgressHero
          currentStreak={streakData.currentStreak}
          longestStreak={streakData.longestStreak}
          todayCompleted={todayCompleted}
          userName={displayName}
        />

        {/* Content sections */}
        <div style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* Week View Section - Right below the streak hero */}
          <section>
            <StreakWeekView
              weekDays={streakData.weekDays}
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
            />
          </section>

          {/* Areas to Improve Section */}
          <section>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: AppColors.textPrimary,
                letterSpacing: '-0.3px',
              }}>
                Areas to Improve
              </h2>
              {totalMistakes > 0 && (
                <span style={{
                  fontSize: '13px',
                  color: AppColors.textSecondary,
                  fontWeight: '500',
                }}>
                  {totalMistakes} total
                </span>
              )}
            </div>

            {mistakesLoading ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: '140px',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    }}
                  />
                ))}
              </div>
            ) : totalMistakes === 0 ? (
              <div style={{
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                borderRadius: '24px',
                padding: '32px 24px',
                textAlign: 'center',
                border: '1px solid rgba(74, 222, 128, 0.2)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Decorative gradient */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-25%',
                  width: '150%',
                  height: '150%',
                  background: 'radial-gradient(ellipse at center, rgba(74, 222, 128, 0.1) 0%, transparent 60%)',
                  pointerEvents: 'none',
                }} />

                <span style={{
                  fontSize: '48px',
                  display: 'block',
                  marginBottom: '12px',
                  position: 'relative',
                }}>
                  {'\u{1F389}'}
                </span>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: AppColors.successGreen,
                  position: 'relative',
                }}>
                  All caught up!
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: AppColors.textSecondary,
                  position: 'relative',
                }}>
                  No mistakes to review. Keep practicing!
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

          {/* Achievements Section */}
          <section>
            <BadgesPreview userId={user?.uid} />
          </section>
        </div>
      </div>
    </div>
  );
}
