# Custom Lessons & Pronunciation Coach Implementation

## Overview

Two new features for the student homepage:
1. **Create My Own** - Students create personalized practice lessons
2. **Pronunciation Coach** - Quick pronunciation practice for specific words

Both features use system templates (editable by teachers) with placeholder injection.

---

## Visual Hierarchy (Updated Homepage)

```
1. Header (welcome + streak)
2. Weekly Review Card (when available)
3. Continue Learning Card
4. "Practice Scenarios" section title + search
5. Category filters
6. Main Lesson Carousel (teacher-created)
7. Pagination dots
8. ─────────────────────────────────────────
9. "My Practice" section title (only shown when lessons exist)
10. Custom Lessons Carousel (student-created)
11. ─────────────────────────────────────────
12. "Tools" section title
13. Two feature cards (side-by-side desktop, stacked mobile):
    ┌─────────────────┐  ┌─────────────────┐
    │ ✨ Create My    │  │ 🎯 Pronunciation│
    │    Own          │  │    Coach        │
    │                 │  │                 │
    │ "Practice any   │  │ "Learn clear    │
    │  scenario"      │  │  pronunciation" │
    │                 │  │                 │
    │    [Create]     │  │   [Practice]    │
    └─────────────────┘  └─────────────────┘
14. Quick Stats
```

---

## System Templates

### Template ID: `customLessonPrompt`

**Placeholders:** `{{level}}`, `{{practiceDescription}}`

```
You are a friendly English conversation partner helping a {{level}} level student practice.

## THE SCENARIO
The student wants to practice: {{practiceDescription}}

Create a natural, engaging conversation around this topic. Be encouraging and helpful.
Adjust your vocabulary and pace for their {{level}} level:
- A1-A2: Use simple sentences, common words, speak slowly
- B1-B2: Use moderate complexity, natural pace
- C1-C2: Use natural speed, complex structures

## YOUR APPROACH
1. Start with a warm greeting related to the scenario
2. Guide the conversation naturally
3. Ask follow-up questions to keep them engaged
4. Gently help if they struggle (rephrase, give hints)
5. Keep the conversation flowing for the full session

## AUTONOMOUS TRACKING (Use these functions automatically)

### show_session_summary - Call when:
- The conversation reaches a natural end
- You're prompted that time is up
- Rate 1-5 stars based on: participation, engagement, fluency
```

---

### Template ID: `pronunciationCoachPrompt`

**Placeholders:** `{{level}}`, `{{words}}`

```
You are a patient English pronunciation coach helping a {{level}} level student.

## YOUR ROLE
Help the student practice pronouncing these words clearly: {{words}}

## HOW TO COACH
1. Say each word clearly and ask them to repeat
2. Listen carefully to their pronunciation
3. If incorrect, break the word into syllables
4. Give specific feedback on mouth position, tongue placement
5. Celebrate when they get it right: "Perfect! That was clear."
6. Move to the next word once they pronounce correctly

## KEEP IT WARM
- Be encouraging, never critical
- Use phrases like "Almost there!" and "Try once more"
- Make it feel like practice, not a test

## AUTONOMOUS TRACKING (Use these functions automatically)

### update_user_profile - Call when:
- They pronounce a word correctly (log which word they mastered)
- The session is ending (log overall pronunciation progress)

### show_session_summary - Call when:
- They have pronounced ALL words correctly at least once
- You're prompted that time is up
- Rate 1-5 stars based on: effort, improvement, final accuracy
```

---

## Data Models

### CustomLessonDocument

**Collection:** `users/{userId}/customLessons`

```typescript
interface CustomLessonDocument {
  id: string;
  userId: string;
  title: string;                    // Student-provided title
  description: string;              // What they want to practice
  imageUrl?: string;                // Optional uploaded image
  imageStoragePath?: string;        // Firebase Storage path for cleanup
  systemPrompt: string;             // Generated from template with placeholders filled
  durationMinutes: 5;               // Fixed at 5 minutes
  createdAt: Timestamp;
  lastPracticedAt?: Timestamp;      // Updated each time they practice
  practiceCount: number;            // How many times practiced
}
```

### SystemTemplateDocument (Extended)

**New Template IDs:**
```typescript
export const TEMPLATE_IDS = {
  WEEKLY_REVIEW_META_PROMPT: 'weeklyReviewMetaPrompt',
  CUSTOM_LESSON_PROMPT: 'customLessonPrompt',           // NEW
  PRONUNCIATION_COACH_PROMPT: 'pronunciationCoachPrompt', // NEW
} as const;
```

---

## Component Specifications

### 1. ToolsSection.tsx

Container component for the two feature cards.

```tsx
interface ToolsSectionProps {
  onCreateOwn: () => void;
  onPronunciationCoach: () => void;
}
```

**Layout:**
- Desktop: `display: flex; gap: 16px;` (side-by-side)
- Mobile (<600px): `flex-direction: column;` (stacked)
- Each card takes equal space

