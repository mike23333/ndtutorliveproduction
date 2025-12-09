# Badge System Design

## Overview

A purposeful badge system that celebrates genuine learning milestones without clutter. Each badge marks meaningful progress and reinforces positive learning behaviors.

---

## Design Principles

1. **Purposeful, not noisy** — Each badge marks a meaningful milestone
2. **Progressive revelation** — Students discover badges as they progress
3. **No empty achievements** — Every badge reflects real learning behavior
4. **Visually unified** — Simple, recognizable icons that scale well

---

## Badge Categories

### 1. Consistency Badges (Building Habits)

| Badge | ID | Trigger | Description |
|-------|-----|---------|-------------|
| First Steps | `first_steps` | Complete 1st session | "You started your journey" |
| Getting Started | `getting_started` | Complete 5 sessions | "Building momentum" |
| Dedicated Learner | `dedicated_learner` | Complete 25 sessions | "Practice makes progress" |
| Century Club | `century_club` | Complete 100 sessions | "100 conversations strong" |
| Streak Starter | `streak_starter` | 3-day streak | "Three days in a row" |
| Week Warrior | `week_warrior` | 7-day streak | "A full week of practice" |
| Fortnight Force | `fortnight_force` | 14-day streak | "Two weeks unstoppable" |
| Month Master | `month_master` | 30-day streak | "30 days of dedication" |

### 2. Excellence Badges (Quality of Practice)

| Badge | ID | Trigger | Description |
|-------|-----|---------|-------------|
| Rising Star | `rising_star` | First 5-star session | "Your first perfect session" |
| Star Collector | `star_collector` | Earn 50 total stars | "50 stars earned" |
| Perfectionist | `perfectionist` | 3 consecutive 5-star sessions | "Excellence sustained" |
| Constellation | `constellation` | Earn 100 total stars | "A sky full of stars" |
| Supernova | `supernova` | Earn 250 total stars | "Brilliance personified" |

### 3. Time Badges (Practice Duration)

| Badge | ID | Trigger | Description |
|-------|-----|---------|-------------|
| First Hour | `first_hour` | 60 minutes total practice | "Your first hour" |
| Five Hours | `five_hours` | 300 minutes total | "Five hours invested" |
| Ten Hours | `ten_hours` | 600 minutes total | "Double digits" |
| Marathon Learner | `marathon_learner` | 1000 minutes total | "A true marathon" |

### 4. Explorer Badges (Variety & Curiosity)

| Badge | ID | Trigger | Description |
|-------|-----|---------|-------------|
| Explorer | `explorer` | Practice 5 different scenarios | "Trying new things" |
| Adventurer | `adventurer` | Practice 15 different scenarios | "Expanding horizons" |
| World Traveler | `world_traveler` | Practice 30 different scenarios | "Been everywhere" |
| Creator | `creator` | Create 1st custom lesson | "Made it your own" |
| Lesson Architect | `lesson_architect` | Create 5 custom lessons | "Building your curriculum" |

### 5. Level Progression Badges (CEFR Advancement)

| Badge | ID | Trigger | Description |
|-------|-----|---------|-------------|
| Breakthrough | `level_a2` | Advance to A2 | "Reached A2 level" |
| Intermediate | `level_b1` | Advance to B1 | "Reached B1 level" |
| Upper Intermediate | `level_b2` | Advance to B2 | "Reached B2 level" |
| Advanced | `level_c1` | Advance to C1 | "Reached C1 level" |
| Mastery | `level_c2` | Advance to C2 | "Reached C2 level" |

---

## Badge Summary

| Category | Count | Purpose |
|----------|-------|---------|
| Consistency | 8 | Reinforce daily practice habits |
| Excellence | 5 | Reward quality performance |
| Time | 4 | Acknowledge total investment |
| Explorer | 5 | Encourage variety and creativity |
| Level | 5 | Mark progression milestones |
| **Total** | **27** | |

