# Role Play Page Design Document

## Overview

A curated collection of conversational role plays for all English proficiency levels (A1-C2). Students can browse by level, explore collections, and preview what they'll learn before starting.

---

## Design Philosophy

Following Jony Ive principles:
- **Reduction** - Remove everything unnecessary, let content breathe
- **Hierarchy through whitespace** - Not just visual elements
- **Emotional connection** - Each collection feels like a curated experience
- **Progressive disclosure** - Show just enough, reveal more on interaction

---

## Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  ← Role Play                                    🔍      │
│                                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│  │ A1 │ │ A2 │ │ B1 │ │ B2 │ │ C1 │ │ C2 │  ← tabs    │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘            │
│   ▔▔▔▔                                                  │
│                                                         │
│  Collections                              See all →     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ ☕       │ │ ✈️        │ │ 💼       │  ← scroll    │
│  │ Everyday │ │ Travel   │ │ Work     │               │
│  │ 12 roles │ │ 8 roles  │ │ 6 roles  │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                         │
│  🔥 Popular in A1                                      │
│  ┌───────────────────┐ ┌───────────────────┐          │
│  │ 🖼️                │ │ 🖼️                │          │
│  │ Ordering Coffee   │ │ Meeting Someone   │          │
│  │ ☕ Everyday · 5min │ │ 🎉 Social · 4min  │          │
│  └───────────────────┘ └───────────────────┘          │
│                                                         │
│  ☕ Everyday                           See all →        │
│  ┌───────────────────┐ ┌───────────────────┐          │
│  │ ...               │ │ ...               │          │
│  └───────────────────┘ └───────────────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Header

```
┌─────────────────────────────────────────────────────────┐
│  ←  Role Play                                   🔍      │
└─────────────────────────────────────────────────────────┘
```

- **Back button**: Returns to HomePage
- **Title**: "Role Play" - centered or left-aligned
- **Search icon**: Opens search overlay (future enhancement)

---

### 2. Level Tabs

```
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│ A1 │ │ A2 │ │ B1 │ │ B2 │ │ C1 │ │ C2 │
└────┘ └────┘ └────┘ └────┘ └────┘ └────┘
 ▔▔▔▔
```

#### States

| State | Style |
|-------|-------|
| **Selected (Your Level)** | Gradient fill + small dot indicator |
| **Selected (Other Level)** | Gradient fill, no dot |
| **Unselected** | Transparent with border |

#### Behavior

- Default selection: Student's current level
- "Your level" indicator: Small dot on their assigned level
- Instant filtering: All content below updates when tab changes
- Horizontal scroll on mobile if needed (unlikely with 6 tabs)

#### Visual Specs

```css
/* Selected Tab */
background: linear-gradient(135deg, #d8b4fe, #60a5fa);
color: #1e1b4b;
border-radius: 12px;
padding: 8px 16px;
font-weight: 600;

/* Unselected Tab */
background: transparent;
border: 1px solid rgba(129, 140, 248, 0.3);
color: #d8b4fe;
border-radius: 12px;
padding: 8px 16px;

/* Your Level Dot */
width: 6px;
height: 6px;
background: #1e1b4b;
border-radius: 50%;
margin-left: 4px;
```

---

### 3. Collections (Horizontal Scroll)

```
Collections                              See all →
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│    ☕    │ │    ✈️    │ │    💼    │ │    🏥    │
│ Everyday │ │  Travel  │ │   Work   │ │  Health  │
│ 12 roles │ │ 8 roles  │ │ 6 roles  │ │ 5 roles  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
                                          ← scroll →
```

#### Collection Chip Design

