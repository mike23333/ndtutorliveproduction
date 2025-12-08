# Teacher Analytics & Class Pulse - Design Document

*AI-powered insights and analytics for teachers to understand student progress* we do have a python server you could use for it if you think that's better than cloud function I think it is. can just create a new endpoint.

use gemini 2.5 pro for this

---

## Overview

Two distinct but related features:

1. **Class Pulse** - AI-generated actionable insights (2-3 cards)
2. **Analytics Tab** - Detailed data exploration with charts and tables

**Important**: All analytics are **level-aware**. Students are assigned to CEFR levels (A1-C2) and lessons target specific levels. Analytics group and compare within levels, and flag cross-level concerns.

---

## Class Pulse (AI-Generated Insights)

### Philosophy

Not: "47 struggles recorded, 23 vocabulary, 18 grammar..."
But: "Several students are mixing up 'borrow' and 'lend' - consider a quick clarification next class."

Teachers should feel:
- **Informed** - "I know what's happening"
- **Empowered** - "I can act on this"
- **Not overwhelmed** - Max 3 insights, not a data dump

### Data Input to Gemini (Level-Aware)

```
Teacher: {teacherName}
Period: Last 7 days

=== B1 LEVEL (12 students) ===
STRUGGLES:
- "reservation" - 5 students, vocabulary
- "would you like" formality - 4 students, grammar

SESSIONS:
- "Coffee Shop" (B1): 4.2 avg stars, 18 completions
- "Restaurant Ordering" (B1): 2.8 avg stars, 12 completions ⚠️

INACTIVE: Maria, Petro (7+ days)

=== B2 LEVEL (8 students) ===
STRUGGLES:
- "negotiate" - 3 students, vocabulary
- "compromise" - 3 students, vocabulary

SESSIONS:
- "Business Meeting" (B2): 3.9 avg stars, 8 completions
- "Job Interview" (B2): 4.1 avg stars, 6 completions

INACTIVE: none

=== CROSS-LEVEL CONCERNS ===
- 2 B1 students struggling with A2 vocabulary (possible misplacement?)
- 3 B2 students consistently scoring 5 stars (ready to advance?)
```

### Gemini Output Format (Level-Aware)

```json
{
  "insights": [
    {
      "type": "warning",
      "level": "B1",
      "title": "Restaurant Lesson Struggling",
      "message": "B1 students averaging 2.8 stars on Restaurant Ordering. The menu vocabulary may be too advanced for this level."
    },
    {
      "type": "info",
      "level": null,
      "title": "Possible Level Mismatches",
      "message": "Maria and Petro (B1) are struggling with basic A2 vocabulary. Consider reassessing their placement."
    },
    {
      "type": "success",
      "level": "B2",
      "title": "Ready to Advance",
      "message": "Anna, Viktor, and Olena have consistently scored 5 stars in B2. They may be ready for C1 content."
    }
  ],
  "generatedAt": "2024-12-08T06:00:00Z"
}
```

### Types of Level-Aware Insights

1. **Level-specific lesson health** - "B1 Restaurant lesson is struggling"
2. **Level mismatch detection** - Student struggling with content below their level
3. **Advancement candidates** - Students consistently excelling at their level
4. **Cross-level patterns** - "This word is hard across all levels"
5. **Inactive students by level** - "2 B1 students haven't practiced"

### Storage

```
teachers/{teacherId}/dailyInsights/{date}
```

Fields:
- `insights` - Array of insight objects (type, title, message)
- `generatedAt` - Timestamp when Gemini generated this
- `stillValidAt` - Timestamp of last validation (may be newer than generatedAt)
- `dataSnapshot` - Stats at time of generation (for change detection)
  - `totalSessions`
  - `totalStruggles`
  - `lastSessionAt`

### Smart Triggering (Avoid Wasteful API Calls)

The cloud function runs daily but only calls Gemini when there's meaningful new data:

```typescript
// Pseudocode
const lastSnapshot = await getLastInsightSnapshot(teacherId);
const currentStats = await getCurrentStats(teacherId);

const hasNewActivity =
  currentStats.totalSessions > lastSnapshot.totalSessions + 2 || // 3+ new sessions
  currentStats.totalStruggles > lastSnapshot.totalStruggles + 5;  // 5+ new struggles

if (!hasNewActivity) {
  // Just update the "still valid" timestamp, don't call Gemini
  await markInsightsStillValid(teacherId);
  return; // Skip Gemini call
}

// Real changes detected - generate new insights
const insights = await generateWithGemini(currentStats);
await saveInsights(teacherId, insights, currentStats);
```

Benefits:
- No wasted Gemini API calls when nothing changed
- Fresh insights only when there's actual new data
- Teacher sees "Updated today" either way

### Schedule