---

## Data Model

### Firestore Schema

#### Badge Definitions (Static Collection)

```
Collection: badgeDefinitions/{badgeId}
```

```typescript
interface BadgeDefinition {
  id: string;                    // e.g., "first_steps"
  name: string;                  // e.g., "First Steps"
  description: string;           // e.g., "You started your journey"
  category: BadgeCategory;
  iconName: string;              // Icon identifier for frontend
  sortOrder: number;             // Display order within category
  criteria: BadgeCriteria;
  createdAt: Timestamp;
}

type BadgeCategory =
  | 'consistency'
  | 'excellence'
  | 'time'
  | 'explorer'
  | 'level';

interface BadgeCriteria {
  type: CriteriaType;
  threshold: number;
  // Optional additional conditions
  consecutive?: boolean;         // For streak-based badges
  starRating?: number;           // For excellence badges requiring specific rating
}

type CriteriaType =
  | 'sessions_completed'
  | 'current_streak'
  | 'longest_streak'
  | 'total_stars'
  | 'consecutive_five_stars'
  | 'practice_minutes'
  | 'unique_scenarios'
  | 'custom_lessons_created'
  | 'level_reached';
```

#### User Badges (Subcollection)

```
Collection: users/{userId}/badges/{badgeId}
```

```typescript
interface UserBadge {
  badgeId: string;               // Reference to badgeDefinitions
  earnedAt: Timestamp;
  // Snapshot of badge info at time of earning (denormalized for display)
  name: string;
  description: string;
  category: BadgeCategory;
  iconName: string;
}
```

#### User Document Updates

```typescript
// Add to existing UserDocument
interface UserDocument {
  // ... existing fields ...

  // Badge tracking
  badgeIds: string[];            // Array of earned badge IDs
  badgeCount: number;            // Total badges earned

  // Latest badge for homepage display
  latestBadge?: {
    id: string;
    name: string;
    iconName: string;
    earnedAt: Timestamp;
  };

  // Tracking fields for badge criteria
  uniqueScenariosCompleted: string[];  // Array of missionIds
  consecutiveFiveStarSessions: number; // Reset on non-5-star session
  customLessonsCreated: number;        // Count of custom lessons
}
```

---

## Badge Criteria Reference

### Consistency Badges

| Badge ID | Criteria Type | Threshold |
|----------|---------------|-----------|
| `first_steps` | `sessions_completed` | 1 |
| `getting_started` | `sessions_completed` | 5 |
| `dedicated_learner` | `sessions_completed` | 25 |
| `century_club` | `sessions_completed` | 100 |
| `streak_starter` | `current_streak` | 3 |
| `week_warrior` | `current_streak` | 7 |
| `fortnight_force` | `current_streak` | 14 |
| `month_master` | `current_streak` | 30 |

### Excellence Badges

| Badge ID | Criteria Type | Threshold | Additional |
|----------|---------------|-----------|------------|
| `rising_star` | `consecutive_five_stars` | 1 | First 5-star |
| `star_collector` | `total_stars` | 50 | |
| `perfectionist` | `consecutive_five_stars` | 3 | |
| `constellation` | `total_stars` | 100 | |
| `supernova` | `total_stars` | 250 | |

### Time Badges

| Badge ID | Criteria Type | Threshold (minutes) |
|----------|---------------|---------------------|
| `first_hour` | `practice_minutes` | 60 |
| `five_hours` | `practice_minutes` | 300 |
| `ten_hours` | `practice_minutes` | 600 |
| `marathon_learner` | `practice_minutes` | 1000 |

### Explorer Badges

| Badge ID | Criteria Type | Threshold |
|----------|---------------|-----------|
| `explorer` | `unique_scenarios` | 5 |
| `adventurer` | `unique_scenarios` | 15 |
| `world_traveler` | `unique_scenarios` | 30 |
| `creator` | `custom_lessons_created` | 1 |
| `lesson_architect` | `custom_lessons_created` | 5 |