```css
/* Container */
width: 100px;
padding: 16px 12px;
background: rgba(99, 102, 241, 0.15);
border: 1px solid rgba(129, 140, 248, 0.2);
border-radius: 16px;
text-align: center;
flex-shrink: 0;

/* Selected State */
background: rgba(99, 102, 241, 0.3);
border-color: #d8b4fe;

/* Icon */
font-size: 28px;
margin-bottom: 8px;

/* Name */
font-size: 13px;
font-weight: 600;
color: #ffffff;

/* Count */
font-size: 11px;
color: rgba(216, 180, 254, 0.7);
margin-top: 4px;
```

#### Collections List

| Collection | Icon | Description |
|-----------|------|-------------|
| **Everyday** | ☕ | Daily life situations - café, restaurant, shopping, small talk |
| **Travel** | ✈️ | Airport, hotel, directions, taxi, tourist attractions |
| **Work** | 💼 | Job interview, meetings, presentations, networking |
| **Health** | 🏥 | Doctor visits, pharmacy, describing symptoms, emergency |
| **Social** | 🎉 | Parties, dating, making friends, invitations |
| **Services** | 🏦 | Bank, post office, phone contracts, appointments |
| **Education** | 📚 | Classroom, tutoring, study groups, university |
| **Emergency** | 🚨 | Police, lost items, complaints, urgent situations |

#### Behavior

- **Click collection**: Scrolls to that collection section OR filters to show only that collection
- **Count updates**: Shows role play count for selected level
- **"See all"**: Opens full collections page (future)

---

### 4. Role Play Sections

```
🔥 Popular in A1
┌───────────────────┐ ┌───────────────────┐
│ 🖼️ Image          │ │ 🖼️ Image          │
│ ──────────────    │ │ ──────────────    │
│ Ordering Coffee   │ │ Meeting Someone   │
│ ☕ Everyday · 5min │ │ 🎉 Social · 4min  │
└───────────────────┘ └───────────────────┘
```

#### Section Types

1. **🔥 Popular in [Level]** - Most played role plays for selected level
2. **Collection sections** - Role plays grouped by collection (Everyday, Travel, etc.)
3. **✨ New** - Recently added role plays (optional)
4. **🎯 Recommended** - Based on student's history (future)

#### Section Header

```css
/* Container */
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 12px;

/* Title */
font-size: 16px;
font-weight: 600;
color: #ffffff;

/* See all link */
font-size: 13px;
color: #d8b4fe;
```

---

### 5. Role Play Card

```
┌─────────────────────────────┐
│                             │
│      🖼️ Image (16:9)        │
│                             │
│  ┌─────┐                    │  ← Level badge (if browsing "All")
│  │ A1  │                    │
│  └─────┘                    │
├─────────────────────────────┤
│ Ordering at a Café          │  ← Title
│ ☕ Everyday · 5 min          │  ← Collection + Duration
└─────────────────────────────┘
```

#### Card Specs

```css
/* Container */
background: rgba(45, 40, 84, 0.6);
border-radius: 20px;
overflow: hidden;
border: 1px solid rgba(129, 140, 248, 0.15);

/* Image Container */
position: relative;
aspect-ratio: 16/9;
background: linear-gradient(to top, rgba(15, 13, 26, 0.8), transparent);

/* Level Badge (optional) */
position: absolute;
top: 8px;
left: 8px;
padding: 4px 8px;
border-radius: 8px;
font-size: 11px;
font-weight: 600;
/* Colors vary by level */

/* Content */
padding: 12px;

/* Title */
font-size: 14px;
font-weight: 600;
color: #ffffff;
margin-bottom: 4px;

/* Meta (collection + duration) */
font-size: 12px;
color: rgba(216, 180, 254, 0.7);
display: flex;
align-items: center;
gap: 6px;
```

#### Level Badge Colors

| Level | Background | Text |
|-------|------------|------|
| A1 | rgba(74, 222, 128, 0.2) | #4ade80 |
| A2 | rgba(74, 222, 128, 0.2) | #4ade80 |
| B1 | rgba(251, 191, 36, 0.2) | #fbbf24 |
| B2 | rgba(251, 191, 36, 0.2) | #fbbf24 |
| C1 | rgba(248, 113, 113, 0.2) | #f87171 |
| C2 | rgba(248, 113, 113, 0.2) | #f87171 |

