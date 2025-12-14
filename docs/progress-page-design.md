# Progress Page Design Document

**Author**: Design thinking inspired by Jony Ive
**Date**: December 2024
**Status**: Planning

---

## Overview

A Progress page that serves as the learner's mirror—reflecting their journey with honesty and encouragement. The page consolidates streaks, badges, practice time, and provides navigation to detailed mistake review pages.

---

## Page Architecture

```
/progress (ProgressPage)
    ├── Mistakes Summary Card → /progress/pronunciation
    ├── Mistakes Summary Card → /progress/grammar
    ├── Mistakes Summary Card → /progress/vocabulary
    ├── Mistakes Summary Card → /progress/cultural
    ├── Streaks Section (week view + stats)
    ├── Badges Preview → /badges
    └── Practice Time Section
```

### Route Structure

| Route | Component | Purpose |
|-------|-----------|---------|
| `/progress` | `ProgressPage.tsx` | Main dashboard with overview |
| `/progress/pronunciation` | `PronunciationReviewPage.tsx` | All pronunciation mistakes with audio |
| `/progress/grammar` | `GrammarReviewPage.tsx` | Grammar mistakes with explanations |
| `/progress/vocabulary` | `VocabularyReviewPage.tsx` | Vocabulary mistakes |
| `/progress/cultural` | `CulturalReviewPage.tsx` | Cultural mistakes |

---

## Section 1: Mistakes Overview (Navigation Cards)

Four cards showing count of unmastered mistakes by type. Tapping navigates to detail page.

```
┌──────────────────────────────────────────────────────────────┐
│  Areas to Improve                                            │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │  🎙 Pronunciation   │  │  📝 Grammar          │           │
│  │     4 items         │  │     7 items          │           │
│  │     2 new this week │  │     3 new this week  │           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │  📚 Vocabulary      │  │  🌍 Cultural         │           │
│  │     3 items         │  │     1 item           │           │
│  │     1 new this week │  │     0 new this week  │           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Data Required
- Count of unmastered `ReviewItemDocument` grouped by `errorType`
- Count of items created in last 7 days per type

---

## Section 2: Streaks

Move streak display from header to dedicated section with week calendar view.

```
┌──────────────────────────────────────────────────────────────┐
│  Your Streak                                                 │
│                                                              │
│       M     T     W     T     F     S     S                 │
│       ●     ●     ●     ◐     ○     ○     ○                 │
│                   ↑                                          │
│                 today                                        │
│                                                              │
│  ───────────────────────────────────────────────────────────│
│                                                              │
│     🔥 4 days              ⭐ 12 days                        │
│     current streak         best streak                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Week View Logic
- Show Monday through Sunday of current week
- ● = practiced that day (has entry in `practiceHistory`)
- ○ = did not practice
- ◐ = today (in progress or not yet practiced)
- Highlight today with subtle indicator

### Data Required (New)
```typescript
// Add to UserDocument in types/firestore.ts
practiceHistory?: {
  [date: string]: number;  // YYYY-MM-DD -> seconds practiced that day
};
```

### Implementation
- Update `saveSessionSummary()` to also update `practiceHistory[today]`
- Create `useStreakCalendar()` hook to compute week view data

---

## Section 3: Badges Preview

Compact display of recent badges with link to full collection.

```
┌──────────────────────────────────────────────────────────────┐
│  Achievements                          8 of 27 earned    →  │
│                                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐             │
│  │   🌱   │  │   🔥   │  │   ⭐   │  │   💪   │             │
│  │        │  │        │  │        │  │        │             │
│  └────────┘  └────────┘  └────────┘  └────────┘             │
│   First     Week      10 Stars   Dedicated                  │
│   Steps     Streak               Learner                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Data Required
- 4 most recent badges from `users/{userId}/badges`
- Total earned count and total available count
- Uses existing `useRecentBadges()` hook

---

## Section 4: Practice Time

Total time, daily average, daily goal, and week chart.

```
┌──────────────────────────────────────────────────────────────┐
│  Practice Time                                               │
│                                                              │
│              2h 45m                                          │
│           total practice                                     │
│                                                              │
│  ───────────────────────────────────────────────────────────│
│                                                              │
│     12 min           15 min           80%                   │
│     daily average    daily goal       of goal today         │
│                                                              │
│     ▁ ▃ ▅ ▇ ▃ ▅ ▂                                           │
│     M T W T F S S                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Data Required (New)
```typescript
// Add to UserDocument in types/firestore.ts
dailyPracticeGoal?: number;  // minutes per day (default: 15)
```

### Daily Goal Collection
Add step to onboarding flow OR show "Set Goal" button that opens modal.

**DailyGoalModal options:**
- 5 min (Quick practice)
- 10 min (Light practice)
- 15 min (Recommended)
- 20 min (Dedicated)
- 30 min (Intensive)