### Level Badges

| Badge ID | Criteria Type | Threshold |
|----------|---------------|-----------|
| `level_a2` | `level_reached` | A2 |
| `level_b1` | `level_reached` | B1 |
| `level_b2` | `level_reached` | B2 |
| `level_c1` | `level_reached` | C1 |
| `level_c2` | `level_reached` | C2 |

---

## Implementation

### Badge Check Service

Badges should be checked and awarded at these trigger points:

| Trigger Event | Badges to Check |
|---------------|-----------------|
| Session completed | Consistency (sessions), Time, Explorer (unique scenarios) |
| Session summary saved | Excellence (stars, consecutive 5-stars) |
| Streak updated | Consistency (streaks) |
| Custom lesson created | Explorer (creator, architect) |
| Level changed | Level progression |

### Check Logic Flow

```typescript
// Pseudocode for badge checking
async function checkAndAwardBadges(
  userId: string,
  triggerEvent: TriggerEvent,
  userData: UserDocument
): Promise<BadgeAwarded[]> {

  // 1. Get badge definitions for relevant criteria types
  const relevantBadges = await getBadgesForTrigger(triggerEvent);

  // 2. Get user's already-earned badges
  const earnedBadgeIds = userData.badgeIds || [];

  // 3. Filter to unearned badges only
  const unearnedBadges = relevantBadges.filter(
    b => !earnedBadgeIds.includes(b.id)
  );

  // 4. Check each badge's criteria against user data
  const newlyEarned: BadgeAwarded[] = [];

  for (const badge of unearnedBadges) {
    if (meetsCriteria(badge.criteria, userData)) {
      // Award the badge
      await awardBadge(userId, badge);
      newlyEarned.push(badge);
    }
  }

  return newlyEarned;
}
```

### Award Function

```typescript
async function awardBadge(userId: string, badge: BadgeDefinition) {
  const batch = writeBatch(db);

  // 1. Add to user's badges subcollection
  const userBadgeRef = doc(db, `users/${userId}/badges/${badge.id}`);
  batch.set(userBadgeRef, {
    badgeId: badge.id,
    earnedAt: serverTimestamp(),
    name: badge.name,
    description: badge.description,
    category: badge.category,
    iconName: badge.iconName,
  });

  // 2. Update user document
  const userRef = doc(db, `users/${userId}`);
  batch.update(userRef, {
    badgeIds: arrayUnion(badge.id),
    badgeCount: increment(1),
    latestBadge: {
      id: badge.id,
      name: badge.name,
      iconName: badge.iconName,
      earnedAt: serverTimestamp(),
    },
  });

  await batch.commit();
}
```

---

## UI Components

### 1. Badge Earned Modal

Displayed immediately when a new badge is earned (after session summary).

**Elements:**
- Badge icon (large, centered)
- Badge name
- Badge description
- Subtle celebration animation (scale + glow, less than star confetti)
- "Continue" button

### 2. Profile Page

**Important:** Badges live on the Profile page, NOT the Homepage. The homepage stays focused on practice.

**Design Principle:** Start with who they are, show what they've achieved, then get out of the way.

**Profile Page Layout (Top to Bottom):**

#### Section 1: Identity
- Avatar (simple circle with initials, photo support later)
- Display name
- Current CEFR level badge (A1–C2) — their "rank"
- Member since date (small, optional)

#### Section 2: Stats Row (Three numbers only)
Keep this tight. These stats tell a story:

| Stat | Display | Why it matters |
|------|---------|----------------|
| Practice streak | Current + longest | The habit engine |
| Total practice time | Hours/minutes | Investment, not consumption |
| Stars earned | Total count | Quality, not quantity |

Don't show "sessions completed" — it's implied by other metrics and adds noise.

#### Section 3: Badges
- Recent badges row (3–5 most recent, horizontal)
- Tap any badge to see details
- "View all badges →" link → opens Badge Collection Page

