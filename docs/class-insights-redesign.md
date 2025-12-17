# Class Insights Redesign

## Overview

Replace the current Analytics tab with a simpler, more actionable "Class Insights" view. Teachers have 5 minutes between classes — show them what matters and what to do about it.

---

## Philosophy

**Current Analytics problems:**
- Data dump with too many numbers
- API costs irrelevant to teachers
- Token counts meaningless to educators
- Struggles buried in nested views
- No clear "what should I do?"

**New Class Insights principles:**
- AI summary tells you what matters
- "Needs Attention" shows who to help
- Common Mistakes shows what to reteach
- Drill-down to actual student errors with audio

---

## Tab Structure Changes

### Before
```
Teacher Dashboard
├── Lessons
├── Students
├── Analytics    ← Data dump
└── Templates
```

### After
```
Teacher Dashboard
├── Lessons
├── Students
├── Insights     ← Renamed, simplified
├── Templates
└── Billing      ← New, admin-only (API costs)
```

---

## Class Insights Tab Design

### Main View

```
┌─────────────────────────────────────────┐
│ Class Insights              This Week ▼ │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 💡 AI Summary                   │    │
│  │                                 │    │
│  │ "Your B1 students are          │    │
│  │  struggling with articles      │    │
│  │  (a/the). Consider a quick     │    │
│  │  review lesson on this topic.  │    │
│  │                                 │    │
│  │  Maria and Juan haven't        │    │
│  │  practiced in 3 days."         │    │
│  │                                 │    │
│  │                    [Refresh ↻] │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Class Activity                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━ 18/24 active   │
│                                         │
│  Needs Attention:                       │
│  • Maria S. — 3 days inactive           │
│  • Juan P. — low scores (2.1 avg)       │
│  • Sofia R. — 5 days inactive           │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Common Mistakes             See all →  │
│                                         │
│  Grammar ████████████ 24                │
│    • Articles (a/the)  — 14x            │
│    • Past tense        — 8x             │
│                                         │
│  Pronunciation █████ 12                 │
│    • "th" sounds       — 7x             │
│                                         │
│  Vocabulary ███ 8                       │
│    • Word confusion    — 5x             │
│                                         │
└─────────────────────────────────────────┘
```

### Components

#### 1. AI Summary Card
- Generated on-demand via "Refresh" button
- Uses Gemini 2.5 Flash to summarize:
  - Top struggles across class
  - Students needing attention
  - Suggested teaching actions
- Shows "Last updated: [timestamp]"

#### 2. Class Activity Section
- Simple progress bar: X/Y students active this week
- "Needs Attention" list:
  - Inactive students (3+ days)
  - Low-scoring students (avg < 3 stars)
  - High error counts
- Click student name → goes to Students tab detail view

#### 3. Common Mistakes Section
- Grouped by error type (Grammar, Pronunciation, Vocabulary, Cultural)
- Bar visualization showing relative frequency
- Top 2-3 patterns per type
- "See all →" link to drill-down view

---

## Common Mistakes Drill-Down

When teacher clicks "See all →":

```
┌─────────────────────────────────────────┐
│ ← Common Mistakes              This Week│
├─────────────────────────────────────────┤
│                                         │
│  [Grammar]  [Pronunciation]  [Vocab]    │
│   ━━━━━━━    ───────────     ─────      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Articles (a/the) — 14 mistakes         │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Maria S. • Dec 9                │    │
│  │                                 │    │
│  │ "I go to store"                 │    │
│  │ → "I went to the store"         │    │
│  │                                 │    │
│  │ [▶️ Hear student]               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Juan P. • Dec 8                 │    │
│  │                                 │    │
│  │ "She is teacher"                │    │
│  │ → "She is a teacher"            │    │
│  │                                 │    │
│  │ [▶️ Hear student]               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Sofia R. • Dec 8                │    │
│  │                                 │    │
│  │ "I want apple"                  │    │
│  │ → "I want an apple"             │    │
│  │                                 │    │
│  │ [▶️ Hear student]               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Past Tense — 8 mistakes                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ...                             │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Drill-Down Features

- **Filter tabs**: Grammar / Pronunciation / Vocabulary / Cultural
- **Grouped by pattern**: "Articles", "Past tense", "th sounds", etc.
- **Each error card shows**:
  - Student name
  - Date
  - What they said (struck through, red)
  - Correct version (green)
  - Play button for student's audio recording
- **No TTS for correct pronunciation** (teachers know how to say it)

---

## Billing Tab (Admin Only)

Move API costs to separate tab, hidden from regular teachers:

```
┌─────────────────────────────────────────┐
│ Billing                     This Month ▼│
├─────────────────────────────────────────┤
│                                         │
│  Total Cost          $12.47             │
│  ─────────────────────────────────────  │
│                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ $12.47 │ │ $0.52  │ │ $15.60 │      │
│  │ Total  │ │ /Stud. │ │ Est/Mo │      │
│  └────────┘ └────────┘ └────────┘      │
│                                         │
│  Token Usage                            │
│  Input:  847K tokens ($3/1M)            │
│  Output: 234K tokens ($12/1M)           │
│                                         │
│  By Student                             │
│  ┌─────────────────────────────────┐    │
│  │ Maria S.    12 sessions  $1.23  │    │
│  │ Juan P.      8 sessions  $0.89  │    │
│  │ Sofia R.     6 sessions  $0.67  │    │
│  │ ...                             │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Access Control:**
- Only show to users with `role: 'admin'`
- Or add a `canViewBilling: true` flag to teacher documents