**Styling:**
- Section title: "Tools" with same styling as "Practice Scenarios"
- Subtle top border or spacing to separate from carousel above

---

### 2. CreateOwnCard.tsx

Feature card for creating custom lessons.

**Visual Design:**
```
┌────────────────────────────────────┐
│  ✨                                │
│  Create My Own                     │
│  "Practice any scenario you        │
│   can imagine"                     │
│                                    │
│  ┌──────────────────────────────┐  │
│  │         Create               │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

**Styling:**
- Background: `rgba(139, 92, 246, 0.1)` (purple tint)
- Border: `1px solid rgba(139, 92, 246, 0.3)`
- Border-radius: 20px
- Hover: subtle lift + shadow

---

### 3. CreateOwnModal.tsx

Modal for creating a custom lesson.

**Fields:**
1. **Title** (required)
   - Label: "Lesson Title"
   - Placeholder: "e.g., At the Doctor's Office"
   - Input field

2. **Description** (required)
   - Label: "What do you want to practice?"
   - Placeholder: "Describe the scenario or situation you want to practice..."
   - Textarea (3-4 lines)

3. **Image** (optional)
   - Reuse existing ImageUpload component
   - Smaller presentation than teacher dashboard

4. **Duration display** (read-only)
   - Show "5 minutes" as fixed info, not editable
   - Small text: "All custom lessons are 5 minutes"

**Buttons:**
- Cancel (secondary)
- Create Lesson (primary gradient)

**Flow:**
1. Student fills form
2. On "Create Lesson":
   - Fetch `customLessonPrompt` template
   - Replace `{{level}}` with user's level from profile
   - Replace `{{practiceDescription}}` with their description
   - Save to Firestore
   - Close modal
   - New lesson appears in "My Practice" carousel

---

### 4. PronunciationCard.tsx

Feature card for pronunciation practice.

**Visual Design:**
```
┌────────────────────────────────────┐
│  🎯                                │
│  Pronunciation Coach               │
│  "Learn clear English              │
│   pronunciation"                   │
│                                    │
│  ┌──────────────────────────────┐  │
│  │        Practice              │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

**Styling:**
- Background: `rgba(59, 130, 246, 0.1)` (blue tint)
- Border: `1px solid rgba(59, 130, 246, 0.3)`
- Border-radius: 20px
- Same dimensions as CreateOwnCard

---

### 5. PronunciationModal.tsx

Modal for entering words to practice.

**Fields:**
1. **Words input** (required)
   - Label: "What words do you want to practice?"
   - Placeholder: "e.g., comfortable, schedule, pronunciation"
   - Input field or textarea
   - Helper text: "Enter words separated by commas"

**Buttons:**
- Cancel (secondary)
- Start Lesson (primary gradient) - appears/enables after typing

**Duration display:**
- Small text: "2 minute quick practice"

**Flow:**
1. Student types words
2. On "Start Lesson":
   - Fetch `pronunciationCoachPrompt` template
   - Replace `{{level}}` with user's level
   - Replace `{{words}}` with their input
   - Create roleConfig (NOT saved to Firestore)
   - Navigate to ChatPage
3. Session does NOT contribute to main stats

---

### 6. MyPracticeSection.tsx

Carousel section for student-created lessons.

**Behavior:**
- **Hidden** when no custom lessons exist (clean homepage)
- **Shown** when at least one custom lesson exists

**Visual:**
- Section title: "My Practice"
- Same carousel pattern as Practice Scenarios
- Cards use same LessonCard component (or simplified version)
- Each card shows:
  - Image (or default placeholder)
  - Title
  - "5 min" duration badge
  - User's level badge
  - Practice count (e.g., "Practiced 3x")

**Card Actions:**
- Tap to start lesson (same flow as regular lessons)
- Long-press or menu for: Edit, Delete

---

## Hooks

### useCustomLessons.ts

```typescript
interface UseCustomLessonsResult {
  lessons: CustomLessonDocument[];
  loading: boolean;
  createLesson: (title: string, description: string, imageUrl?: string, imagePath?: string) => Promise<CustomLessonDocument>;
  deleteLesson: (lessonId: string) => Promise<void>;
  updateLastPracticed: (lessonId: string) => Promise<void>;
}

function useCustomLessons(userId: string | undefined): UseCustomLessonsResult
```

---

## Firebase Services

### customLessons.ts

```typescript
// Collection: users/{userId}/customLessons

export async function getCustomLessons(userId: string): Promise<CustomLessonDocument[]>

export async function createCustomLesson(
  userId: string,
  data: {
    title: string;
    description: string;
    systemPrompt: string;
    imageUrl?: string;
    imageStoragePath?: string;
  }
): Promise<CustomLessonDocument>

export async function deleteCustomLesson(userId: string, lessonId: string): Promise<void>

export async function updateCustomLessonPracticed(userId: string, lessonId: string): Promise<void>
```

### systemTemplates.ts (Extended)

