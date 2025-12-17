# Vocabulary Tracking System - Implementation Plan

## Overview

AI-verified vocabulary tracking for the English tutor app. The AI reports vocabulary events during conversation, and the backend maintains the source of truth.

---

## The Baseline Problem

**Question**: How does the system know what words the user already knows?

### The Challenge

- New user starts → we have zero vocabulary data
- English learners already know some words (unlike learning from scratch)
- Can't track "the", "is", "hello" as "learned" - inflates numbers meaninglessly
- Need relevant baseline before personalization works

### Solution: Multi-Layer Baseline

```
┌─────────────────────────────────────────────────────────┐
│              LAYER 1: Level-Based Assumptions           │
├─────────────────────────────────────────────────────────┤
│ User selects level at signup:                           │
│   • Beginner → Assume top 200 words known               │
│   • Elementary → Assume top 500 words known             │
│   • Intermediate → Assume top 1500 words known          │
│   • Upper-Int → Assume top 3000 words known             │
│   • Advanced → Assume top 5000 words known              │
│                                                         │
│ Source: Word frequency lists (Oxford 3000, NGSL, etc.)  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              LAYER 2: Quick Placement (Optional)        │
├─────────────────────────────────────────────────────────┤
│ 2-minute optional assessment:                           │
│   • Show 20 words across difficulty levels              │
│   • User taps "Know" or "Don't Know"                    │
│   • Calibrates actual level vs self-reported            │
│   • Identifies surprising gaps or strengths             │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              LAYER 3: Organic Refinement                │
├─────────────────────────────────────────────────────────┤
│ During conversation:                                    │
│   • AI only tracks words ABOVE user's assumed level     │
│   • If user struggles with "assumed known" word → flag  │
│   • If user uses advanced word correctly → track        │
│   • System refines baseline over 3-5 sessions           │
└─────────────────────────────────────────────────────────┘
```

### Word Frequency Lists (Baseline Source)

| Level | Word Count | Source |
|-------|------------|--------|
| Beginner | 1-500 | New General Service List (NGSL) |
| Elementary | 501-1000 | NGSL + Oxford 3000 |
| Intermediate | 1001-2500 | Oxford 3000 + Academic Word List |
| Upper-Int | 2501-4000 | Academic + Business English |
| Advanced | 4001+ | Domain-specific, idioms, phrasal verbs |

### What AI Should Track vs Ignore

```typescript
// In system prompt
const trackingInstructions = `
VOCABULARY TRACKING RULES:
- Student level: ${userLevel} (assumes top ${assumedKnownCount} words known)
- ONLY call track_vocabulary for words ABOVE their level
- DO NOT track basic words like: the, is, are, have, go, come, etc.
- DO track: phrasal verbs, idioms, topic-specific vocabulary
- DO track if student struggles with a word you'd expect them to know
- When uncertain, track it - backend will deduplicate
`;
```

---

## Topic-Based Vocabulary Injection

**Question**: How do we inject relevant words for a specific lesson topic?

### Data Structure: Words Tagged by Topic

```typescript
interface VocabularyDocument {
  // ... existing fields ...

  // Topic tags
  topics: string[];  // ["food", "restaurant", "cooking"]

  // Difficulty tier
  frequencyRank?: number;  // 1-10000 (lower = more common)
  cefr?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}
```

### Topic Taxonomy

```typescript
const TOPIC_CATEGORIES = {
  daily_life: ["greetings", "family", "home", "routine", "weather"],
  food_dining: ["food", "restaurant", "cooking", "ordering", "recipes"],
  travel: ["airport", "hotel", "directions", "transportation", "sightseeing"],
  work: ["office", "meetings", "email", "interviews", "presentations"],
  health: ["doctor", "symptoms", "pharmacy", "fitness", "emotions"],
  shopping: ["stores", "clothing", "prices", "returns", "online"],
  entertainment: ["movies", "music", "sports", "hobbies", "social_media"],
  education: ["school", "studying", "exams", "university", "learning"],
};
```

### Injection Logic: Match User Vocab to Lesson Topic

