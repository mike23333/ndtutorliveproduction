# Homepage & Retention Improvements Plan

## Overview

This document outlines improvements to increase student engagement, retention, and daily active usage. The changes focus on four areas:

1. **Simplified Homepage** - Faster to action, less cognitive load
2. **Assignment System** - Teacher-driven accountability
3. **Enhanced Streaks** - Habit formation mechanics
4. **First-Run Experience** - Onboarding for new students

---

## Part 1: Simplified Homepage

### Current Problems

- Lesson carousel requires swiping to see options
- Images on cards add visual weight without information value
- Stats section competes for attention with actionable items
- "Tools" section (Create Own, Pronunciation) clutters main flow
- Category filter pills rarely useful when teachers control content

### New Homepage Structure

```
┌─────────────────────────────────────────┐
│ Hi [Name]                        🔥 7   │  Header
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ▶  Continue Practice           │    │  Primary Action Card
│  │     "Ordering at a Café"        │    │  (Continue OR Smart Start)
│  │     3 min left • A2             │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │  ✨ Weekly Review               │    │  Weekly Review
│  │     Practice 6 words from       │    │  (when available)
│  │     this week                   │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  From [Teacher Name]          See all → │  Assignment Section
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │☐ Café│  │☐ Bank│  │✓ Shop│          │  Compact Grid
│  │  A2  │  │  B1  │  │  A2  │          │  (no images)
│  │ 5min │  │ 7min │  │ done │          │
│  └──────┘  └──────┘  └──────┘          │
│                                         │
└─────────────────────────────────────────┘
```

### Components to Modify

#### 1. Header Component (Keep, Minor Changes)

**Current:** Name + Streak + Profile button
**Change:** Make streak more tappable (leads to streak details)

```typescript
// Header shows streak status
<Header
  userName={name}
  streakDays={streak}
  streakAtRisk={!practicedToday && isAfter5PM}  // NEW
  onStreakTap={() => navigate('/profile#streak')}  // NEW
  onProfileClick={() => navigate('/profile')}
/>
```

#### 2. PrimaryActionCard (New Component)

Replaces the "Continue Learning" card with smarter logic:

```typescript
interface PrimaryActionCardProps {
  // Displays ONE of these based on priority:
  inProgressLesson?: Lesson;      // Priority 1: Continue where left off
  weeklyReview?: ReviewLesson;    // Priority 2: Weekly review available
  nextAssignment?: Assignment;    // Priority 3: Next unfinished assignment
  smartDefault?: Lesson;          // Priority 4: Best lesson for level
}
```

**Logic:**
1. If `inProgressLesson` exists → "Continue Practice"
2. Else if `weeklyReview` available → "Weekly Review"
3. Else if `nextAssignment` exists → "Start [Assignment Name]"
4. Else → "Start Practice" with smart default

#### 3. AssignmentGrid (New Component)

Replaces carousel with compact grid:

```typescript
interface AssignmentGridProps {
  teacherName: string;
  assignments: Assignment[];
  maxVisible?: number;  // Default 6
  onLessonClick: (lesson: Lesson) => void;
  onSeeAll: () => void;
}

interface Assignment {
  lesson: Lesson;
  completed: boolean;
  completedAt?: Date;
  dueDate?: Date;  // Future: for deadline feature
}
```

**Card Design (Compact, No Images):**

```
┌────────────┐
│ ☐ / ✓     │  Completion indicator
│            │
│ At the    │  Title (2 lines max)
│ Café      │
│            │
│ A2 • 5min │  Level + Duration
└────────────┘
```

**Styling:**
- Width: `calc(33% - 8px)` (3 columns)
- Height: ~100px
- Border: Subtle, becomes green when completed
- Checkmark overlay when done

#### 4. Rename/Reorganize

| Component | Change |
|-----------|--------|
| `ToolsSection` | Rename to "Quick Practice" or "Practice More" — keep on homepage below assignments |
| `MyPracticeSection` (custom lessons) | Keep below Quick Practice section |
| Stats grid (Lessons/Minutes/Stars) | Move to Profile page |
| `CategoryFilter` | Remove entirely |
| `PaginationDots` | Remove (no carousel) |

**Renamed Tools Section:**

Current name "Tools" is vague. Better options:

| Option | Vibe |
|--------|------|
| **Quick Practice** | Action-oriented, implies speed |
| **Practice More** | Encourages additional practice |
| **Extra Practice** | Supplementary to assignments |
| **Free Practice** | Self-directed, no assignment |

Recommendation: **"Quick Practice"** — communicates fast, self-directed options.

```
┌─────────────────────────────────────────┐
│  Quick Practice                         │
│                                         │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ ✨ Create   │  │ 🎯 Pronun-  │       │
│  │    Your Own │  │    ciation  │       │
│  │             │  │    Coach    │       │
│  └─────────────┘  └─────────────┘       │
│                                         │
└─────────────────────────────────────────┘
```