### Week Chart
- Simple bar chart using `practiceHistory` data
- Height proportional to minutes that day
- Max height = daily goal (bars can exceed if they practiced more)

---

## Detail Pages: Pronunciation Review

`/progress/pronunciation` - Full page for pronunciation mistakes.

```
┌──────────────────────────────────────────────────────────────┐
│  ←  Pronunciation                              Filter ▼     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  "Yo quero ir al restaurante"                        ● │ │
│  │                                                        │ │
│  │  Correction:                                           │ │
│  │  "Yo quiero ir al restaurante"                         │ │
│  │                                                        │ │
│  │  The verb "querer" requires "ie" in the stem.          │ │
│  │                                                        │ │
│  │  ┌──────────────────┐  ┌──────────────────┐           │ │
│  │  │  ▶ How you said  │  │  ▶ Correct way   │           │ │
│  │  └──────────────────┘  └──────────────────┘           │ │
│  │                                                        │ │
│  │  ☐ Mark as mastered                    Dec 12, 2024   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  "Muchas grathias"                                   ● │ │
│  │  ...                                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Audio Playback Architecture

#### "How you said it" (Student Recording)
- Already stored in `ReviewItemDocument.audioUrl` (Firebase Storage)
- Play using existing `AudioWaveformPlayer` component or simpler inline player

#### "Correct way" (TTS) - WITH CACHING

**Problem**: Calling Google TTS every time wastes API calls and adds latency.

**Solution**: Generate TTS once, cache audio URL in Firestore.

```typescript
// Add to ReviewItemDocument in types/firestore.ts
correctionAudioUrl?: string;        // Cached TTS audio URL
correctionAudioStoragePath?: string; // Storage path for cleanup
```

#### TTS Caching Flow

```
User taps "Correct way" button
         │
         ▼
┌─────────────────────────────────┐
│ Check: correctionAudioUrl exists?│
└─────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
   YES        NO
    │         │
    ▼         ▼
┌────────┐  ┌──────────────────────────────┐
│ Play   │  │ 1. Call Google TTS API       │
│ cached │  │ 2. Upload audio to Storage   │
│ audio  │  │ 3. Get download URL          │
└────────┘  │ 4. Update ReviewItemDocument │
            │    with correctionAudioUrl   │
            │ 5. Play the audio            │
            └──────────────────────────────┘
```

#### Implementation: TTS Service

```typescript
// src/services/ttsService.ts

import { DEFAULT_TARGET_LANGUAGE } from '../constants/languages';

interface TTSResult {
  audioUrl: string;
  storagePath: string;
}

/**
 * Get or generate TTS audio for a correction.
 * Caches result in Firestore to avoid repeated API calls.
 *
 * Uses user's targetLanguage from profile (defaults to Ukrainian).
 */
async function getOrGenerateCorrectionAudio(
  userId: string,
  reviewItemId: string,
  correctionText: string
): Promise<string> {

  // 1. Check if already cached
  const reviewItem = await getReviewItem(userId, reviewItemId);
  if (reviewItem?.correctionAudioUrl) {
    return reviewItem.correctionAudioUrl;
  }

  // 2. Get user's target language from profile
  const userDoc = await getUserDocument(userId);
  const languageCode = userDoc?.targetLanguage || DEFAULT_TARGET_LANGUAGE; // 'uk-UA'

  // 3. Generate TTS audio using user's target language
  const audioBlob = await generateTTS(correctionText, languageCode);

  // 4. Upload to Firebase Storage
  const { downloadUrl, storagePath } = await uploadCorrectionAudio(
    audioBlob,
    reviewItemId,
    userId
  );

  // 5. Update Firestore document with cached audio
  await updateReviewItemWithCorrectionAudio(
    userId,
    reviewItemId,
    downloadUrl,
    storagePath
  );

  // 6. Return URL for immediate playback
  return downloadUrl;
}

/**
 * Generate TTS audio using Google Cloud Text-to-Speech
 * Uses the language code from user's profile settings
 */
async function generateTTS(
  text: string,
  languageCode: string
): Promise<Blob> {
  // Call backend endpoint that wraps Google TTS API
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      languageCode,  // e.g., 'uk-UA' for Ukrainian
      // Google TTS will auto-select appropriate voice for language
    }),
  });

  if (!response.ok) {
    throw new Error('TTS generation failed');
  }

  return response.blob();
}
```

**Note**: When user changes their target language in Profile, existing cached TTS audio remains in the old language. This is acceptable because:
1. The correction text itself is in the target language
2. Cached audio matches what was taught at the time
3. New mistakes will use the new language setting

#### Storage Structure

```
Firebase Storage:
users/
  {userId}/
    errors/
      {reviewItemId}.wav           # Student's recording (existing)
      {reviewItemId}_correct.mp3   # Cached TTS correction (new)