```typescript
async function getTopicRelevantVocabulary(
  userId: string,
  lessonTopic: string
): Promise<VocabContext> {
  // 1. Get user's vocabulary
  const userVocab = await getUserVocabulary(userId);

  // 2. Filter by topic relevance
  const topicWords = userVocab.filter(v =>
    v.topics?.includes(lessonTopic) ||
    v.categories?.includes(lessonTopic)
  );

  // 3. Categorize for injection
  const mastered = topicWords
    .filter(v => v.masteryLevel === 'mastered')
    .slice(0, 15);

  const learning = topicWords
    .filter(v => v.masteryLevel === 'learning')
    .slice(0, 10);

  const struggling = topicWords
    .filter(v => v.timesTestedWrong > v.timesTestedCorrect)
    .slice(0, 5);

  // 4. Get topic words user HASN'T learned yet (teaching opportunities)
  const unknownTopicWords = await getTopicWordsNotKnown(userId, lessonTopic, 10);

  return { mastered, learning, struggling, teachingOpportunities: unknownTopicWords };
}
```

### Context Injection for Topic-Based Lesson

```typescript
function buildTopicVocabContext(
  lessonTopic: string,
  vocabContext: VocabContext
): string {
  return `
LESSON TOPIC: ${lessonTopic}

STUDENT'S ${lessonTopic.toUpperCase()} VOCABULARY:

Already mastered (use naturally):
${vocabContext.mastered.map(v => v.word).join(', ') || 'None yet'}

Currently learning (reinforce):
${vocabContext.learning.map(v => `${v.word} (${v.translation})`).join(', ') || 'None yet'}

Struggling with (practice these):
${vocabContext.struggling.map(v => `${v.word} (${v.translation})`).join(', ') || 'None'}

Teaching opportunities (introduce naturally):
${vocabContext.teachingOpportunities.map(v => `${v.word} (${v.translation})`).join(', ')}

INSTRUCTIONS:
- Weave "struggling" words into conversation for practice
- When student uses "learning" words correctly, briefly acknowledge
- Introduce 2-3 "teaching opportunity" words naturally during this session
- Call track_vocabulary when teaching new words or student produces learned words
`;
}
```

### Example: Restaurant Lesson

**User profile**: Intermediate level, 847 words learned

**Topic**: Restaurant/Ordering food

**Injection**:
```
LESSON TOPIC: Restaurant

STUDENT'S RESTAURANT VOCABULARY:

Already mastered (use naturally):
menu, order, waiter, bill, table, delicious, hungry

Currently learning (reinforce):
appetizer, main course, dessert, reservation, tip

Struggling with (practice these):
recommend (keeps saying "suggest"), check (confused with "bill")

Teaching opportunities (introduce naturally):
complimentary, specials, substitution, dietary restrictions, split the bill

INSTRUCTIONS:
- Practice "recommend" - ask "What would you recommend?"
- Clarify "check" vs "bill" if it comes up
- Introduce "specials" naturally: "Would you like to hear today's specials?"
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SESSION START                        │
├─────────────────────────────────────────────────────────┤
│ 1. Fetch user's vocabulary from Firestore               │
│ 2. Categorize: mastered / learning / struggling         │
│ 3. Inject into system prompt (top 50-100 words)         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   DURING SESSION                        │
├─────────────────────────────────────────────────────────┤
│ AI teaches word → calls track_vocabulary(taught)        │
│ User produces word → calls track_vocabulary(produced)   │
│ User struggles → calls mark_for_review (existing)       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   BACKEND RECEIVES                      │
├─────────────────────────────────────────────────────────┤
│ For each word:                                          │
│   - Exists in Firestore? → Update counters              │
│   - New word? → Create entry, firstSeen = now           │
│   - Calculate mastery level based on formula            │
└─────────────────────────────────────────────────────────┘
```

---

## Data Model

### Firestore Collection: `users/{userId}/vocabulary/{wordId}`