Add new template IDs and default templates:

```typescript
export const TEMPLATE_IDS = {
  WEEKLY_REVIEW_META_PROMPT: 'weeklyReviewMetaPrompt',
  CUSTOM_LESSON_PROMPT: 'customLessonPrompt',
  PRONUNCIATION_COACH_PROMPT: 'pronunciationCoachPrompt',
} as const;

export async function getCustomLessonTemplate(): Promise<SystemTemplateDocument>
export async function getPronunciationCoachTemplate(): Promise<SystemTemplateDocument>
```

---

## ChatPage Integration

### Custom Lessons

When starting a custom lesson:

```typescript
const roleConfig = {
  id: `custom-${lesson.id}`,
  name: lesson.title,
  icon: '✨',
  scenario: lesson.description,
  systemPrompt: lesson.systemPrompt,
  persona: 'tutor' as const,
  tone: 'friendly',
  level: userLevel,
  color: '#8B5CF6',
  durationMinutes: 5,
  functionCallingEnabled: true,
  // Custom lesson tracking
  isCustomLesson: true,
  customLessonId: lesson.id,
};
sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));
navigate(`/chat/custom-${lesson.id}`);
```

### Pronunciation Coach

When starting pronunciation practice:

```typescript
const roleConfig = {
  id: `pronunciation-${Date.now()}`,
  name: 'Pronunciation Coach',
  icon: '🎯',
  scenario: `Practice pronouncing: ${words}`,
  systemPrompt: generatedPrompt,
  persona: 'tutor' as const,
  tone: 'encouraging',
  level: userLevel,
  color: '#3B82F6',
  durationMinutes: 2,
  functionCallingEnabled: true,
  // Quick practice - no stats tracking
  isQuickPractice: true,
};
sessionStorage.setItem('currentRole', JSON.stringify(roleConfig));
navigate(`/chat/pronunciation`);
```

---

## Teacher Dashboard Integration

### Templates Tab Enhancement

Add two new editable templates in the Templates tab:

1. **Custom Lesson Prompt**
   - Same editor pattern as Weekly Review template
   - Shows placeholders: `{{level}}`, `{{practiceDescription}}`

2. **Pronunciation Coach Prompt**
   - Same editor pattern
   - Shows placeholders: `{{level}}`, `{{words}}`

**UI Pattern:**
- Accordion or tabs for each template type
- Or vertical list with expand/collapse

---

## File Structure

```
src/
├── components/
│   ├── home/
│   │   ├── index.ts
│   │   ├── ToolsSection.tsx
│   │   ├── CreateOwnCard.tsx
│   │   ├── CreateOwnModal.tsx
│   │   ├── PronunciationCard.tsx
│   │   ├── PronunciationModal.tsx
│   │   └── MyPracticeSection.tsx
│   └── dashboard/
│       └── TemplatesTab.tsx (extend)
├── hooks/
│   └── useCustomLessons.ts
├── services/
│   └── firebase/
│       ├── customLessons.ts
│       └── systemTemplates.ts (extend)
└── types/
    └── firestore.ts (extend with CustomLessonDocument)
```

---

## Implementation Order

1. **Data layer first:**
   - Extend `firestore.ts` with `CustomLessonDocument` type
   - Extend `systemTemplates.ts` with new template IDs and defaults
   - Create `customLessons.ts` service

2. **Hook:**
   - Create `useCustomLessons.ts`

3. **Components (bottom-up):**
   - `CreateOwnCard.tsx`
   - `PronunciationCard.tsx`
   - `ToolsSection.tsx`
   - `CreateOwnModal.tsx`
   - `PronunciationModal.tsx`
   - `MyPracticeSection.tsx`

4. **Homepage integration:**
   - Add ToolsSection after carousel
   - Add MyPracticeSection between carousel and tools
   - Wire up modal triggers and navigation

5. **Teacher Dashboard:**
   - Extend TemplatesTab to show/edit new templates

---

## Stats Behavior

| Feature | Counts in Stats | Saved to DB |
|---------|-----------------|-------------|
| Custom Lessons | Yes | Yes |
| Pronunciation Coach | No | No (ephemeral) |
| Teacher Lessons | Yes | Yes |
| Weekly Review | Yes | Yes |

---

## Edge Cases

1. **No user level set:** Default to 'B1' for template injection
2. **Empty description/words:** Disable submit button, show validation
3. **Template not found:** Create default on first access (same pattern as weekly review)
4. **Image upload fails:** Allow lesson creation without image
5. **Offline:** Queue creation, sync when online (future enhancement)

---

## Accessibility

- All buttons have aria-labels
- Modals trap focus
- Escape key closes modals
- Color contrast meets WCAG AA
- Touch targets minimum 44x44px

---

## Responsive Breakpoints

- **Mobile (<600px):** Tools cards stack vertically
- **Tablet (600-900px):** Tools cards side-by-side, smaller
- **Desktop (>900px):** Full width with max-width constraint
