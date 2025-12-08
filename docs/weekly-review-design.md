# Weekly Review Lesson - Design Document

*A once-per-week personalized practice session based on the student's struggles*

---

## Philosophy

When you correct someone immediately after they struggle, you're interrupting their sense of accomplishment. They just finished a conversation. They ordered coffee in English. Let them have that moment.

A week is human-scale. It's how we naturally chunk time. And spaced repetition works—reviewing a struggle 3-7 days later is scientifically better than reviewing it immediately.

---

## User Experience

### When They Open the App (Sunday/Monday)

```
┌─────────────────────────────────────┐
│                                     │
│  Your Week in English               │
│  ─────────────────                  │
│                                     │
│  You practiced 4 times              │
│  ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ 11 stars    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │  📝 Weekly Practice         │   │
│  │                             │   │
│  │  A quick conversation to    │   │
│  │  revisit this week's        │   │
│  │  tricky words               │   │
│  │                             │   │
│  │  • "reservation"            │   │
│  │  • "medium-rare"            │   │
│  │  • "still or sparkling"     │   │
│  │                             │   │
│  │       [ Practice Now ]      │   │
│  │         ~5 minutes          │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Design Principles

- No "You made 7 mistakes"
- No grades
- No shame
- Just: *here are some words that tripped you up. Let's practice.*

---

## Data Architecture

### Where Struggles Are Saved (Already Implemented)

```
users/{userId}/struggles/{struggleId}
```

Fields:
- `word` - The word/phrase they struggled with
- `struggleType` - "vocabulary" | "pronunciation" | "grammar"
- `context` - The sentence/situation where it happened
- `severity` - "minor" | "moderate" | "significant"
- `sessionId` - Which session this came from
- `missionId` - Which lesson this came from
- `reviewCount` - How many times included in a review (starts at 0)
- `lastReviewedAt` - Timestamp of last review inclusion
- `mastered` - Boolean, auto-set to true when reviewCount >= 3
- `includedInReviews` - Array of review IDs this struggle was included in
- `createdAt` - When the struggle was recorded

**Important**: Struggles are never deleted. They are filtered by `mastered` status.

### Where Review Lessons Are Saved (To Be Implemented)

```
users/{userId}/reviewLessons/{reviewId}
```

Fields:
- `id` - Document ID
- `userId` - User this belongs to
- `weekStart` - Date of the week start (for deduping)
- `status` - "pending" | "ready" | "completed" | "skipped"
- `generatedPrompt` - The AI-generated system prompt for the review conversation
- `targetStruggles` - Array of struggle IDs included in this review
- `struggleWords` - Array of words/phrases (for UI display)
- `estimatedMinutes` - Suggested duration (usually 5)
- `createdAt` - When generated
- `completedAt` - When they finished (if completed)
- `stars` - Stars earned (if completed)

### Where Session Summaries Are Saved (Already Implemented)

```
users/{userId}/sessionSummaries/{sessionId}
```

Fields:
- `sessionId`, `userId`, `missionId`
- `didWell` - Array of things they did well
- `workOn` - Array of areas to improve
- `stars` - 1-5 rating
- `summaryText` - AI-generated summary
- `encouragement` - Encouraging message
- `durationSeconds`
- `createdAt`

### User Aggregate Stats (Already Implemented)

```
users/{userId}
```

Fields:
- `totalStars` - Running total
- `totalSessions` - Count of completed sessions
- `totalPracticeTime` - Seconds
- `lastSessionAt` - Timestamp

---

## Implementation Architecture

### Cloud Function: generateWeeklyReviews

**Trigger**: Cloud Scheduler - Sunday 6:00 PM Kyiv time (Europe/Kyiv)

**Logic**:
```
1. Get all users with sessions in the last 7 days
2. For each user:
   a. Fetch struggles where:
      - mastered = false AND
      - (reviewCount = 0 OR lastReviewedAt < 7 days ago)
   b. Skip if < 3 struggles (not worth a review)
   c. Cap at 8 struggles (cognitive load limit)
   d. Call Gemini 2.0 Flash to generate conversational prompt
   e. Save to users/{userId}/reviewLessons/week-{YYYY-MM-DD}
   f. Update each included struggle:
      - Increment reviewCount
      - Set lastReviewedAt to now
      - Add review ID to includedInReviews array
      - If reviewCount >= 3, set mastered = true
3. Log completion stats
```

### Struggle Lifecycle

```
Created (reviewCount: 0, mastered: false)
    ↓
Included in Review #1 (reviewCount: 1)
    ↓
7+ days pass, still mastered: false
    ↓
Included in Review #2 (reviewCount: 2)
    ↓
7+ days pass, still mastered: false
    ↓
Included in Review #3 (reviewCount: 3, mastered: true)
    ↓
No longer appears in future reviews
```

### Why Not Delete Struggles?

1. **Learning data** - Preserves insight into patterns over time
2. **Spaced repetition** - Some words need 2-3 reviews before mastery
3. **Progress tracking** - "You've mastered 47 words this month"
4. **Teacher visibility** - Teachers can see student patterns

### Gemini Prompt Generation

Input to Gemini Flash:
```
Generate a 5-minute conversational English practice prompt.

The student struggled with these words/phrases this week:
- "reservation" (pronunciation)
- "medium-rare" (vocabulary - didn't know meaning)
- "still or sparkling" (comprehension - confused by phrase)

Create a system prompt for an AI tutor that will:
1. Have a natural conversation (restaurant, cafe, or travel scenario)
2. Organically include opportunities to use these words
3. NOT quiz or drill - just natural conversation
4. Gently help if they struggle again
5. Celebrate when they use the words correctly
6. Keep it warm and encouraging
7. End after ~5 minutes with acknowledgment of their progress

Return only the system prompt, no explanation.
```

Output (saved as `generatedPrompt`):
```
You are Sam, a friendly restaurant host at "The Golden Fork."
The student is calling to make a dinner reservation...

[Full generated prompt here]
```

---

## Phase 1: MVP Implementation

### Cloud Function
- `functions/src/generateWeeklyReviews.ts`
- Scheduled trigger
- Firestore reads/writes
- Gemini API call

### Frontend Changes
- New component: `WeeklyReviewCard.tsx`
- HomePage: Show review card if one exists with status "ready"
- ChatPage: Handle review lesson type (shorter, different UI)

### Firestore Rules
- Add rules for `reviewLessons` subcollection

---

## Phase 2: Enhancements

- Track review completion and update struggle `reviewCount`
- Mark struggles as `mastered` after successful review
- "You've mastered these!" celebration
- Adjust review frequency based on engagement
- Skip weeks with no struggles

---

## Configuration

- **Timezone**: Europe/Kyiv (UTC+2 / UTC+3 during DST)
- **Generation Time**: Sunday 6:00 PM Kyiv time

## Open Questions

1. **Notification** - Push notification when review is ready?
2. **Expiration** - How long does a review stay available? Forever? One week?
3. **Multiple reviews** - What if they skip weeks? Show backlog or just latest?

---

## Related Files

| File | Purpose |
|------|---------|
| `src/services/firebase/sessionData.ts` | Saves struggles, summaries, preferences |
| `src/types/firestore.ts` | Type definitions for all Firestore documents |
| `src/types/functions.ts` | Function call parameter types |
| `src/hooks/useGeminiChat.ts` | Handles function calls from Gemini |
| `firestore.rules` | Security rules for all collections |

---

*Document created: December 2024*