```typescript
interface VocabularyDocument {
  id: string;                    // Firestore doc ID (normalized word)
  word: string;                  // "thrilled"
  baseForm?: string;             // "look forward to" (base form)
  translation: string;           // native language equivalent
  partOfSpeech?: string;         // verb, noun, adjective, etc.

  // Tracking Counters
  timesExposed: number;          // AI taught this word
  timesProduced: number;         // User said it correctly
  timesTestedCorrect: number;    // Got it right in review
  timesTestedWrong: number;      // Got it wrong in review

  // Timestamps
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  lastProduced?: Timestamp;      // Last time user used it

  // Context
  contexts: string[];            // Example sentences (max 5)
  categories: string[];          // food, greetings, travel, etc.

  // Computed Mastery
  masteryLevel: 'new' | 'learning' | 'familiar' | 'mastered';
  masteryScore: number;          // 0-100

  // Review Schedule (SRS)
  nextReviewDate?: Timestamp;
  reviewInterval?: number;       // Days until next review
}
```

### Mastery Level Calculation

```typescript
function calculateMasteryLevel(vocab: VocabularyDocument): MasteryLevel {
  const { timesExposed, timesProduced, timesTestedCorrect, timesTestedWrong } = vocab;

  // User produced it correctly = strongest signal
  if (timesProduced >= 3) return 'mastered';
  if (timesProduced >= 1 && timesTestedCorrect >= 2) return 'familiar';
  if (timesExposed >= 3 || timesTestedCorrect >= 1) return 'learning';
  return 'new';
}

function calculateMasteryScore(vocab: VocabularyDocument): number {
  const exposureScore = Math.min(vocab.timesExposed * 5, 20);      // Max 20
  const productionScore = Math.min(vocab.timesProduced * 25, 50);  // Max 50
  const testScore = vocab.timesTestedCorrect * 10 - vocab.timesTestedWrong * 5;

  return Math.max(0, Math.min(100, exposureScore + productionScore + testScore));
}
```

---

## New Function Call: `track_vocabulary`

### Definition (add to `src/types/functions.ts`)

```typescript
{
  name: "track_vocabulary",
  description: "Call when you teach vocabulary or when the student successfully uses vocabulary words. Call for each meaningful vocabulary moment.",
  parameters: {
    type: "object",
    properties: {
      words: {
        type: "array",
        items: {
          type: "object",
          properties: {
            word: { type: "string", description: "The vocabulary word" },
            baseForm: { type: "string", description: "Dictionary form if different" },
            translation: { type: "string", description: "English translation" },
            partOfSpeech: { type: "string", enum: ["noun", "verb", "adjective", "adverb", "particle", "expression"] }
          },
          required: ["word", "translation"]
        },
        description: "Array of vocabulary words"
      },
      event: {
        type: "string",
        enum: ["taught", "user_produced", "user_attempted"],
        description: "taught = you introduced the word, user_produced = student used it correctly, user_attempted = student tried but made error"
      },
      sentence: {
        type: "string",
        description: "The sentence context where the vocabulary appeared"
      },
      category: {
        type: "string",
        description: "Topic category: food, travel, greetings, etc."
      }
    },
    required: ["words", "event"]
  }
}
```

### Function Instructions (add to system prompt)

```
TRACK_VOCABULARY FUNCTION:
- Call when you explicitly teach a new vocabulary word
- Call when the student correctly uses a vocabulary word in conversation
- Do NOT call for basic words the student clearly already knows (hello, yes, the, etc.) unless they're in their struggling list
- Group multiple words from the same sentence into one call
- Include the base form for phrasal verbs (e.g., "looking forward to" → baseForm: "look forward to")
```

---

## Implementation Steps

### Phase 1: Core Tracking (MVP)

1. **Add function definition** to `src/types/functions.ts`
2. **Add handler** in `useGeminiChat.ts` for `track_vocabulary` calls
3. **Create Firestore service** `src/services/firebase/vocabulary.ts`
   - `saveVocabularyEvent(userId, words[], event)`
   - `getUserVocabulary(userId)`
   - `getVocabularyStats(userId)`
4. **Update UI** to show vocabulary count on profile/progress pages

### Phase 2: Context Injection

5. **Fetch vocabulary at session start**
6. **Categorize** into mastered/learning/struggling
7. **Inject into system prompt** for personalization