```

---

## Detail Pages: Grammar, Vocabulary, Cultural

Same structure as Pronunciation but without audio buttons.

```
┌──────────────────────────────────────────────────────────────┐
│  ←  Grammar                                    Filter ▼     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  "Yo soy muy hungry"                                 ● │ │
│  │                                                        │ │
│  │  Correction:                                           │ │
│  │  "Yo tengo mucha hambre"                               │ │
│  │                                                        │ │
│  │  In Spanish, hunger is expressed with "tener hambre"   │ │
│  │  (to have hunger), not "ser" (to be).                  │ │
│  │                                                        │ │
│  │  ☐ Mark as mastered                    Dec 12, 2024   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Profile Page: Learning Settings

Add a new "Learning Settings" section to ProfilePage where users can configure their daily goal and target language.

```
┌──────────────────────────────────────────────────────────────┐
│  Learning Settings                                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Target Language                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🇺🇦 Ukrainian                                      ▼  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Daily Practice Goal                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  15 minutes                                         ▼  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Target Language Options

| Language | Code | Flag |
|----------|------|------|
| Ukrainian (default) | `uk-UA` | 🇺🇦 |
| Spanish | `es-ES` | 🇪🇸 |
| French | `fr-FR` | 🇫🇷 |
| German | `de-DE` | 🇩🇪 |
| Italian | `it-IT` | 🇮🇹 |
| Portuguese | `pt-BR` | 🇧🇷 |
| Japanese | `ja-JP` | 🇯🇵 |
| Korean | `ko-KR` | 🇰🇷 |
| Mandarin | `zh-CN` | 🇨🇳 |
| Polish | `pl-PL` | 🇵🇱 |

### Daily Goal Options

| Option | Minutes | Description |
|--------|---------|-------------|
| Quick | 5 | Quick daily practice |
| Light | 10 | Light practice |
| Regular | 15 | Recommended (default) |
| Dedicated | 20 | Dedicated learner |
| Intensive | 30 | Intensive practice |

### Implementation

Add to `ProfilePage.tsx`:
- New "Learning Settings" card below the stats row
- Target language dropdown (uses `targetLanguage` field)
- Daily goal dropdown (uses `dailyPracticeGoal` field)
- Changes save immediately to Firestore

---

## Data Model Changes Summary

### UserDocument (types/firestore.ts)

```typescript
// Add these fields:
targetLanguage?: string;     // BCP-47 code (default: 'uk-UA' for Ukrainian)
dailyPracticeGoal?: number;  // minutes per day goal (default: 15)
practiceHistory?: {
  [date: string]: number;    // YYYY-MM-DD -> seconds practiced
};
```

### ReviewItemDocument (types/firestore.ts)

```typescript
// Add these fields:
correctionAudioUrl?: string;        // Cached TTS audio for correction
correctionAudioStoragePath?: string; // Storage path for cleanup
```

### Supported Languages Constant

```typescript
// src/constants/languages.ts