---

## Data Requirements

### For AI Summary
Query and pass to Gemini:
- Review items from past 7 days (grouped by type)
- Student activity (last practice dates)
- Average scores by student
- Common error patterns

### For Class Activity
- Count students with practice in last 7 days
- List students with:
  - `lastPracticeDate` > 3 days ago
  - Average stars < 3.0

### For Common Mistakes
Query: `users/{studentId}/reviewItems` for all students under teacher
- Group by `errorType`
- Further group by pattern (extract from `correction` or `explanation`)
- Count occurrences
- Include `audioUrl` for playback

---

## Implementation Phases

### Phase 1: Rename & Simplify
1. Rename "Analytics" tab to "Insights"
2. Remove API costs section from main view
3. Keep existing Class Pulse as AI Summary
4. Simplify the stat cards

### Phase 2: Common Mistakes Section
1. Create `useClassMistakes` hook to aggregate review items
2. Build mistake grouping logic (by type, by pattern)
3. Create `CommonMistakesSection` component
4. Add "See all" drill-down view

### Phase 3: Drill-Down with Audio
1. Create `MistakeDetailCard` component
2. Add audio playback for student recordings
3. Build filter tabs (Grammar/Pronunciation/etc.)
4. Pattern grouping within each type

### Phase 4: Billing Tab
1. Create `BillingTab` component
2. Move cost data from Analytics
3. Add role-based access control
4. Hide from non-admin users

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/pages/TeacherDashboard.tsx` | Rename tab, add Billing tab |
| `src/components/dashboard/AnalyticsTab.tsx` | Rename to `InsightsTab.tsx`, simplify |
| `src/components/dashboard/InsightsTab.tsx` | New main component |
| `src/components/dashboard/CommonMistakesSection.tsx` | New component |
| `src/components/dashboard/MistakeDrillDown.tsx` | New drill-down view |
| `src/components/dashboard/MistakeDetailCard.tsx` | New card with audio |
| `src/components/dashboard/BillingTab.tsx` | New admin-only tab |
| `src/hooks/useClassMistakes.ts` | New hook for aggregating errors |
| `src/types/dashboard.ts` | Add new types |

---

## What Gets Removed

- Token counts from teacher view
- API cost section from main analytics
- Complex per-level breakdowns (simplify to just "needs attention")
- Trend percentages (unless clearly meaningful)
- Per-student cost breakdowns (move to Billing)

---

## Success Metrics

Teachers should be able to:
1. Understand class status in < 30 seconds
2. Know which students need help immediately
3. See what to reteach without clicking around
4. Hear exactly how a student made an error (audio)

---

## Open Questions

1. **Pattern detection**: How do we group "I go to store" and "She have cat" as "grammar" vs specific patterns like "articles" and "verb agreement"?
   - Option A: Simple grouping by `errorType`  do this one.
   - Option B: Use AI to categorize into sub-patterns  
   - Option C: Extract from `explanation` field

2. **Student detail from Insights**: When clicking a student in "Needs Attention", go to Students tab or show inline?

3. **Time filter**: Default to "This Week" — also offer "This Month" and "All Time"? give them options like they can filter by yesterday last 5 days, this month etc.

4. **Mobile**: Will teachers use this on phones? If so, need responsive drill-down. yes some may.