### Phase 3: Review Integration

8. **Add vocabulary to review system** (SRS scheduling)
9. **Create vocabulary review lessons**
10. **Track review performance** (correct/wrong)

---

## Context Injection Strategy

### Token-Efficient Prompt Injection

```typescript
function buildVocabContext(vocabulary: VocabularyDocument[]): string {
  const mastered = vocabulary
    .filter(v => v.masteryLevel === 'mastered')
    .slice(0, 30)
    .map(v => v.word)
    .join(', ');

  const learning = vocabulary
    .filter(v => v.masteryLevel === 'learning')
    .slice(0, 20)
    .map(v => `${v.word} (${v.translation})`)
    .join(', ');

  const struggling = vocabulary
    .filter(v => v.masteryLevel === 'new' && v.timesTestedWrong > 0)
    .slice(0, 10)
    .map(v => `${v.word} (${v.translation})`)
    .join(', ');

  return `
STUDENT VOCABULARY STATUS:
- Mastered (use freely): ${mastered || 'None yet'}
- Learning (reinforce when natural): ${learning || 'None yet'}
- Struggling (prioritize practice): ${struggling || 'None yet'}
- Total words learned: ${vocabulary.length}

When the student uses words from their "learning" list correctly, acknowledge it briefly.
Naturally incorporate "struggling" words into conversation for practice.
`;
}
```

### When to Inject

- **Always**: Struggling words (max 10)
- **Lesson-relevant**: Words matching lesson category
- **Recent**: Last 20 words learned (for reinforcement)
- **Skip**: Large mastered vocabulary (just mention count)

---

## Counting "Words Learned"

### Definition

```
Words Learned = vocabulary where:
  - masteryLevel IN ('learning', 'familiar', 'mastered')
  - OR timesProduced >= 1
  - OR (timesExposed >= 2 AND timesTestedCorrect >= 1)
```

### Display Tiers

| Count | Label |
|-------|-------|
| Total entries | "Words encountered" |
| learning + familiar + mastered | "Words learned" |
| mastered only | "Words mastered" |

---

## Handling Edge Cases

### Phrasal Verbs & Word Forms

```typescript
// AI should report baseForm for phrasal verbs and variations
{
  word: "looking forward to",   // What was said
  baseForm: "look forward to",  // Base form (for grouping)
  translation: "anticipate with pleasure"
}

// Backend groups by baseForm when calculating stats
// "look forward to", "looking forward to", "looked forward to" all count as knowing the phrase
```

### Duplicate Prevention

```typescript
// 30-second deduplication window (same as review items)
const VOCAB_DEDUP_WINDOW_MS = 30000;

async function saveVocabularyEvent(userId: string, words: VocabWord[], event: string) {
  const now = Date.now();

  for (const word of words) {
    const wordId = normalizeWord(word.baseForm || word.word);
    const existing = await getDoc(doc(db, `users/${userId}/vocabulary/${wordId}`));

    if (existing.exists()) {
      const lastUpdate = existing.data().lastSeen?.toMillis() || 0;
      if (now - lastUpdate < VOCAB_DEDUP_WINDOW_MS) continue; // Skip duplicate

      // Update existing
      await updateDoc(existing.ref, {
        [`times${capitalize(event)}`]: increment(1),
        lastSeen: serverTimestamp(),
        contexts: arrayUnion(word.sentence).slice(-5)
      });
    } else {
      // Create new entry
      await setDoc(doc(db, `users/${userId}/vocabulary/${wordId}`), {
        word: word.word,
        baseForm: word.baseForm,
        translation: word.translation,
        timesExposed: event === 'taught' ? 1 : 0,
        timesProduced: event === 'user_produced' ? 1 : 0,
        timesTestedCorrect: 0,
        timesTestedWrong: 0,
        firstSeen: serverTimestamp(),
        lastSeen: serverTimestamp(),
        contexts: word.sentence ? [word.sentence] : [],
        masteryLevel: 'new',
        masteryScore: 0
      });
    }
  }
}
```

---

## UI Display

### Profile Page Stats