- **Daily at 6:00 AM Kyiv time** (Europe/Kyiv)
- Before teacher's day starts
- Optional: "Refresh" button for on-demand regeneration

---

## Analytics Tab

### Philosophy

Most analytics dashboards fail because they show **data** instead of **answers**.

Teachers don't want: "47 sessions completed"
Teachers want: "Is my class improving?"

### Design Principles

1. **Lead with the answer** - "Your class improved this week" at the top
2. **Comparison is meaning** - Always show vs. last period
3. **Highlight anomalies** - Show what's unusual, not everything
4. **Actionable > Interesting** - Every stat should suggest an action
5. **Progressive disclosure** - Summary first, details on tap

### Layout Structure

```
┌─────────────────────────────────────────────┐
│  📊 Your Class This Week                    │
│                                             │
│  "Good progress - stars up, but 3 students  │
│   need encouragement"                       │
│  (AI-generated one-liner)                   │
│                                             │
├─────────────────────────────────────────────┤
│  Level: [All ▼]                             │
├─────────────────────────────────────────────┤
│  [Overview] [Lessons] [Students] [Struggles]│
├─────────────────────────────────────────────┤
│                                             │
│  (Tab content filtered by selected level)   │
│                                             │
└─────────────────────────────────────────────┘
```

**Level Filter** appears on all tabs - filters everything by selected level or shows "All" aggregated.

### Tab 1: Overview

When "All Levels" selected - shows summary by level:

```
┌─────────────────────────────────────────────┐
│  This Week by Level                         │
│  ─────────────────────────────────────────  │
│  Level   Students  Sessions  Avg ⭐  Trend  │
│  B1         12        28      3.6    ↑ 0.2  │
│  B2          8        19      4.1    ↑ 0.1  │
│  C1          4         8      3.9    ↓ 0.3  │
│  ─────────────────────────────────────────  │
│  Total      24        55      3.8    ↑ 0.1  │
└─────────────────────────────────────────────┘
```

When specific level selected (e.g., B1):

```
┌─────────────────────────────────────────────┐
│  B1 Level - This Week    vs Last Week       │
│  ──────────────────────────────────         │
│  Students: 12                               │
│  Sessions: 28           ↑ 12%               │
│  Avg Stars: 3.6         ↑ 0.2               │
│  Practice Time: 4.2 hrs ↓ 5%                │
│  Words Mastered: 14                         │
└─────────────────────────────────────────────┘

B1 Stars Trend (4 weeks)
     5 ┤
     4 ┤    ╭──────╮  ╭───
     3 ┤───╯       ╰──╯
     2 ┤
     1 ┤
       └─────────────────────
       W1   W2   W3   W4
```

### Tab 2: Lessons

When "All Levels" selected - grouped by level:

```
┌─────────────────────────────────────────────┐
│  B1 Lessons            Completions  Avg ⭐  │
│  ─────────────────────────────────────────  │
│  ☕ Coffee Shop           24        4.2     │
│  🍽️ Restaurant            18        2.8  ⚠️ │
│  ✈️ Airport               12        4.6     │
│                                             │
│  B2 Lessons            Completions  Avg ⭐  │
│  ─────────────────────────────────────────  │
│  💼 Business Meeting      14        3.9     │
│  👔 Job Interview         10        4.1     │
│  🤝 Negotiation            6        3.7     │
└─────────────────────────────────────────────┘
```

When specific level selected - flat list for that level only.

- Tap lesson → see struggles specific to that lesson
- Warning indicator on lessons below 3.0 stars
- Only compare lessons within same level (fair comparison)

### Tab 3: Students

When "All Levels" selected - grouped by level:

```
┌─────────────────────────────────────────────┐
│  B1 Students (12)                           │
│  ─────────────────────────────────────────  │
│  🟢 Maria          6       4.2    Today     │
│  🟢 Petro          5       3.8    Yesterday │
│  🟡 Oksana         2       4.0    3 days    │
│  🔴 Viktor         0       -      12 days   │
│                                             │
│  B2 Students (8)                            │
│  ─────────────────────────────────────────  │
│  🟢 Anna           8       4.5    Today   ⬆️│
│  🟢 Olena          7       4.8    Today   ⬆️│
│  🟢 Dmytro         5       4.1    Yesterday │
└─────────────────────────────────────────────┘
```

When specific level selected - flat list for that level only.

Activity indicators:
- 🟢 Green: Active in last 3 days
- 🟡 Yellow: Active in last 7 days
- 🔴 Red: Inactive 7+ days

Special indicators:
- ⬆️ Ready to advance (consistently high scores)
- ⚠️ Possible level mismatch (struggling with lower-level content)

### Tab 4: Struggles (Gold for Teachers)

When "All Levels" selected - grouped by level with cross-level insights:

