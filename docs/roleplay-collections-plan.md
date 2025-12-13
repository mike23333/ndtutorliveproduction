# RolePlay Collections System - Implementation Plan

> **Design Philosophy**: Collections are curated experiences, not folders. Teachers should feel ownership while benefiting from a shared standard library. Every interaction should feel intentional and effortless.

---

## Table of Contents

1. [Overview](#overview)
2. [Data Architecture](#data-architecture)
3. [User Flows](#user-flows)
4. [Lesson Creation UX](#lesson-creation-ux)
5. [UI Components](#ui-components)
6. [Services & Hooks](#services--hooks)
7. [Migration Strategy](#migration-strategy)
8. [Implementation Phases](#implementation-phases)

---

## Overview

### The Problem

- RolePlayPage currently has hardcoded static data
- Teachers cannot control what appears on Homepage vs RolePlay
- No organizational structure for grouping related scenarios
- Lesson creation is a single monolithic flow regardless of context

### The Solution

- **Collections**: Teacher-owned groups of related scenarios (e.g., "Restaurant Conversations")
- **Standard Library**: System-provided collections available to all teachers
- **Clone on Edit**: Teachers can customize system collections without affecting others
- **Dual Placement**: Lessons can appear on Homepage, RolePlay, or both
- **Context-Aware Creation**: Simplified lesson creation when working within a collection

### Mental Model

```
┌─────────────────────────────────────────────────────────────┐
│                     TEACHER'S WORKSPACE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   YOUR COLLECTIONS (full CRUD)                               │
│   ├── Custom collections teacher created                     │
│   └── Cloned system collections (customized)                 │
│                                                              │
│   STANDARD LIBRARY (toggle visibility, clone to edit)        │
│   ├── Restaurant, Travel, Work, etc.                         │
│   └── Teacher enables/disables for their students            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     STUDENT'S VIEW                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   HOMEPAGE                                                   │
│   └── Individual lessons where showOnHomepage = true         │
│                                                              │
│   ROLEPLAY PAGE                                              │
│   ├── Teacher's custom/cloned collections                    │
│   └── Enabled system collections (not cloned)                │
│       Grouped by category, filtered by level                 │
│                                                              │
│   MY PRACTICE (unchanged)                                    │
│   └── Student's own custom lessons                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Architecture

### New Firestore Collections

#### `collections/{collectionId}`

```typescript
interface CollectionDocument {
  id: string;
  teacherId: string;              // 'system' for standard library, or teacher UID

  // Content
  title: string;                  // "Restaurant Conversations"
  description?: string;           // "Essential dining scenarios for travelers"
  category: string;               // "Travel & Dining" - for grouping/filtering

  // Visual
  imageUrl?: string;              // Cover image from storage or URL
  imageStoragePath?: string;      // Firebase Storage path for cleanup
  color?: string;                 // Theme color (hex)
  illustration?: string;          // Illustration type for placeholder

  // Organization
  order: number;                  // Display order in teacher's dashboard
  visibility: 'visible' | 'hidden'; // Teacher can hide their own collections

  // Clone tracking (for cloned system collections)
  clonedFrom?: string;            // Original system collection ID
  clonedAt?: Timestamp;           // When cloned

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `teacherCollectionSettings/{teacherId}`

```typescript
interface TeacherCollectionSettingsDocument {
  teacherId: string;

  // System collections this teacher has hidden (not cloned, just disabled)
  hiddenSystemCollections: string[];

  updatedAt: Timestamp;
}
```

### Updated Existing Collections

#### `missions/{missionId}` (Updated)

```typescript
interface MissionDocument {
  // ... existing fields unchanged ...

  // NEW: Collection membership
  collectionId?: string;          // Which collection this belongs to
  collectionOrder?: number;       // Order within the collection (0-indexed)

  // NEW: Placement control (replaces implicit homepage-only)
  showOnHomepage: boolean;        // Appears in student's assignment grid
  // Note: If collectionId exists, it appears in RolePlay under that collection

  // DEPRECATED (keep for migration, remove later)
  // groupId?: string;            // Old field, no longer used
}
```

### System Collections (Seed Data)

Initial system collections to create:

```typescript
const SYSTEM_COLLECTIONS = [
  {
    id: 'system-restaurant',
    teacherId: 'system',
    title: 'Restaurant',
    description: 'Master dining conversations from ordering to paying',
    category: 'Travel & Dining',
    color: '#F59E0B',
    illustration: 'restaurant',
    order: 1,
  },
  {
    id: 'system-travel',
    teacherId: 'system',
    title: 'Travel',
    description: 'Navigate airports, hotels, and transportation',
    category: 'Travel & Dining',
    color: '#3B82F6',
    illustration: 'travel',
    order: 2,
  },
  {
    id: 'system-job-interview',
    teacherId: 'system',
    title: 'Job Interviews',
    description: 'Prepare for professional conversations',
    category: 'Work & Career',
    color: '#8B5CF6',
    illustration: 'interview',
    order: 3,
  },
  {
    id: 'system-daily-life',
    teacherId: 'system',
    title: 'Daily Interactions',
    description: 'Everyday conversations and errands',
    category: 'Daily Life',
    color: '#10B981',
    illustration: 'daily',
    order: 4,
  },
  {
    id: 'system-shopping',
    teacherId: 'system',
    title: 'Shopping',
    description: 'From browsing to returns',
    category: 'Shopping',
    color: '#EC4899',
    illustration: 'shopping',
    order: 5,
  },
  {
    id: 'system-social',
    teacherId: 'system',
    title: 'Social Situations',
    description: 'Making friends and small talk',
    category: 'Social',
    color: '#F97316',
    illustration: 'social',
    order: 6,
  },
];
```

### Category Presets

Categories are strings on collections, not separate entities. Provide presets:

```typescript
const CATEGORY_PRESETS = [
  'Travel & Dining',
  'Work & Career',
  'Daily Life',
  'Shopping',
  'Social',
  'Health & Wellness',
  'Education',
  'Entertainment',
  'Custom', // Fallback for teacher-created
];
```

---

## User Flows

### Flow 1: Student Views RolePlay Page

```
1. Student opens RolePlay page
2. System fetches:
   a. Teacher's own collections (where teacherId = student.teacherId)
   b. System collections (where teacherId = 'system')
   c. Teacher's settings (hiddenSystemCollections)
3. Filter out:
   a. Hidden system collections
   b. System collections that teacher has cloned (show teacher's version instead)
4. Group collections by category
5. Display with level filter option
6. Student taps collection → sees lessons within
7. Student taps lesson → starts conversation
```

### Flow 2: Teacher Manages RolePlay Content

```
1. Teacher opens Dashboard → RolePlay tab (new)
2. Sees two sections:
   a. "Your Collections" - collections they own
   b. "Standard Library" - system collections with visibility toggles
3. Can:
   a. Create new collection
   b. Edit/delete their own collections
   c. Toggle visibility of system collections
   d. Click "Make It Mine" to clone and customize system collection
```

### Flow 3: Clone System Collection

```
1. Teacher views a system collection
2. Sees "Make It Mine" prompt
3. Clicks → confirmation modal explains what happens
4. System:
   a. Creates new collection with teacherId = teacher's UID
   b. Sets clonedFrom = original system collection ID
   c. Copies all lessons from system collection
   d. Sets lesson teacherId = teacher's UID
   e. Sets lesson collectionId = new collection ID
5. Teacher now has full edit access
6. Original system collection no longer shown to their students
```

### Flow 4: Create Lesson Within Collection Context

```
1. Teacher is viewing their collection
2. Clicks "+ Add Scenario"
3. Simplified modal appears:
   - Title (required)
   - Level dropdown (required)
   - Duration dropdown (default 5 min)
   - "Also show on Homepage?" toggle
   - Collapsed "Advanced" section (prompt, tasks, image)
4. System auto-generates basic prompt from collection context
5. Teacher saves → lesson created with collectionId pre-set
```

### Flow 5: Teacher Controls Homepage Visibility

```
1. Teacher views a collection (their own or cloned)
2. Each lesson shows [Homepage ✓] or [Homepage ○] toggle
3. Quick toggle without opening lesson edit modal
4. Lesson.showOnHomepage updated
5. Student's homepage updates accordingly
```

---

## Lesson Creation UX

> **Design Principle**: Progressive disclosure. Show only what's needed at each step. Advanced options exist but don't overwhelm.

### The Problem with Current LessonFormModal

The current modal is ~700 lines showing everything at once:
- Title, Level, Template selector, System prompt (150+ line textarea), Duration, Tasks, First lesson toggle, Private student assignment, Image upload

**This is overwhelming.** Teachers see a wall of options before they've even named their lesson.

### The Solution: Two Creation Paths

#### Path 1: Quick Create (Within Collection Context)

When teacher is inside a collection and clicks "+ Add Scenario":

```
┌─────────────────────────────────────────────────────────┐
│  Add to "Restaurant"                              [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STEP 1 OF 2                                           │
│                                                         │
│  What scenario are we creating?                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Celebrating a Birthday Dinner                       ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Brief description (optional)                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Practice making reservations and special requests   ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│                              [Cancel]  [Next →]         │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│  Add to "Restaurant"                              [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STEP 2 OF 2                                           │
│                                                         │
│  Level              Duration                            │
│  [B1 ▼]             [5 min ▼]                          │
│                                                         │
│  Also show on Homepage?                                 │
│  Students will see this in their assignments            │
│  [○ No]  [● Yes]                                       │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  ▼ Advanced Options                                     │
│  │ (System prompt, tasks, image - collapsed)           │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│                        [← Back]  [Create Scenario]      │
└─────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Collection is pre-selected (user is already in that context)
- System prompt auto-generated from title + description + collection context
- Advanced options collapsed by default (90% of teachers won't need them)
- Two simple steps, each fits on one screen

#### Path 2: Full Create (From Dashboard Lessons Tab)

When teacher clicks "New Lesson" from the main Lessons tab:

```
┌─────────────────────────────────────────────────────────┐
│  Create New Lesson                                [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STEP 1: What are we practicing?                        │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Title *                                                │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Ordering at a Coffee Shop                           ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Description                                            │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Practice ordering drinks and small talk with        ││
│  │ the barista                                         ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│                                          [Next →]       │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│  Create New Lesson                                [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STEP 2: Who is this for?                               │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Student Level *                                        │
│  [A1] [A2] [B1●] [B2] [C1] [C2]                        │
│                                                         │
│  Assign to specific students? (optional)                │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ○ All students at this level                        ││
│  │ ○ Select specific students...                       ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│                              [← Back]  [Next →]         │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│  Create New Lesson                                [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STEP 3: Where does it appear?                          │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ☑ Show on Homepage (student assignments)              │
│                                                         │
│  ☑ Add to a RolePlay Collection                        │
│    ┌─────────────────────────────────────────────────┐ │
│    │ [Select collection...              ▼]           │ │
│    │  ├── Restaurant                                 │ │
│    │  ├── Daily Life                                 │ │
│    │  └── + Create new collection                    │ │
│    └─────────────────────────────────────────────────┘ │
│                                                         │
│                              [← Back]  [Next →]         │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│  Create New Lesson                                [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STEP 4: Customize (optional)                           │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Duration        [5 min ▼]                             │
│                                                         │
│  ▼ System Prompt (auto-generated, tap to edit)         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ You are a friendly barista at a coffee shop...      ││
│  │ The student is practicing ordering drinks...        ││
│  │ [Auto-generated from title and description]         ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ▶ Add lesson tasks (0)                                │
│  ▶ Upload cover image                                  │
│  ▶ Mark as first lesson for new students               │
│                                                         │
│                       [← Back]  [Create Lesson]         │
└─────────────────────────────────────────────────────────┘
```

### Auto-Generated System Prompts

When teacher provides title + description, we generate a starter prompt:

```typescript
const generateDefaultPrompt = (
  title: string,
  description: string,
  level: ProficiencyLevel,
  collection?: CollectionDocument
): string => {
  const levelGuidance = {
    'A1': 'Use very simple vocabulary and short sentences. Speak slowly.',
    'A2': 'Use basic vocabulary. Keep sentences simple but natural.',
    'B1': 'Use everyday vocabulary. Can handle some complexity.',
    'B2': 'Use varied vocabulary. Can discuss abstract topics.',
    'C1': 'Use sophisticated language. Challenge the student appropriately.',
    'C2': 'Use native-level complexity. Nuanced expressions welcome.',
  };

  const collectionContext = collection
    ? `This is part of the "${collection.title}" collection. ${collection.description || ''}`
    : '';

  return `You are playing a role in a conversation scenario.

**Scenario**: ${title}
${description ? `**Context**: ${description}` : ''}
${collectionContext}

**Student Level**: ${level}
${levelGuidance[level]}

**Your Role**:
- Stay in character throughout the conversation
- Guide the student naturally through the scenario
- Gently correct mistakes without breaking immersion
- Celebrate small wins to build confidence

**Conversation Style**:
- Be warm and encouraging
- Use natural pauses and reactions
- Ask follow-up questions to keep the conversation flowing
- If the student struggles, offer hints rather than answers`;
};
```

Teachers who want full control can edit. Most won't need to.

### Lesson Tasks: Progressive Add

Instead of showing an empty task list upfront:

```
▶ Add lesson tasks (0)
```

Tap to expand:

```
▼ Lesson Tasks
  Students see checkmarks as they complete each task.

  ┌─────────────────────────────────────────────────────┐
  │ 1. │ Order a drink                           [×]   │
  │ 2. │ Ask about food options                  [×]   │
  │ + Add another task                                 │
  └─────────────────────────────────────────────────────┘
```

### Quick Duplicate to Collection

From any lesson, teacher can quickly add to another collection:

```
┌─────────────────────────────────────────────────────────┐
│  Add to Collection                                [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Create a copy of "Ordering Coffee" in:                │
│                                                         │
│  ○ Restaurant (current)                                │
│  ● Daily Life                                          │
│  ○ Travel                                              │
│  ○ + Create new collection                             │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  The copy can be customized independently.              │
│  Original lesson is unchanged.                          │
│                                                         │
│              [Cancel]  [Create Copy]                    │
└─────────────────────────────────────────────────────────┘
```

### Design Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Single collection per lesson | Simpler mental model; duplicate for multi-placement |
| Auto-generate prompts | Reduces blank-page anxiety; teachers edit, not write from scratch |
| Steps instead of single form | Each decision feels intentional; less overwhelming |
| Collapsed advanced options | 90% of teachers use defaults; power users can expand |
| Quick Create vs Full Create | Context-aware: inside collection = fast; dashboard = comprehensive |
| Homepage toggle prominent | Most common customization; shouldn't require full edit |

---

## UI Components

### New Components

#### `src/components/dashboard/RolePlayTab.tsx`

Main container for teacher's RolePlay management:
- Your Collections section with grid of CollectionManageCard
- Standard Library section with toggleable system collections
- Create Collection button

#### `src/components/dashboard/CollectionManageCard.tsx`

Card for teacher's dashboard showing:
- Collection image/illustration
- Title and lesson count
- Edit/Delete actions (for owned collections)
- "Make It Mine" action (for system collections)
- Visibility toggle (for system collections)

#### `src/components/dashboard/CollectionDetailView.tsx`

Expanded view when teacher clicks a collection:
- Collection header with image, title, description
- Editable fields (for owned collections)
- Lesson list with drag-to-reorder
- Per-lesson homepage toggle
- Add lesson button

#### `src/components/dashboard/CollectionFormModal.tsx`

Modal for creating/editing a collection:
- Title input
- Description textarea
- Category dropdown (presets + custom)
- Image upload
- Color picker (optional)

#### `src/components/dashboard/QuickLessonModal.tsx`

Simplified lesson creation within collection context:
- Title
- Level
- Duration
- Homepage toggle
- Collapsed advanced options

#### `src/components/dashboard/CloneCollectionModal.tsx`

Confirmation modal when cloning system collection:
- Explains what will happen
- Shows lesson count being copied
- Confirm/Cancel buttons

### Updated Components

#### `src/pages/RolePlayPage.tsx`

Complete rewrite:
- Fetch collections from Firestore (not hardcoded)
- Group by category
- Level filter from user's actual level
- Navigate to collection detail or directly to lesson

#### `src/components/roleplay/CollectionCard.tsx`

Update to accept dynamic data:
- imageUrl from Firestore (not illustration placeholder)
- Lesson count from actual data
- Click handler for navigation

#### `src/components/dashboard/LessonFormModal.tsx`

Add fields:
- Collection selector (optional - can be standalone)
- showOnHomepage toggle
- collectionOrder (auto-calculated)

#### `src/components/dashboard/LessonListCard.tsx`

Add:
- Collection badge showing which collection it belongs to
- Homepage indicator icon
- Quick homepage toggle

---

## Services & Hooks

### New Services

#### `src/services/firebase/collections.ts`

```typescript
// CRUD operations
export const createCollection = async (data: CreateCollectionInput): Promise<CollectionDocument>;
export const getCollection = async (collectionId: string): Promise<CollectionDocument | null>;
export const updateCollection = async (data: UpdateCollectionInput): Promise<void>;
export const deleteCollection = async (collectionId: string): Promise<void>;

// Queries
export const getCollectionsForTeacher = async (teacherId: string): Promise<CollectionDocument[]>;
export const getSystemCollections = async (): Promise<CollectionDocument[]>;
export const getCollectionsForStudent = async (teacherId: string): Promise<CollectionDocument[]>;

// Clone operation
export const cloneSystemCollection = async (
  systemCollectionId: string,
  teacherId: string,
  teacherName: string
): Promise<CollectionDocument>;

// Teacher settings
export const getTeacherCollectionSettings = async (teacherId: string): Promise<TeacherCollectionSettingsDocument | null>;
export const updateTeacherCollectionSettings = async (
  teacherId: string,
  settings: Partial<TeacherCollectionSettingsDocument>
): Promise<void>;
export const toggleSystemCollectionVisibility = async (
  teacherId: string,
  systemCollectionId: string,
  visible: boolean
): Promise<void>;
```

#### `src/services/firebase/collectionLessons.ts`

```typescript
// Get lessons for a collection
export const getLessonsForCollection = async (collectionId: string): Promise<MissionDocument[]>;

// Reorder lessons within collection
export const reorderCollectionLessons = async (
  collectionId: string,
  lessonIds: string[] // New order
): Promise<void>;

// Quick toggle homepage visibility
export const toggleLessonHomepage = async (
  lessonId: string,
  showOnHomepage: boolean
): Promise<void>;

// Add lesson to collection
export const addLessonToCollection = async (
  lessonId: string,
  collectionId: string,
  order?: number
): Promise<void>;

// Remove lesson from collection
export const removeLessonFromCollection = async (lessonId: string): Promise<void>;
```

### New Hooks

#### `src/hooks/useCollections.ts`

```typescript
export const useCollections = (teacherId: string | undefined) => {
  // Returns teacher's own collections
  const [collections, setCollections] = useState<CollectionDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // CRUD operations
  const createCollection = async (data: CreateCollectionInput) => {...};
  const updateCollection = async (id: string, data: Partial<CollectionDocument>) => {...};
  const deleteCollection = async (id: string) => {...};

  return { collections, loading, createCollection, updateCollection, deleteCollection };
};
```

#### `src/hooks/useSystemCollections.ts`

```typescript
export const useSystemCollections = (teacherId: string | undefined) => {
  // Returns system collections with teacher's visibility preferences applied
  const [systemCollections, setSystemCollections] = useState<CollectionDocument[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleVisibility = async (collectionId: string, visible: boolean) => {...};
  const cloneCollection = async (collectionId: string) => {...};

  return { systemCollections, hiddenIds, loading, toggleVisibility, cloneCollection };
};
```

#### `src/hooks/useCollectionLessons.ts`

```typescript
export const useCollectionLessons = (collectionId: string | undefined) => {
  const [lessons, setLessons] = useState<MissionDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const reorderLessons = async (lessonIds: string[]) => {...};
  const toggleHomepage = async (lessonId: string, show: boolean) => {...};
  const addLesson = async (lessonData: CreateMissionInput) => {...};
  const removeLesson = async (lessonId: string) => {...};

  return { lessons, loading, reorderLessons, toggleHomepage, addLesson, removeLesson };
};
```

#### `src/hooks/useStudentRolePlay.ts`

```typescript
export const useStudentRolePlay = (teacherId: string | undefined, studentLevel: string | undefined) => {
  // Combines teacher collections + visible system collections
  // Groups by category
  // Filters by level if specified
  const [collections, setCollections] = useState<CollectionWithLessons[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  return { collections, categories, loading };
};
```

---

## Migration Strategy

### Phase 1: Schema Addition (Non-breaking)

1. Add new fields to MissionDocument:
   - `collectionId?: string`
   - `collectionOrder?: number`
   - `showOnHomepage?: boolean`

2. Create collections Firestore collection

3. Backfill existing missions:
   ```typescript
   // All existing missions get:
   showOnHomepage: true,       // Preserve current behavior
   collectionId: undefined,    // No collection yet
   collectionOrder: undefined,
   ```

### Phase 2: System Collections

1. Create system collections documents
2. Create system lessons within each collection
3. These are new content, not migrated

### Phase 3: UI Rollout

1. Add RolePlay tab to teacher dashboard
2. Update RolePlayPage for students to use new data
3. Update LessonFormModal with collection fields

### Phase 4: Cleanup (Future)

1. Remove deprecated `groupId` field from missions
2. Remove hardcoded data from RolePlayPage

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create Firestore types for collections
- [ ] Implement collections.ts service (CRUD)
- [ ] Implement collectionLessons.ts service
- [ ] Create useCollections hook
- [ ] Create useCollectionLessons hook
- [ ] Write migration script for existing missions

### Phase 2: Teacher Dashboard (Week 2)
- [ ] Create RolePlayTab component
- [ ] Create CollectionManageCard component
- [ ] Create CollectionFormModal component
- [ ] Create CollectionDetailView component
- [ ] Add RolePlay tab to TeacherDashboard
- [ ] Implement drag-to-reorder for lessons

### Phase 3: System Collections (Week 2-3)
- [ ] Create system collections seed data
- [ ] Create system lessons content
- [ ] Implement TeacherCollectionSettings
- [ ] Create useSystemCollections hook
- [ ] Add visibility toggles to RolePlayTab
- [ ] Implement clone functionality
- [ ] Create CloneCollectionModal

### Phase 4: Student Experience (Week 3)
- [ ] Create useStudentRolePlay hook
- [ ] Rewrite RolePlayPage with dynamic data
- [ ] Update CollectionCard for dynamic content
- [ ] Implement category grouping
- [ ] Implement level filtering
- [ ] Add collection detail view for students

### Phase 5: Lesson Creation Flow (Week 4)
- [ ] Create QuickLessonModal component
- [ ] Update LessonFormModal with collection fields
- [ ] Add homepage toggle to lesson list
- [ ] Auto-generate prompts for quick creation
- [ ] Add "Add to Collection" from existing lessons

### Phase 6: Polish & Testing (Week 4)
- [ ] End-to-end testing of all flows
- [ ] Performance optimization (pagination, caching)
- [ ] Error handling and edge cases
- [ ] UI polish and animations
- [ ] Documentation updates

---

## Resolved Decisions

1. **Lesson in multiple collections?**
   - **Decision**: Single collection per lesson.
   - **Rationale**: Simpler mental model. Teachers can duplicate a lesson to place it in another collection, allowing customization for each context.

2. **Teacher workspace isolation?**
   - **Decision**: Fully isolated. Each teacher's collections and lessons are private.
   - **Rationale**: Simpler permissions model. No cross-teacher visibility concerns.

3. **System collection customization?**
   - **Decision**: Clone-on-edit. Teachers can "Make It Mine" to get a fully editable copy.
   - **Rationale**: Shared content for efficiency, full customization when needed.

4. **Lesson creation approach?**
   - **Decision**: Progressive disclosure with two paths (Quick Create within collection, Full Create from dashboard).
   - **Rationale**: Reduces cognitive load. Auto-generate prompts for teachers who don't need full control.

---

## Future Considerations

1. **Collection sharing between teachers?**
   - Teachers share collections with colleagues
   - Would require permission model and sharing UI
   - *Priority: Low - evaluate after v1 adoption*

2. **Analytics per collection?**
   - Track which collections/scenarios students engage with most
   - Collection-level completion rates and time spent
   - *Priority: Medium - adds value for teachers*

3. **Collection templates marketplace?**
   - Teachers publish collections for others to clone
   - Rating/review system for quality
   - *Priority: Low - requires community features*

4. **AI-assisted prompt generation?**
   - Use LLM to generate richer prompts from title/description
   - Suggest tasks based on scenario type
   - *Priority: Medium - improves creation experience*

---

## Success Metrics

- Teachers create at least one custom collection within first week
- 50%+ of teachers customize at least one system collection
- Student engagement with RolePlay increases 30%+
- Lesson creation time decreases (via quick creation flow)
- Teacher satisfaction with organization features

---

## Appendix: Component Tree

```
TeacherDashboard
├── RolePlayTab (NEW)
│   ├── YourCollectionsSection
│   │   ├── CollectionManageCard (multiple)
│   │   └── CreateCollectionButton
│   └── StandardLibrarySection
│       └── SystemCollectionCard (multiple)
│           ├── VisibilityToggle
│           └── MakeItMineButton
│
├── CollectionDetailView (NEW - modal or page)
│   ├── CollectionHeader
│   │   ├── ImageUpload
│   │   ├── TitleInput
│   │   └── DescriptionInput
│   ├── LessonList (draggable)
│   │   └── LessonRow (multiple)
│   │       ├── DragHandle
│   │       ├── LessonInfo
│   │       ├── HomepageToggle
│   │       ├── DuplicateButton → DuplicateToCollectionModal
│   │       └── EditButton
│   └── AddLessonButton → QuickLessonStepper
│
├── CollectionFormModal (NEW)
│
├── QuickLessonStepper (NEW - 2 steps, within collection context)
│   ├── Step1: Title + Description
│   └── Step2: Level + Duration + Homepage toggle + Advanced (collapsed)
│
├── FullLessonStepper (NEW - 4 steps, from dashboard)
│   ├── Step1: What (Title + Description)
│   ├── Step2: Who (Level + Student assignment)
│   ├── Step3: Where (Homepage + Collection picker)
│   └── Step4: Customize (Duration + Prompt + Tasks + Image - collapsible)
│
├── DuplicateToCollectionModal (NEW)
│   └── Collection picker with "Create new" option
│
└── CloneCollectionModal (NEW)
    └── Confirmation + collection info

RolePlayPage (REWRITE for students)
├── Header
├── LevelFilter (chip selector)
├── CategorySections (dynamic, grouped by collection.category)
│   └── CategorySection (multiple)
│       ├── CategoryHeader
│       └── CollectionGrid
│           └── CollectionCard (multiple)
│               ├── Cover image (from DB)
│               ├── Title
│               └── Lesson count
└── CollectionDetailSheet (bottom sheet when collection tapped)
    ├── CollectionHeader (image + description)
    └── LessonList
        └── LessonItem (multiple)
            ├── Title + Level badge
            ├── Duration
            └── Completion indicator
```

### Modal State Flow

```
Teacher Dashboard
│
├─ "New Lesson" button (top) ────────→ FullLessonStepper
│
├─ RolePlayTab
│   ├─ "Create Collection" ──────────→ CollectionFormModal
│   ├─ CollectionCard click ─────────→ CollectionDetailView
│   │   ├─ "+ Add Scenario" ─────────→ QuickLessonStepper (pre-filled collection)
│   │   └─ Lesson row "..." menu
│   │       ├─ "Edit" ───────────────→ FullLessonStepper (edit mode)
│   │       └─ "Add to Collection" ──→ DuplicateToCollectionModal
│   └─ SystemCollectionCard
│       └─ "Make It Mine" ───────────→ CloneCollectionModal
│
└─ LessonsTab
    └─ Lesson row "..." menu
        ├─ "Edit" ───────────────────→ FullLessonStepper (edit mode)
        └─ "Add to Collection" ──────→ DuplicateToCollectionModal
```

---

*Document Version: 1.1*
*Created: December 2024*
*Updated: December 2024 - Added progressive disclosure lesson creation UX*
*Author: Design & Engineering*