This positions them as "bonus" practice beyond teacher assignments.

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/HomePage.tsx` | Major restructure - remove carousel, add grid |
| `src/components/home/index.ts` | Export new components |
| `src/components/home/PrimaryActionCard.tsx` | NEW - smart start button |
| `src/components/home/AssignmentGrid.tsx` | NEW - compact lesson grid |
| `src/components/home/CompactLessonCard.tsx` | NEW - no-image lesson card |
| `src/pages/ProfilePage.tsx` | Add Tools section, Stats, Custom lessons |

---

## Part 2: Completion Tracking (No New Collections Needed)

### Existing Data Already Handles This

After reviewing the codebase, we don't need a new `assignments` collection. The existing structure already supports everything:

| Need | Existing Solution |
|------|-------------------|
| What to practice | `MissionDocument` with `targetLevel` |
| Who sees what | `getMissionsForStudent()` filters by teacher + level |
| Who completed what | `uniqueScenariosCompleted` on `UserDocument` |
| Session details | `SessionDocument` tracks every session |

### How It Works

**Missions are implicitly "assigned" via level:**
- Teacher creates mission with `targetLevel: 'A2'`
- All A2 students see it automatically
- No separate assignment step needed

**Completion is already tracked:**
```typescript
// UserDocument already has:
interface UserDocument {
  uniqueScenariosCompleted?: string[];  // Array of missionIds
  // ... other fields
}
```

### Changes Needed

#### 1. Homepage: Show Completion Status

```typescript
// In HomePage.tsx
const completedMissionIds = userDocument?.uniqueScenariosCompleted || [];

// When mapping lessons for display
const lessonsWithStatus = lessons.map(lesson => ({
  ...lesson,
  completed: completedMissionIds.includes(lesson.id)
}));
```

#### 2. CompactLessonCard: Display Checkmark

```typescript
interface CompactLessonCardProps {
  lesson: Lesson;
  completed: boolean;  // NEW
  onClick: () => void;
}
```

Card shows ✓ when completed, ○ when not.

#### 3. Teacher Dashboard: Completion Rates

Query sessions to show completion per mission:

```typescript
// Get completion stats for a mission
async function getMissionCompletionStats(
  teacherId: string,
  missionId: string
): Promise<{ completed: number; total: number; students: string[] }> {
  // 1. Get all students for this teacher
  const students = await getStudentsForTeacher(teacherId);

  // 2. Filter to students whose level matches mission's targetLevel
  const eligibleStudents = students.filter(s =>
    s.uniqueScenariosCompleted?.includes(missionId) !== undefined
  );

  // 3. Count completed
  const completedStudents = eligibleStudents.filter(s =>
    s.uniqueScenariosCompleted?.includes(missionId)
  );

  return {
    completed: completedStudents.length,
    total: eligibleStudents.length,
    students: completedStudents.map(s => s.displayName)
  };
}
```

#### 4. LessonsTab: Show Completion Bar

```
┌─────────────────────────────────────────────────┐
│ "At the Café"                          A2 • 5min│
│                                                 │
│ ████████████████░░░░░░░░░░ 18/24 completed      │
└─────────────────────────────────────────────────┘
```

### What We're NOT Building

- ❌ Separate `assignments` collection (redundant)
- ❌ Due dates (keep it simple for launch)
- ❌ Individual student assignment (level-based is enough)
- ❌ Assignment notifications (future feature)

### Future Enhancement: Due Dates

If needed later, add to `MissionDocument`:

```typescript
interface MissionDocument {
  // ... existing fields ...
  dueDate?: Timestamp;  // Optional deadline
}
```

But for launch, implicit assignment via levels is sufficient.

---

## Part 3: Enhanced Streaks

### Current State

- Streak displayed in header as small number
- Calculated from session history
- No celebration or urgency mechanics

### Improvements

#### A. Streak Milestone Celebrations

Show modal when hitting milestones: 3, 7, 14, 21, 30, 60, 90, 180, 365 days

```typescript
interface StreakMilestone {
  days: number;
  title: string;
  message: string;
  icon: string;
}