#### States

- **Default**: As shown above
- **Completed**: Checkmark overlay on image corner
- **Locked**: Grayscale with lock icon (for premium/future)
- **Pressed**: Scale to 0.98, slight shadow change

---

## Lesson Preview Modal

When a user clicks on a role play card, this modal appears:

```
┌─────────────────────────────────────────────────────────┐
│                                                    ✕    │
│                                                         │
│         ┌─────────────────────────────┐                │
│         │                             │                │
│         │       🖼️ Large Image        │                │
│         │         (16:9)              │                │
│         │                             │                │
│         └─────────────────────────────┘                │
│                                                         │
│              Ordering at a Café                        │
│                                                         │
│         ☕ Everyday  ·  A1  ·  5 min                    │
│                                                         │
│  ───────────────────────────────────────────────────   │
│                                                         │
│  What you'll practice                                  │
│                                                         │
│  ✓  Greetings and polite requests                      │
│  ✓  Numbers and prices                                 │
│  ✓  Food and drink vocabulary                          │
│  ✓  Saying thank you naturally                         │
│                                                         │
│  ───────────────────────────────────────────────────   │
│                                                         │
│  The scenario                                          │
│                                                         │
│  You're at a cozy café and want to order               │
│  a coffee and a pastry. The barista is                 │
│  friendly but the café is busy.                        │
│                                                         │
│  ───────────────────────────────────────────────────   │
│                                                         │
│  👤 You play: Customer                                 │
│  🤖 AI plays: Barista                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │              ▶  Start Role Play                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Modal Sections

#### 1. Header

- Close button (X) in top right
- Large image (same as card but bigger)
- Title centered below image
- Meta info: Collection icon + name · Level · Duration

#### 2. What You'll Practice

- Section title: "What you'll practice"
- Bullet list with checkmarks (3-5 items)
- Each item is a learning outcome

#### 3. The Scenario (Optional)

- Brief description of the situation
- Sets context and expectations
- 2-3 sentences max

#### 4. Roles

- Clear indication of who plays whom
- "You play: [Role]"
- "AI plays: [Role]"

#### 5. Start Button

- Full-width gradient button
- Play icon + "Start Role Play"
- Navigates to ChatPage with role play config

### Modal Specs

```css
/* Overlay */
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.7);
z-index: 1000;
display: flex;
align-items: flex-end; /* Slides up from bottom on mobile */

/* Content */
background: #1e1b4b;
border-radius: 24px 24px 0 0;
max-height: 90vh;
overflow-y: auto;
padding: 24px;
width: 100%;
max-width: 480px;
margin: 0 auto;

/* On desktop: center vertically */
@media (min-width: 640px) {
  align-items: center;
  border-radius: 24px;
  margin: auto;
}

/* Close Button */
position: absolute;
top: 16px;
right: 16px;
width: 32px;
height: 32px;
background: rgba(255, 255, 255, 0.1);
border-radius: 50%;
color: #d8b4fe;

/* Image */
width: 100%;
aspect-ratio: 16/9;
border-radius: 16px;
object-fit: cover;
margin-bottom: 16px;

/* Title */
font-size: 22px;
font-weight: 700;
color: #ffffff;
text-align: center;
margin-bottom: 8px;

/* Meta */
font-size: 14px;
color: rgba(216, 180, 254, 0.8);
text-align: center;
display: flex;
justify-content: center;
gap: 8px;

/* Divider */
height: 1px;
background: rgba(129, 140, 248, 0.2);
margin: 20px 0;

/* Section Title */
font-size: 15px;
font-weight: 600;
color: #ffffff;
margin-bottom: 12px;

/* Learning Points */
font-size: 14px;
color: rgba(216, 180, 254, 0.9);
line-height: 1.6;
padding-left: 24px;