This is the "trophy case" — let them see recent wins without drowning in icons.

#### Section 4: Learning Insights

This transforms the profile from vanity metrics into a mirror of actual progress:

| Insight | Source | Display |
|---------|--------|---------|
| **Strong scenarios** | Top 2–3 scenarios by star rating | "You shine at: Café, Train Station" |
| **Areas growing** | Scenarios with recent improvement | "Getting better at: Job Interview" |
| **Words mastered** | Struggles marked as mastered | "42 words mastered" |

Keep this section light — 3 insights maximum. The data comes from session summaries and the struggles collection.

#### Section 5: Settings
Simple list:
- Edit profile (name,  avatar)
- Change level (with confirmation dialog)
- Sign out

#### What NOT to Include
- No leaderboards. Learning isn't competition against others.
- No "share" buttons. Learning is personal.
- No percentage completions. They never feel good.
- No "days since last practice" guilt trips.

---

### 2b. Teacher Profile Page

Teachers need a different profile entirely. Don't merge with student profile.

**Teacher Profile Layout:**
- Avatar + name
- Class code display (prominent, with copy button)
- Quick link to Teacher Dashboard
- Account settings (edit profile, sign out)

### 3. Badge Collection Page

Full grid of all badges (earned + locked).

**Layout:**
- Grouped by category with section headers
- Earned badges: Full color with earned date
- Locked badges: Greyed silhouette with criteria hint
- Progress indicators for partially-complete badges

### 4. Homepage Navigation

**Do NOT add badges to homepage.** Keep homepage focused on:
- Continue learning
- Weekly review (when available)
- Practice scenarios
- Quick tools

**Profile icon in homepage header** → navigates to Profile page (where badges live).

Badges are a reflection feature (profile), not a call-to-action feature (homepage).

---

## Icon Design Guidelines

**Style:**
- Simple, single-color fill icons
- Consistent line weight
- Recognizable at 24px and 48px sizes
- Works on light and dark backgrounds

**Suggested Icons by Category:**

| Category | Icon Style |
|----------|------------|
| Consistency | Footprints, calendar, flame (streak) |
| Excellence | Stars, trophy, medal |
| Time | Clock, hourglass, timer |
| Explorer | Compass, map pin, rocket |
| Level | Mountain peaks, stairs, ladder |

---

## Teacher View

Teachers can see badge progress for their students in the analytics dashboard.

**Display:**
- Student's total badge count
- Most recent badge earned
- Optional: Expandable to see full badge list per student

---

## Future Considerations

### Not Implementing Now (Avoid Scope Creep)

- Badge tiers (bronze/silver/gold versions)
- Seasonal/limited-time badges
- Shareable badge graphics
- Badge-based rewards/unlocks
- Comparative badges ("top 10%")

### Potential Future Additions

- Review-based badges (when weekly review matures)
- Pronunciation badges (when pronunciation coach matures)
- Social badges (if social features added)
- Teacher-awarded badges (custom recognition)

---

## Migration Notes

### Existing User Data

When deploying badges, run a one-time migration to:

1. Calculate `uniqueScenariosCompleted` from session history
2. Calculate `customLessonsCreated` from customLessons subcollection
3. Award all badges user has already earned retroactively
4. Set `consecutiveFiveStarSessions` to 0 (track going forward only)

### Rollout Strategy