const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, title: "Getting Started!", message: "3 days in a row. You're building a habit.", icon: "🌱" },
  { days: 7, title: "One Week!", message: "A full week of practice. Impressive.", icon: "🔥" },
  { days: 14, title: "Two Weeks Strong!", message: "14 days. This is becoming routine.", icon: "💪" },
  { days: 30, title: "Monthly Master!", message: "30 days of dedication. You're unstoppable.", icon: "🏆" },
  // ... more milestones
];
```

**When to show:** After session completes, before returning to homepage.

**Component:**

```typescript
// src/components/streaks/StreakMilestoneModal.tsx
interface StreakMilestoneModalProps {
  milestone: StreakMilestone;
  onContinue: () => void;
}
```

#### B. Streak At Risk Indicator

Show when:
- Student hasn't practiced today AND
- Current time is after 5 PM local AND
- Student has active streak > 0

**Header change:**

```typescript
// In Header component
{streakAtRisk && (
  <div className="streak-warning">
    🔥 Streak ends at midnight!
  </div>
)}
```

**Homepage nudge:**

```typescript
// Above primary action card when at risk
<StreakAtRiskBanner
  currentStreak={7}
  onQuickPractice={() => startQuickSession()}
/>
```

```
┌─────────────────────────────────────────┐
│ ⚠️ Your 7-day streak ends at midnight   │
│                                         │
│ [Quick 2-min practice →]                │
└─────────────────────────────────────────┘
```

#### C. Post-Session Streak Reminder

After session summary, before returning home:

```
┌─────────────────────────────────────────┐
│                                         │
│           🔥 4 Day Streak               │
│                                         │
│   Come back tomorrow to make it 5!      │
│                                         │
│   [Done]      [Practice Another →]      │
│                                         │
└─────────────────────────────────────────┘
```

**Component:**

```typescript
// src/components/streaks/StreakReminder.tsx
interface StreakReminderProps {
  currentStreak: number;
  onDone: () => void;
  onPracticeMore: () => void;
}
```

#### D. Teacher Streak Visibility

In StudentsTab, show streak for each student:

```
┌─────────────────────────────────────────────────┐
│ Maria S.              🔥 12    Last: Today      │
│ Juan P.               🔥 3     Last: Yesterday  │
│ Sofia R.              —        Last: 5 days ago │
└─────────────────────────────────────────────────┘
```

Teachers can see who's engaged and who's falling off.

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/components/streaks/StreakMilestoneModal.tsx` | NEW - celebration modal |
| `src/components/streaks/StreakAtRiskBanner.tsx` | NEW - urgency banner |
| `src/components/streaks/StreakReminder.tsx` | NEW - post-session reminder |
| `src/components/streaks/index.ts` | NEW - exports |
| `src/hooks/useStreak.ts` | NEW - streak logic & milestone detection |
| `src/pages/ChatPage.tsx` | Add milestone check after session |
| `src/pages/HomePage.tsx` | Add at-risk banner |
| `src/components/dashboard/StudentsTab.tsx` | Add streak column |

---

## Part 4: First-Run Experience

### Problem

New students land on full homepage with:
- Empty "Continue Learning" (nothing to continue)
- Carousel of scenarios (which to pick?)
- Stats showing zeros
- No guidance

### Solution: Guided First Session

#### Flow

```
1. Student opens app first time
   ↓
2. Welcome Screen
   "Welcome to [App]! Let's practice speaking English."
   "Your teacher [Name] set up your account."
   [Start Your First Conversation →]
   ↓
3. Brief Explanation (optional, skippable)
   "You'll have a conversation with an AI tutor."
   "Speak naturally - it's okay to make mistakes!"
   [Got it →]  [Skip]
   ↓
4. First Session Starts
   (Use teacher's first/easiest lesson, or default beginner scenario)
   ↓
5. Session Completes → Summary
   ↓
6. First Session Celebration
   "Great job on your first practice! ⭐"
   "You earned your First Steps badge!"
   "Come back tomorrow to start a streak."
   [Go to Home →]
   ↓
7. Homepage (now with context)
```

#### Detection

```typescript
// In HomePage or App.tsx
const isFirstTimeUser = !userDocument?.totalSessions || userDocument.totalSessions === 0;

if (isFirstTimeUser) {
  return <FirstRunExperience teacherName={teacherName} onComplete={handleFirstRunComplete} />;
}
```

#### Components

```typescript
// src/pages/FirstRunExperience.tsx
interface FirstRunExperienceProps {
  teacherName: string;
  firstLesson: Lesson;  // Teacher's first/easiest lesson
  onComplete: () => void;
}
```

**Screens within FirstRunExperience:**
1. `WelcomeScreen` - Teacher attribution, single CTA
2. `InstructionScreen` - Brief how-it-works (skippable)
3. Navigate to ChatPage with `isFirstSession: true` flag
4. `FirstSessionCelebration` - After session, before homepage

#### First Lesson Selection

```typescript
async function getFirstLesson(teacherId: string, studentLevel: string): Promise<Lesson> {
  // 1. Get teacher's lessons for student's level
  // 2. Sort by: easiest/shortest first
  // 3. Return first one
  // 4. Fallback: default "Hello" scenario
}
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/FirstRunExperience.tsx` | NEW - onboarding flow container |
| `src/components/onboarding/WelcomeScreen.tsx` | NEW - initial welcome |
| `src/components/onboarding/InstructionScreen.tsx` | NEW - how it works |
| `src/components/onboarding/FirstSessionCelebration.tsx` | NEW - post-first-session |
| `src/components/onboarding/index.ts` | NEW - exports |