/* Checkmark */
color: #4ade80;
margin-right: 8px;

/* Scenario Text */
font-size: 14px;
color: rgba(216, 180, 254, 0.8);
line-height: 1.6;

/* Roles */
display: flex;
gap: 24px;
justify-content: center;
font-size: 14px;
color: #d8b4fe;

/* Start Button */
width: 100%;
padding: 16px;
background: linear-gradient(135deg, #d8b4fe, #60a5fa);
border-radius: 14px;
font-size: 16px;
font-weight: 600;
color: #1e1b4b;
margin-top: 24px;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
```

---

## Data Types

### TypeScript Interfaces

```typescript
// src/types/roleplay.ts

import { ProficiencyLevel, ConversationTone } from './firestore'

/**
 * Collection/Category for grouping role plays
 */
export interface RolePlayCollection {
  id: string
  name: string
  icon: string                    // Emoji
  description: string
  displayOrder: number
}

/**
 * Individual role play scenario
 */
export interface RolePlay {
  id: string
  collectionId: string

  // Display
  title: string
  subtitle?: string               // Short tagline
  imageUrl: string

  // Metadata
  level: ProficiencyLevel         // A1, A2, B1, B2, C1, C2
  durationMinutes: number

  // Learning outcomes
  learningPoints: string[]        // What you'll practice

  // Scenario
  scenarioDescription: string     // The scenario text
  studentRole: string             // "Customer"
  aiRole: string                  // "Barista"

  // Chat configuration
  systemPrompt: string
  tone: ConversationTone

  // Sorting & filtering
  popularity: number              // For "Popular" section
  displayOrder: number            // Within collection

  // Flags
  isNew?: boolean
  isPremium?: boolean
  isActive: boolean

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

/**
 * User's progress on a role play
 */
export interface RolePlayProgress {
  id: string
  oderId: string
  rolePlayId: string

  completedAt?: Date
  lastPlayedAt: Date
  playCount: number

  // Performance (optional, for future)
  averageScore?: number
  masteredPoints?: string[]       // Learning points they've mastered
}

/**
 * Role play with user's completion status
 */
export interface RolePlayWithProgress extends RolePlay {
  completed: boolean
  playCount: number
  lastPlayedAt?: Date
}
```

---

## Firestore Structure

```
/rolePlayCollections/{collectionId}
  - id: string
  - name: string
  - icon: string
  - description: string
  - displayOrder: number

/rolePlays/{rolePlayId}
  - id: string
  - collectionId: string
  - title: string
  - subtitle: string
  - imageUrl: string
  - level: string
  - durationMinutes: number
  - learningPoints: string[]
  - scenarioDescription: string
  - studentRole: string
  - aiRole: string
  - systemPrompt: string
  - tone: string
  - popularity: number
  - displayOrder: number
  - isNew: boolean
  - isPremium: boolean
  - isActive: boolean
  - createdAt: timestamp
  - updatedAt: timestamp

/users/{userId}/rolePlayProgress/{progressId}
  - userId: string
  - rolePlayId: string
  - completedAt: timestamp
  - lastPlayedAt: timestamp
  - playCount: number
```

### Indexes Required

```
// Query role plays by level and collection
rolePlays: level ASC, collectionId ASC, displayOrder ASC

// Query role plays by level and popularity
rolePlays: level ASC, popularity DESC

// Query user progress
rolePlayProgress: userId ASC, rolePlayId ASC
```

---

## Component Files

```
src/
├── pages/
│   └── RolePlayPage.tsx              # Main page
│
├── components/
│   └── roleplay/
│       ├── LevelTabs.tsx             # A1-C2 tab selector
│       ├── CollectionScroll.tsx      # Horizontal collection chips
│       ├── CollectionChip.tsx        # Individual collection chip
│       ├── RolePlaySection.tsx       # Section with header + grid
│       ├── RolePlayCard.tsx          # Individual role play card
│       ├── RolePlayPreviewModal.tsx  # Lesson preview popup
│       └── index.ts                  # Barrel export
│
├── hooks/
│   └── useRolePlays.ts               # Data fetching hook
│
├── services/
│   └── rolePlayService.ts            # Firestore operations
│
└── types/
    └── roleplay.ts                   # TypeScript types
```

---

## Navigation Flow

```
HomePage
    │
    ▼
RolePlayPage (browse by level + collection)
    │
    ▼ (click card)
RolePlayPreviewModal (learn what you'll practice)
    │
    ▼ (click "Start Role Play")
ChatPage (with role play config in sessionStorage)
    │
    ▼ (complete or exit)
RolePlayPage (with completion marked)
```

### Session Storage Config

When starting a role play, store config similar to lessons:

```typescript
const rolePlayConfig = {
  id: rolePlay.id,
  title: rolePlay.title,
  systemPrompt: rolePlay.systemPrompt,
  tone: rolePlay.tone,
  durationMinutes: rolePlay.durationMinutes,
  studentRole: rolePlay.studentRole,
  aiRole: rolePlay.aiRole,
  type: 'roleplay'  // Distinguish from regular lessons
}

sessionStorage.setItem('currentRole', JSON.stringify(rolePlayConfig))
navigate('/chat')
```

---

## Responsive Behavior

### Mobile (< 640px)

- Level tabs: Full width, may scroll horizontally
- Collections: Horizontal scroll
- Role play grid: 2 columns
- Modal: Slides up from bottom, rounded top corners

### Tablet/Desktop (≥ 640px)

- Content max-width: 640px, centered
- Level tabs: Centered, no scroll needed
- Modal: Centered vertically, all corners rounded
- Same 2-column grid (cards get larger)

---

## Accessibility

### Requirements

1. **Keyboard navigation**: Tab through level tabs, collections, cards
2. **Focus indicators**: Visible focus rings on all interactive elements
3. **Screen readers**:
   - Level tabs: `role="tablist"`, `role="tab"`, `aria-selected`
   - Cards: `role="button"`, descriptive `aria-label`
   - Modal: `role="dialog"`, `aria-modal="true"`, focus trap
4. **Reduced motion**: Respect `prefers-reduced-motion`

### ARIA Labels

```html
<!-- Level Tab -->
<button
  role="tab"
  aria-selected="true"
  aria-label="Level A1, your current level"
>

<!-- Role Play Card -->
<button
  role="button"
  aria-label="Ordering at a Café, Everyday collection, 5 minutes, Level A1"
>

<!-- Modal -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
```

---

## Future Enhancements

### Phase 2

- **Search**: Full-text search across role plays
- **Favorites**: Save role plays for later
- **Recommended**: ML-based recommendations
- **Filters**: Multiple filter options (duration, completion status)

### Phase 3

- **Teacher assignment**: Teachers can assign specific role plays
- **Custom role plays**: Teachers create their own
- **Analytics**: Track student performance across role plays
- **Achievements**: Badges for completing collections

### Phase 4

- **Difficulty progression**: Unlock harder variants
- **Branching scenarios**: Different paths based on choices
- **Multiplayer**: Role play with another student
- **Voice-first**: Optimized for speaking practice

---

## Sample Data

### Collections

```typescript
const collections: RolePlayCollection[] = [
  { id: 'everyday', name: 'Everyday', icon: '☕', description: 'Daily life situations', displayOrder: 1 },
  { id: 'travel', name: 'Travel', icon: '✈️', description: 'Traveling and tourism', displayOrder: 2 },
  { id: 'work', name: 'Work', icon: '💼', description: 'Professional situations', displayOrder: 3 },
  { id: 'health', name: 'Health', icon: '🏥', description: 'Medical and wellness', displayOrder: 4 },
  { id: 'social', name: 'Social', icon: '🎉', description: 'Social interactions', displayOrder: 5 },
  { id: 'services', name: 'Services', icon: '🏦', description: 'Banks, offices, appointments', displayOrder: 6 },
  { id: 'education', name: 'Education', icon: '📚', description: 'School and learning', displayOrder: 7 },
  { id: 'emergency', name: 'Emergency', icon: '🚨', description: 'Urgent situations', displayOrder: 8 },
]
```

### Sample Role Plays (A1)

```typescript
const sampleRolePlays: RolePlay[] = [
  {
    id: 'cafe-order-a1',
    collectionId: 'everyday',
    title: 'Ordering at a Café',
    subtitle: 'Get your morning coffee',
    imageUrl: '/images/roleplay/cafe.jpg',
    level: 'A1',
    durationMinutes: 5,
    learningPoints: [
      'Greetings and polite requests',
      'Numbers and prices',
      'Food and drink vocabulary',
      'Saying thank you naturally'
    ],
    scenarioDescription: "You're at a cozy café and want to order a coffee and a pastry. The barista is friendly but the café is busy.",
    studentRole: 'Customer',
    aiRole: 'Barista',
    systemPrompt: '...', // Full prompt for AI
    tone: 'friendly',
    popularity: 95,
    displayOrder: 1,
    isNew: false,
    isPremium: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'meeting-someone-a1',
    collectionId: 'social',
    title: 'Meeting Someone New',
    subtitle: 'Make a new friend',
    imageUrl: '/images/roleplay/meeting.jpg',
    level: 'A1',
    durationMinutes: 4,
    learningPoints: [
      'Introducing yourself',
      'Asking basic questions',
      'Talking about where you live',
      'Exchanging contact information'
    ],
    scenarioDescription: "You're at a community event and meet someone who seems friendly. Start a conversation and get to know them.",
    studentRole: 'New person',
    aiRole: 'Friendly stranger',
    systemPrompt: '...',
    tone: 'friendly',
    popularity: 88,
    displayOrder: 1,
    isNew: true,
    isPremium: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // ... more role plays
]
```

---

## Implementation Checklist

### Phase 1 (MVP)

- [ ] Create TypeScript types (`src/types/roleplay.ts`)
- [ ] Create Firestore service (`src/services/rolePlayService.ts`)
- [ ] Create data fetching hook (`src/hooks/useRolePlays.ts`)
- [ ] Build LevelTabs component
- [ ] Build CollectionScroll + CollectionChip components
- [ ] Build RolePlayCard component
- [ ] Build RolePlaySection component
- [ ] Build RolePlayPreviewModal component
- [ ] Build RolePlayPage
- [ ] Add route to App.tsx
- [ ] Add navigation from HomePage
- [ ] Seed initial role play data
- [ ] Test on mobile and desktop

### Phase 2

- [ ] Add completion tracking
- [ ] Add search functionality
- [ ] Add "See all" pages for collections
- [ ] Add loading skeletons
- [ ] Add error states

---

## Design Tokens Reference

```typescript
// From src/theme/colors.ts
const RolePlayColors = {
  // Backgrounds
  pageBg: '#1e1b4b',
  cardBg: 'rgba(45, 40, 84, 0.6)',
  modalBg: '#1e1b4b',

  // Tabs
  tabSelected: 'linear-gradient(135deg, #d8b4fe, #60a5fa)',
  tabUnselected: 'transparent',
  tabBorder: 'rgba(129, 140, 248, 0.3)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#d8b4fe',
  textMuted: 'rgba(216, 180, 254, 0.7)',

  // Accents
  success: '#4ade80',

  // Borders
  cardBorder: 'rgba(129, 140, 248, 0.15)',
  divider: 'rgba(129, 140, 248, 0.2)',

  // Button
  buttonGradient: 'linear-gradient(135deg, #d8b4fe, #60a5fa)',
  buttonText: '#1e1b4b',
}
```

---

*Document Version: 1.0*
*Last Updated: December 2024*