1. Deploy badge definitions to Firestore
2. Deploy badge check service (backend)
3. Run retroactive badge award migration
4. Deploy UI components
5. Monitor and adjust thresholds if needed

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/types/badges.ts` | Badge type definitions |
| `src/services/firebase/badges.ts` | Badge CRUD and check logic |
| `src/hooks/useBadges.ts` | Badge data fetching hook |
| `src/hooks/useBadgeCheck.ts` | Badge checking on triggers |
| `src/components/badges/BadgeEarnedModal.tsx` | New badge celebration |
| `src/components/badges/BadgeGrid.tsx` | Collection display |
| `src/components/badges/BadgeIcon.tsx` | Individual badge display |
| `src/pages/ProfilePage.tsx` | **New page** - User profile with badges |
| `src/pages/BadgesPage.tsx` | Full collection page |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/firestore.ts` | Add badge fields to UserDocument |
| `src/pages/HomePage.tsx` | Profile icon navigates to ProfilePage |
| `src/pages/ChatPage.tsx` | Trigger badge check on session end |
| `src/services/firebase/sessionData.ts` | Call badge check after session save |
| `src/App.tsx` | Add route for ProfilePage |

---

## Appendix: Badge Definitions JSON

For initial Firestore seeding:

```json
{
  "badges": [
    {
      "id": "first_steps",
      "name": "First Steps",
      "description": "You started your journey",
      "category": "consistency",
      "iconName": "footprints",
      "sortOrder": 1,
      "criteria": { "type": "sessions_completed", "threshold": 1 }
    },
    {
      "id": "getting_started",
      "name": "Getting Started",
      "description": "Building momentum",
      "category": "consistency",
      "iconName": "rocket",
      "sortOrder": 2,
      "criteria": { "type": "sessions_completed", "threshold": 5 }
    },
    {
      "id": "dedicated_learner",
      "name": "Dedicated Learner",
      "description": "Practice makes progress",
      "category": "consistency",
      "iconName": "book-open",
      "sortOrder": 3,
      "criteria": { "type": "sessions_completed", "threshold": 25 }
    },
    {
      "id": "century_club",
      "name": "Century Club",
      "description": "100 conversations strong",
      "category": "consistency",
      "iconName": "trophy",
      "sortOrder": 4,
      "criteria": { "type": "sessions_completed", "threshold": 100 }
    },
    {
      "id": "streak_starter",
      "name": "Streak Starter",
      "description": "Three days in a row",
      "category": "consistency",
      "iconName": "flame",
      "sortOrder": 5,
      "criteria": { "type": "current_streak", "threshold": 3 }
    },
    {
      "id": "week_warrior",
      "name": "Week Warrior",
      "description": "A full week of practice",
      "category": "consistency",
      "iconName": "flame",
      "sortOrder": 6,
      "criteria": { "type": "current_streak", "threshold": 7 }
    },
    {
      "id": "fortnight_force",
      "name": "Fortnight Force",
      "description": "Two weeks unstoppable",
      "category": "consistency",
      "iconName": "flame",
      "sortOrder": 7,
      "criteria": { "type": "current_streak", "threshold": 14 }
    },
    {
      "id": "month_master",
      "name": "Month Master",
      "description": "30 days of dedication",
      "category": "consistency",
      "iconName": "crown",
      "sortOrder": 8,
      "criteria": { "type": "current_streak", "threshold": 30 }
    },
    {
      "id": "rising_star",
      "name": "Rising Star",
      "description": "Your first perfect session",
      "category": "excellence",
      "iconName": "star",
      "sortOrder": 1,
      "criteria": { "type": "consecutive_five_stars", "threshold": 1 }
    },
    {
      "id": "star_collector",
      "name": "Star Collector",
      "description": "50 stars earned",
      "category": "excellence",
      "iconName": "stars",
      "sortOrder": 2,
      "criteria": { "type": "total_stars", "threshold": 50 }
    },
    {
      "id": "perfectionist",
      "name": "Perfectionist",
      "description": "Excellence sustained",
      "category": "excellence",
      "iconName": "medal",
      "sortOrder": 3,
      "criteria": { "type": "consecutive_five_stars", "threshold": 3 }
    },
    {
      "id": "constellation",
      "name": "Constellation",
      "description": "A sky full of stars",
      "category": "excellence",
      "iconName": "sparkles",
      "sortOrder": 4,
      "criteria": { "type": "total_stars", "threshold": 100 }
    },
    {
      "id": "supernova",
      "name": "Supernova",
      "description": "Brilliance personified",
      "category": "excellence",
      "iconName": "sun",
      "sortOrder": 5,
      "criteria": { "type": "total_stars", "threshold": 250 }
    },
    {
      "id": "first_hour",
      "name": "First Hour",
      "description": "Your first hour",
      "category": "time",
      "iconName": "clock",
      "sortOrder": 1,
      "criteria": { "type": "practice_minutes", "threshold": 60 }
    },
    {
      "id": "five_hours",
      "name": "Five Hours",
      "description": "Five hours invested",
      "category": "time",
      "iconName": "clock",
      "sortOrder": 2,
      "criteria": { "type": "practice_minutes", "threshold": 300 }
    },
    {
      "id": "ten_hours",
      "name": "Ten Hours",
      "description": "Double digits",
      "category": "time",
      "iconName": "hourglass",
      "sortOrder": 3,
      "criteria": { "type": "practice_minutes", "threshold": 600 }
    },
    {
      "id": "marathon_learner",
      "name": "Marathon Learner",
      "description": "A true marathon",
      "category": "time",
      "iconName": "timer",
      "sortOrder": 4,
      "criteria": { "type": "practice_minutes", "threshold": 1000 }
    },
    {
      "id": "explorer",
      "name": "Explorer",
      "description": "Trying new things",
      "category": "explorer",
      "iconName": "compass",
      "sortOrder": 1,
      "criteria": { "type": "unique_scenarios", "threshold": 5 }
    },
    {
      "id": "adventurer",
      "name": "Adventurer",
      "description": "Expanding horizons",
      "category": "explorer",
      "iconName": "map",
      "sortOrder": 2,
      "criteria": { "type": "unique_scenarios", "threshold": 15 }
    },
    {
      "id": "world_traveler",
      "name": "World Traveler",
      "description": "Been everywhere",
      "category": "explorer",
      "iconName": "globe",
      "sortOrder": 3,
      "criteria": { "type": "unique_scenarios", "threshold": 30 }
    },
    {
      "id": "creator",
      "name": "Creator",
      "description": "Made it your own",
      "category": "explorer",
      "iconName": "pencil",
      "sortOrder": 4,
      "criteria": { "type": "custom_lessons_created", "threshold": 1 }
    },
    {
      "id": "lesson_architect",
      "name": "Lesson Architect",
      "description": "Building your curriculum",
      "category": "explorer",
      "iconName": "layout",
      "sortOrder": 5,
      "criteria": { "type": "custom_lessons_created", "threshold": 5 }
    },
    {
      "id": "level_a2",
      "name": "Breakthrough",
      "description": "Reached A2 level",
      "category": "level",
      "iconName": "trending-up",
      "sortOrder": 1,
      "criteria": { "type": "level_reached", "threshold": "A2" }
    },
    {
      "id": "level_b1",
      "name": "Intermediate",
      "description": "Reached B1 level",
      "category": "level",
      "iconName": "trending-up",
      "sortOrder": 2,
      "criteria": { "type": "level_reached", "threshold": "B1" }
    },
    {
      "id": "level_b2",
      "name": "Upper Intermediate",
      "description": "Reached B2 level",
      "category": "level",
      "iconName": "mountain",
      "sortOrder": 3,
      "criteria": { "type": "level_reached", "threshold": "B2" }
    },
    {
      "id": "level_c1",
      "name": "Advanced",
      "description": "Reached C1 level",
      "category": "level",
      "iconName": "mountain",
      "sortOrder": 4,
      "criteria": { "type": "level_reached", "threshold": "C1" }
    },
    {
      "id": "level_c2",
      "name": "Mastery",
      "description": "Reached C2 level",
      "category": "level",
      "iconName": "award",
      "sortOrder": 5,
      "criteria": { "type": "level_reached", "threshold": "C2" }
    }
  ]
}
```