---

## Implementation Order

### Phase 1: Simplified Homepage (Week 1)

1. Create `CompactLessonCard` component (with completion checkmark)
2. Create `LessonGrid` component (replaces carousel)
3. Create `PrimaryActionCard` component (smart start)
4. Refactor `HomePage.tsx` to use new structure
5. Rename ToolsSection to "Quick Practice"
6. Move Stats to `ProfilePage.tsx`
7. Add completion status from `uniqueScenariosCompleted`
8. Test and polish

### Phase 2: Enhanced Streaks (Week 2)

1. Create `useStreak` hook with milestone detection
2. Create `StreakMilestoneModal` component
3. Create `StreakAtRiskBanner` component
4. Create `StreakReminder` component (post-session)
5. Integrate into HomePage and ChatPage
6. Add streak column to StudentsTab

### Phase 3: First-Run Experience (Week 2-3)

1. Create onboarding components
2. Create `FirstRunExperience` page
3. Add first-time detection logic
4. Integrate with session flow
5. Test with fresh accounts

### Phase 4: Teacher Completion View (Week 3)

1. Create `getMissionCompletionStats()` service function
2. Add completion progress bar to `LessonListCard`
3. Add "who hasn't completed" expandable list
4. Test with multiple students

---

## Success Metrics

### Engagement Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Day 1 retention | ? | 60% |
| Day 7 retention | ? | 40% |
| Avg sessions/week | ? | 3+ |
| Avg streak length | ? | 5 days |

### Usage Metrics

| Metric | What to Track |
|--------|---------------|
| Time to first action | How long from homepage load to starting practice |
| Session completion rate | % of started sessions that complete |
| Assignment completion rate | % of assigned lessons completed |
| Streak maintenance | % of students maintaining 3+ day streaks |

### Teacher Metrics

| Metric | What to Track |
|--------|---------------|
| Lessons created | Avg lessons per teacher |
| Assignment engagement | Do teachers use assignment features? |
| Dashboard visits | How often teachers check progress |

---

## Open Questions

1. **Notifications:** Should we add push notifications for streak reminders? (Requires additional infrastructure)

2. **Offline support:** Should students be able to see assignments offline? (Adds complexity)

3. **Parent visibility:** Should parents have a view into child's progress? (Different for younger students)

4. **Competitive elements:** Any appetite for class-wide streak counts or "X classmates practiced today"? (Social proof without leaderboards)

5. **Rewards beyond badges:** Should streaks unlock anything? (Custom avatars, themes, etc.)

---

## Appendix: Component Sketches

### CompactLessonCard

```tsx
const CompactLessonCard: React.FC<{
  title: string;
  level: string;
  duration: string;
  completed: boolean;
  onClick: () => void;
}> = ({ title, level, duration, completed, onClick }) => (
  <div
    onClick={onClick}
    style={{
      width: 'calc(33.333% - 8px)',
      padding: '12px',
      borderRadius: '12px',
      backgroundColor: completed ? 'rgba(74, 222, 128, 0.1)' : AppColors.surfaceMedium,
      border: `1px solid ${completed ? 'rgba(74, 222, 128, 0.3)' : AppColors.borderColor}`,
      cursor: 'pointer',
    }}
  >
    {/* Completion indicator */}
    <div style={{ marginBottom: '8px' }}>
      {completed ? '✓' : '○'}
    </div>

    {/* Title */}
    <div style={{
      fontSize: '14px',
      fontWeight: 600,
      marginBottom: '8px',
      lineHeight: 1.3,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    }}>
      {title}
    </div>

    {/* Level + Duration */}
    <div style={{
      fontSize: '12px',
      color: AppColors.textSecondary,
    }}>
      {level} • {duration}
    </div>
  </div>
);
```

### StreakAtRiskBanner

```tsx
const StreakAtRiskBanner: React.FC<{
  currentStreak: number;
  onQuickPractice: () => void;
}> = ({ currentStreak, onQuickPractice }) => (
  <div style={{
    margin: '0 16px 16px',
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }}>
    <div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: AppColors.whisperAmber }}>
        ⚠️ Your {currentStreak}-day streak ends at midnight
      </div>
    </div>
    <button
      onClick={onQuickPractice}
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        border: 'none',
        backgroundColor: AppColors.whisperAmber,
        color: AppColors.textDark,
        fontWeight: 600,
        fontSize: '13px',
        cursor: 'pointer',
      }}
    >
      Quick practice →
    </button>
  </div>
);
```