```
┌─────────────────────────────────────────────┐
│  Top Struggles by Level                     │
│  Filter: [This Month ▼] [All Types ▼]       │
│  ─────────────────────────────────────────  │
│                                             │
│  B1 Level:                                  │
│  • "reservation" - 8 students               │
│  • "would you like" formality - 5 students  │
│  • "medium-rare" - 4 students               │
│                                             │
│  B2 Level:                                  │
│  • "negotiate" - 4 students                 │
│  • "compromise" - 3 students                │
│  • "stakeholder" - 3 students               │
│                                             │
│  ⚠️ Cross-Level Concerns:                   │
│  ─────────────────────────────────────────  │
│  A2 vocabulary in B1 students:              │
│  • "excuse me" - 2 students                 │
│    (Consider level reassessment)            │
│                                             │
│  Universal struggles (all levels):          │
│  • "appointment" vs "reservation" - 11 total│
│                                             │
└─────────────────────────────────────────────┘
```

When specific level selected - flat list for that level only.

- Tap word → see which students, which lessons
- Filter by: This week / This month / All time
- Filter by type: Vocabulary / Grammar / Pronunciation
- Cross-level analysis helps identify:
  - Students who may be misplaced
  - Universal pain points to address in curriculum

---

## Data Architecture

### Existing Level Data

Already in place:
- `UserDocument.level` - Student's CEFR level (A1-C2)
- `MissionDocument.targetLevel` - Lesson's target level (A1-C2)

### What We Query (Real-Time)

Most analytics are real-time Firestore queries with level filtering:

```typescript
// Sessions this week for teacher's lessons, grouped by level
const sessions = await query(
  collectionGroup(db, 'sessionSummaries'),
  where('missionId', 'in', teacherMissionIds),
  where('createdAt', '>=', weekStart)
);

// Then group in memory by mission.targetLevel

// Struggles aggregated by level
const struggles = await query(
  collectionGroup(db, 'struggles'),
  where('missionId', 'in', teacherMissionIds),
  where('createdAt', '>=', monthStart)
);

// Cross-reference with user.level and mission.targetLevel
// to detect level mismatches
```

### Level Mismatch Detection

```typescript
// Flag when student's level doesn't match struggle difficulty
const detectMismatch = (struggle, studentLevel, missionLevel) => {
  // Student is B1 but struggling with A2 content = red flag
  if (levelToNumber(missionLevel) < levelToNumber(studentLevel) - 1) {
    return 'below_level'; // Possible misplacement
  }
  // Student consistently acing content at their level = advancement candidate
  return null;
};
```

### What We Pre-Compute

For performance, some data is pre-computed per level:

```
teachers/{teacherId}/weeklyStats/{week-YYYY-MM-DD}
```

Fields:
- `byLevel` - Object keyed by level (A1, A2, B1, B2, C1, C2):
  ```
  {
    "B1": {
      totalSessions: 28,
      totalStars: 101,
      averageStars: 3.6,
      totalPracticeTime: 15120,
      activeStudents: 10,
      inactiveStudents: ["userId1", "userId2"],
      topStruggles: [{word: "reservation", count: 8}, ...],
      lessonStats: [{missionId: "x", completions: 18, avgStars: 4.2}, ...]
    },
    "B2": { ... }
  }
  ```
- `totals` - Aggregated across all levels
- `crossLevelConcerns`:
  - `possibleMisplacements` - Students struggling below their level
  - `advancementCandidates` - Students ready to move up
  - `universalStruggles` - Words hard across multiple levels

Generated by same cloud function as Class Pulse.

---

## Implementation Phases

### Phase 1: Class Pulse (MVP)
- Cloud Function: `generateDailyInsights`
- Runs daily 6 AM Kyiv time
- Smart triggering (skip if no new data)
- Frontend: Display insights cards on dashboard

### Phase 2: Analytics - Overview Tab
- Real-time queries for basic stats
- Week-over-week comparison
- Simple trend display (no charts library yet)

### Phase 3: Analytics - Full Tabs
- Lessons performance table
- Students activity grid
- Struggles breakdown
- Add filtering and sorting

### Phase 4: Polish
- Charts library for trend visualization
- Export functionality
- Push notifications for important insights

---

## Configuration

- **Timezone**: Europe/Kyiv (UTC+2 / UTC+3 during DST)
- **Daily insights generation**: 6:00 AM Kyiv time
- **Activity threshold for regeneration**: 3+ sessions or 5+ struggles

---

## Related Files

| File | Purpose |
|------|---------|
| `src/pages/TeacherDashboard.tsx` | Dashboard UI with Class Pulse |
| `src/services/firebase/sessionData.ts` | Reads struggles, summaries |
| `functions/src/generateDailyInsights.ts` | Cloud function (to build) |
| `docs/weekly-review-design.md` | Related: Student weekly review |

---

*Document created: December 2024*