export const SUPPORTED_LANGUAGES = [
  { code: 'uk-UA', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Mandarin', flag: '🇨🇳' },
  { code: 'pl-PL', name: 'Polish', flag: '🇵🇱' },
] as const;

export const DEFAULT_TARGET_LANGUAGE = 'uk-UA';
export const DEFAULT_DAILY_GOAL = 15; // minutes
```

---

## File Structure

```
src/
├── pages/
│   ├── ProgressPage.tsx              # Main progress dashboard
│   ├── PronunciationReviewPage.tsx   # Pronunciation mistakes detail
│   ├── GrammarReviewPage.tsx         # Grammar mistakes detail
│   ├── VocabularyReviewPage.tsx      # Vocabulary mistakes detail
│   └── CulturalReviewPage.tsx        # Cultural mistakes detail
│
├── components/
│   ├── progress/
│   │   ├── index.ts
│   │   ├── MistakeTypeCard.tsx       # Card showing count per type
│   │   ├── StreakWeekView.tsx        # 7-day calendar visualization
│   │   ├── BadgesPreview.tsx         # 4 recent badges row
│   │   ├── PracticeTimeCard.tsx      # Time stats + week chart
│   │   ├── MistakeCard.tsx           # Individual mistake display
│   │   └── AudioPlayButton.tsx       # Reusable audio play button
│   │
│   └── profile/
│       ├── index.ts
│       ├── LearningSettingsCard.tsx  # Target language + daily goal
│       ├── LanguageSelector.tsx      # Dropdown for target language
│       └── DailyGoalSelector.tsx     # Dropdown for daily goal
│
├── constants/
│   └── languages.ts                  # SUPPORTED_LANGUAGES, defaults
│
├── hooks/
│   ├── useProgressData.ts            # Aggregate all progress data
│   ├── useStreakCalendar.ts          # Week view streak data
│   ├── useMistakesByType.ts          # Fetch mistakes grouped by type
│   └── usePracticeHistory.ts         # Fetch/compute practice stats
│
├── services/
│   ├── ttsService.ts                 # Google TTS with caching
│   └── firebase/
│       └── progressData.ts           # Practice history CRUD
│
└── types/
    └── progress.ts                   # Progress-specific types
```

---

## Implementation Phases

### Phase 0: Profile Learning Settings (Pre-requisite)
- [ ] Create `src/constants/languages.ts` with supported languages
- [ ] Add `targetLanguage` field to UserDocument (default: 'uk-UA')
- [ ] Add `dailyPracticeGoal` field to UserDocument (default: 15)
- [ ] Create `LearningSettingsCard.tsx` component
- [ ] Create `LanguageSelector.tsx` dropdown component
- [ ] Create `DailyGoalSelector.tsx` dropdown component
- [ ] Add Learning Settings section to `ProfilePage.tsx`
- [ ] Wire up Firestore updates on setting change

### Phase 1: Core Progress Page
- [ ] Create `ProgressPage.tsx` with layout
- [ ] Create `MistakeTypeCard.tsx` (4 cards for error types)
- [ ] Add route `/progress` to App.tsx
- [ ] Create `useMistakesByType.ts` hook
- [ ] Wire up navigation to detail pages (placeholder)

### Phase 2: Streaks Section
- [ ] Create `StreakWeekView.tsx` component
- [ ] Add `practiceHistory` field to UserDocument
- [ ] Update `saveSessionSummary()` to track daily practice
- [ ] Create `useStreakCalendar.ts` hook
- [ ] Move streak from header (keep in header too, or remove?)

### Phase 3: Badges & Time Sections
- [ ] Create `BadgesPreview.tsx` component
- [ ] Create `PracticeTimeCard.tsx` component
- [ ] Create `usePracticeHistory.ts` hook
- [ ] Wire up daily goal from user profile settings

### Phase 4: Pronunciation Detail Page
- [ ] Create `PronunciationReviewPage.tsx`
- [ ] Create `MistakeCard.tsx` with audio buttons
- [ ] Create `AudioPlayButton.tsx` component
- [ ] Implement TTS caching service (`ttsService.ts`)
- [ ] Add `correctionAudioUrl` field to ReviewItemDocument
- [ ] Wire up "How you said it" playback (existing audioUrl)
- [ ] Wire up "Correct way" playback (cached TTS using user's targetLanguage)
- [ ] Add backend `/api/tts` endpoint for Google TTS

### Phase 5: Other Detail Pages
- [ ] Create `GrammarReviewPage.tsx`
- [ ] Create `VocabularyReviewPage.tsx`
- [ ] Create `CulturalReviewPage.tsx`
- [ ] Add "Mark as mastered" functionality
- [ ] Add filtering (mastered/unmastered, severity, date)

### Phase 6: Polish
- [ ] Animations and transitions
- [ ] Empty states (no mistakes = celebration!)
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design refinement

---

## Design Principles Applied

1. **Mistakes are opportunities, not failures**
   - Language is warm, encouraging
   - Severity shown subtly (colored dot, not alarming number)
   - "Areas to Improve" not "Errors"

2. **Audio is first-class for pronunciation**
   - One tap to hear how they said it
   - One tap to hear correct pronunciation
   - Cached to avoid API waste and latency

3. **Streaks motivate without shaming**
   - Week view shows pattern, not judgment
   - Missed days are empty, not red X marks
   - Focus on current and best, not "days missed"

4. **Time is investment, not pressure**
   - Total time celebrated
   - Daily goal is optional, encouraging
   - Chart shows effort over time

5. **Badges reward naturally**
   - Small preview, full collection accessible
   - Progress indicator (X of Y) shows path forward
   - Most recent shown = recency bias for motivation

---

## Open Questions

1. **Streak in header**: Keep streak badge in main header AND show in Progress, or move entirely to Progress page?

2. **Daily goal prompt**: Add to onboarding flow, or prompt when user first visits Progress page?
   - **Decision**: Add to Profile page under "Learning Settings". Users can set anytime.

3. ~~**TTS language detection**: Should we detect target language from lesson context, or always use user's learning language?~~
   - **Resolved**: Use `targetLanguage` from user's profile settings. Default is Ukrainian (`uk-UA`). User can change in Profile → Learning Settings.

4. **Mastery criteria**: What makes an item "mastered"? Manual toggle? AI confidence during review lesson? Both?

---

## Dependencies

- Google Cloud Text-to-Speech API (already in use for Gemini)
- Firebase Storage (already configured)
- Existing audio playback infrastructure (`AudioWaveformPlayer`, `WebAudioManager`)

---

*"Simplicity is the ultimate sophistication."* — Leonardo da Vinci (often quoted by Steve Jobs)