```
┌────────────────────────────────┐
│     Your Vocabulary            │
├────────────────────────────────┤
│  📚 247 words learned          │
│  ⭐ 52 words mastered          │
│  📈 +23 this week              │
│                                │
│  [View All Words]              │
└────────────────────────────────┘
```

### Vocabulary Page (Future)

- List all words with mastery indicators
- Filter by: category, mastery level, date learned
- Tap word to see example sentences
- Manual review/flashcard mode

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Words tracked per session | 5-15 |
| Accuracy (AI reports correct events) | >90% |
| User engagement with vocab stats | Track clicks |
| Correlation: vocab count vs retention | Measure over time |

---

## Competitive Differentiation

### Why Top Apps Avoid This Problem

| App | Approach | Why They Do It |
|-----|----------|----------------|
| **Duolingo** | Structured exercises only | Every word is a database entry. No detection needed. |
| **Babbel** | Lesson-based flashcards | Vocab explicitly defined per lesson. Binary pass/fail. |
| **Rosetta Stone** | Module completion | Image-association. No free text = no parsing problem. |
| **Busuu** | Lessons + human review | Natives grade writing. Expensive but accurate. |
| **Memrise** | Pure SRS flashcards | Most accurate for tracking, but zero conversation. |

**The pattern**: Top apps avoid free-form conversation entirely because vocabulary detection is hard. They use:

```
Structured lesson → Known vocab → Binary pass/fail
```

### Why This App Is Different

This app has real-time AI voice conversation, which creates a harder tracking problem:

```
Free AI conversation → Unknown vocab → ???
```

**But it's also an opportunity.** Apps with AI conversation (like Speak) solve this by having the AI report what was taught/learned. That's exactly what this system does.

### The Unique Value Proposition

| Traditional Apps | This App |
|------------------|----------|
| "Complete 5 exercises to learn 'purchase'" | Natural conversation teaches "purchase" organically |
| Vocab feels like homework | Vocab emerges from real dialogue |
| Can't verify real-world usage | AI verifies contextually correct usage |
| Static word lists | Dynamic, personalized vocabulary |
| "Words seen in exercises" | "Words you actually used correctly" |

### Marketing Angle

> **"AI-Verified Vocabulary Mastery"**
>
> Unlike apps that count exercise completions, we track words you actually use correctly in real conversation. When you say "I was absolutely thrilled about the opportunity" and use vocabulary naturally, that's real learning - and we measure it.

### Technical Moat

1. **Real-time function calling** - AI reports vocab events as they happen
2. **Context awareness** - AI knows taught vs. produced vs. attempted
3. **Phrasal verb handling** - AI provides base forms ("looking forward to" → "look forward to")
4. **Personalized reinforcement** - Context injection enables targeted practice

Most competitors would need to rebuild their entire architecture to add this. They optimized for controlled environments; this app optimized for natural conversation from day one.

---

## Comparison to Top Apps (Detailed)

| Feature | Duolingo | Babbel | Speak | This App |
|---------|----------|--------|-------|----------|
| Free conversation | No | No | Yes | Yes |
| Vocab source | Exercises | Lessons | AI chat | AI chat |
| Detection method | Completion | Flashcard | AI-tagged | AI-verified |
| Accuracy | High | High | High | High |
| Flexibility | Low | Low | High | High |
| Voice-first | No | No | Yes | Yes |
| Personalization | Algorithm | Review mgr | AI | AI + context |
| "Words learned" meaning | Seen in exercise | Passed flashcard | AI reported | AI verified + produced |

**Key insight**: Speak and similar AI-powered language apps use the same approach - AI tags vocabulary it teaches. This validates the architecture.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/types/functions.ts` | Add track_vocabulary definition |
| `src/types/firestore.ts` | Add VocabularyDocument interface |
| `src/services/firebase/vocabulary.ts` | Create - CRUD operations |
| `src/hooks/useGeminiChat.ts` | Add handler for track_vocabulary |
| `src/pages/ProfilePage.tsx` | Add vocabulary stats display |
| `src/pages/VocabularyPage.tsx` | Create - full vocab list (Phase 2) |
