# RolePlayPage Redesign Plan

## Overview

Transform the RolePlayPage from a functional but plain interface into a premium, glass-morphic experience that matches the recently redesigned HomePage.

**Current State:** 967 lines, 3 view states, minimal styling, inline components
**Target State:** ~400 lines main file, extracted components, premium animations, consistent design system

---

## Design System Reference

### Colors (from theme/colors.ts)
```typescript
bgPrimary: '#1e1b4b'      // Main background
bgTertiary: '#2d2854'     // Card background
accent: '#d8b4fe'         // Purple accent
textPrimary: '#ffffff'
textSecondary: '#d8b4fe'
borderColor: 'rgba(129, 140, 248, 0.2)'
```

### Animation Keyframes (from Header.tsx)
```css
@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.2); } 50% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.4); } }
@keyframes floatParticle { ... }
@keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
```

### Spacing & Radius
```typescript
spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
radius: { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 9999 }
```

---

## Phase 1: Component Extraction

### New File Structure
```
src/components/roleplay/
├── index.ts                    # Barrel exports (update)
├── RolePlayHeader.tsx          # NEW: Premium page header
├── HeroRolePlayCard.tsx        # NEW: Featured scenario card
├── LevelScroller.tsx           # REFACTOR: Enhanced with animations
├── CollectionGrid.tsx          # NEW: Glass-morphic collection cards
├── LessonCard.tsx              # NEW: Unified lesson card component
├── LevelFilterChips.tsx        # NEW: Extracted filter chips
├── RandomButton.tsx            # NEW: Animated random button
├── EmptyState.tsx              # NEW: Shared empty state
├── // existing files...
├── HorizontalLevelScroller.tsx
├── CollectionCard.tsx
├── CategorySection.tsx
├── CreateScenarioBanner.tsx
├── LessonDetailModal.tsx
├── ScenarioItem.tsx
└── ScenarioIllustration.tsx
```

---

## Phase 2: New Components

### 2.1 RolePlayHeader.tsx
Minimal header with premium back button - no page title (clean, modern approach).

```tsx
interface RolePlayHeaderProps {
  onBack: () => void;
  rightAction?: React.ReactNode;
}
```

**Design Elements:**
- Glass-morphic back button with subtle border
- Hover glow effect on back button
- Optional right action slot (for Random button)
- Gradient orb decoration (subtle, top-right)
- No title - let the content speak for itself

**Visual Reference:**
```
┌─────────────────────────────────────┐
│  [←]                         [🎲]   │
│       ↑ gradient orb behind         │
└─────────────────────────────────────┘
```

### 2.2 HeroRolePlayCard.tsx
Featured "Start Random" or "Featured Collection" hero card.

```tsx
interface HeroRolePlayCardProps {
  type: 'random' | 'featured';
  collection?: StudentCollection;
  lessonCount: number;
  onStart: () => void;
}
```

**Design Elements:**
- Blurred background image layer
- Animated gradient mesh overlay
- Floating particles (3 animated dots)
- Status badge ("Quick Start" / "Featured")
- Glowing CTA button with pulse animation
- 32px border radius (matches UpNextCard)

**Visual Reference:**
```
┌─────────────────────────────────────┐
│  [QUICK START]           ⏱️ ~5 min  │
│                                     │
│  🎲 Random Scenario                 │
│  Practice with any topic            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     ▶ Start Random          │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 2.3 LevelFilterChips.tsx (Enhanced)
Horizontal scrolling filter chips with premium styling.

```tsx
interface LevelFilterChipsProps {
  filters: { key: string; label: string; count?: number }[];
  activeFilter: string;
  onFilterChange: (key: string) => void;
}
```

**Design Elements:**
- Glass-morphic inactive state
- Gradient active state (purple gradient)
- Smooth scale transition on tap
- Optional count badge
- Horizontal scroll with fade edges

### 2.4 CollectionGrid.tsx
2-column grid of collection cards with glass styling.

```tsx
interface CollectionGridProps {
  collections: StudentCollection[];
  onCollectionClick: (collection: StudentCollection) => void;
  loading?: boolean;
}
```

**Design Elements:**
- Staggered fadeInUp animation (0.1s delay per card)
- Glass-morphic cards with border glow on hover
- Image with gradient overlay
- Lesson count badge

### 2.5 LessonCard.tsx (Unified)
Single lesson card component for both collection detail and level views.

```tsx
interface LessonCardProps {
  lesson: StudentLesson;
  onClick: () => void;
  variant?: 'default' | 'compact';
  animationDelay?: number;
}
```

**Design Elements:**
- 100px image thumbnail with rounded corners
- Level badge with semantic colors
- Glass-morphic background
- Lift animation on hover (translateY(-4px))
- Entry animation with configurable delay

### 2.6 EmptyState.tsx (Shared)
Reusable empty state component.

```tsx
interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Design Elements:**
- Floating icon animation
- Gradient text for title
- Ghost button for action

---

## Phase 3: Visual Enhancements

### 3.1 Page-Level Animations

Add to RolePlayPage's `<style>` block:
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes floatSlow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.roleplay-section { animation: fadeInUp 0.5s ease-out backwards; }
.roleplay-section:nth-child(1) { animation-delay: 0.1s; }
.roleplay-section:nth-child(2) { animation-delay: 0.2s; }
.roleplay-section:nth-child(3) { animation-delay: 0.3s; }
```

### 3.2 Card Hover Effects

```css
.roleplay-card {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 300ms ease,
              border-color 300ms ease;
}

.roleplay-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  border-color: rgba(216, 180, 254, 0.3);
}

.roleplay-card:active {
  transform: translateY(-2px);
}
```

### 3.3 Level Badge Color System

```typescript
const LEVEL_BADGE_STYLES = {
  beginner: {
    bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
    border: 'rgba(59, 130, 246, 0.3)',
    text: '#60a5fa',
    glow: '0 0 12px rgba(59, 130, 246, 0.3)',
  },
  'pre-intermediate': {
    bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
    border: 'rgba(168, 85, 247, 0.3)',
    text: '#a855f7',
    glow: '0 0 12px rgba(168, 85, 247, 0.3)',
  },
  intermediate: {
    bg: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)',
    border: 'rgba(234, 179, 8, 0.3)',
    text: '#fbbf24',
    glow: '0 0 12px rgba(234, 179, 8, 0.3)',
  },
  'upper-intermediate': {
    bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)',
    border: 'rgba(34, 197, 94, 0.3)',
    text: '#4ade80',
    glow: '0 0 12px rgba(34, 197, 94, 0.3)',
  },
};
```

---

## Phase 4: Layout Restructure

### 4.1 Main View Layout

```
┌─────────────────────────────────────────────┐
│  [←]                                  [🎲]  │
├─────────────────────────────────────────────┤
│                                             │
│  HeroRolePlayCard (Random Start)            │
│  ┌─────────────────────────────────────┐    │
│  │  🎲 Quick Start - Random Scenario   │    │
│  │  [▶ Start Random]                   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  LevelScroller (Horizontal)                 │
│  [🐣 Beginner] [📚 Pre-Int] [🎯 Int] [🚀]   │
│                                             │
│  Section: "Collections"                     │
│  ┌────────┐  ┌────────┐                     │
│  │ Daily  │  │ Travel │                     │
│  │ Life   │  │        │                     │
│  └────────┘  └────────┘                     │
│  ┌────────┐  ┌────────┐                     │
│  │ Work   │  │ Social │                     │
│  └────────┘  └────────┘                     │
│                                             │
│  CreateScenarioBanner                       │
│                                             │
│  Section: "Daily Life" (from collection)    │
│  [Horizontal scroll of scenarios]           │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 Collection Detail View

```
┌─────────────────────────────────────────────┐
│  [←]                                        │
├─────────────────────────────────────────────┤
│                                             │
│        "Daily Life"                         │
│        (collection title - centered)        │
│                                             │
│  LevelFilterChips                           │
│  [All] [Beginner] [Pre-Int] [Intermediate]  │
│                                             │
│  Lesson List (vertical)                     │
│  ┌─────────────────────────────────────┐    │
│  │ [img] At the Coffee Shop            │    │
│  │       🟢 Beginner                   │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ [img] Ordering Food                 │    │
│  │       🟡 Intermediate               │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Phase 5: Implementation Steps

### Step 1: Create Shared Components (Day 1)
- [ ] `RolePlayHeader.tsx` - Page header with back button and title
- [ ] `LevelFilterChips.tsx` - Extracted and enhanced filter chips
- [ ] `EmptyState.tsx` - Shared empty state component
- [ ] Update `index.ts` barrel exports

### Step 2: Create Hero Components (Day 1-2)
- [ ] `HeroRolePlayCard.tsx` - Featured/random start card
- [ ] Add animation keyframes
- [ ] Implement glass-morphism styling

### Step 3: Enhance Existing Components (Day 2)
- [ ] Update `CollectionCard.tsx` with glass styling
- [ ] Update `HorizontalLevelScroller.tsx` with animations
- [ ] Add hover effects to all interactive elements

### Step 4: Create New Card Components (Day 2-3)
- [ ] `LessonCard.tsx` - Unified lesson card
- [ ] `CollectionGrid.tsx` - Grid wrapper with animations
- [ ] `RandomButton.tsx` - Animated random button

### Step 5: Refactor RolePlayPage (Day 3)
- [ ] Import new components
- [ ] Remove inline component definitions
- [ ] Add page-level animations
- [ ] Implement new layout structure
- [ ] Add decorative gradient orbs

### Step 6: Polish & Testing (Day 4)
- [ ] Test all view states (main, collection detail, level detail)
- [ ] Verify animations perform well on mobile
- [ ] Check accessibility (focus states, ARIA labels)
- [ ] Test empty states
- [ ] Performance check (no jank on scroll)

---

## Code Examples

### RolePlayHeader.tsx
```tsx
import { AppColors, radius } from '../../theme/colors';

interface RolePlayHeaderProps {
  onBack: () => void;
  rightAction?: React.ReactNode;
}

export const RolePlayHeader = ({ onBack, rightAction }: RolePlayHeaderProps) => {
  return (
    <header style={{
      position: 'relative',
      padding: '16px 20px',
      overflow: 'hidden',
    }}>
      <style>{`
        .rp-back-btn {
          transition: all 200ms ease;
        }
        .rp-back-btn:hover {
          background-color: rgba(255, 255, 255, 0.15);
          border-color: rgba(216, 180, 254, 0.3);
          box-shadow: 0 0 16px rgba(216, 180, 254, 0.15);
        }
      `}</style>

      {/* Subtle gradient orb decoration */}
      <div style={{
        position: 'absolute',
        top: '-60px',
        right: '-40px',
        width: '140px',
        height: '140px',
        background: 'radial-gradient(circle, rgba(216, 180, 254, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Glass-morphic back button */}
        <button
          className="rp-back-btn"
          onClick={onBack}
          aria-label="Go back"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: radius.md,
            border: `1px solid ${AppColors.borderColor}`,
            backgroundColor: AppColors.surface10,
            color: AppColors.textPrimary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Optional right action (Random button, etc.) */}
        {rightAction}
      </div>
    </header>
  );
};
```

### HeroRolePlayCard.tsx (Partial)
```tsx
export const HeroRolePlayCard = ({ onStartRandom, totalLessons }: HeroRolePlayCardProps) => {
  return (
    <div className="hero-card" style={{
      margin: '0 20px 24px',
      borderRadius: '28px',
      overflow: 'hidden',
      position: 'relative',
      cursor: 'pointer',
    }} onClick={onStartRandom}>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-15px) scale(1.1); opacity: 0.9; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 24px rgba(216, 180, 254, 0.3); }
          50% { box-shadow: 0 0 40px rgba(216, 180, 254, 0.5); }
        }
        .hero-card {
          transition: transform 300ms ease, box-shadow 300ms ease;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .hero-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
        }
        .hero-btn { animation: pulseGlow 3s ease-in-out infinite; }
        .particle { animation: floatParticle 5s ease-in-out infinite; }
      `}</style>

      {/* Animated gradient background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(135deg,
          ${AppColors.bgPrimary}f5 0%,
          rgba(91, 33, 182, 0.4) 50%,
          ${AppColors.bgPrimary}f0 100%)`,
        backgroundSize: '200% 200%',
        animation: 'gradientShift 8s ease infinite',
      }} />

      {/* Floating particles */}
      <div className="particle" style={{
        position: 'absolute', top: '25%', right: '20%',
        width: '8px', height: '8px', borderRadius: '50%',
        background: 'rgba(216, 180, 254, 0.7)',
      }} />
      <div className="particle" style={{
        position: 'absolute', top: '60%', right: '10%',
        width: '6px', height: '6px', borderRadius: '50%',
        background: 'rgba(96, 165, 250, 0.6)',
        animationDelay: '1.5s',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '24px' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '10px',
          background: 'rgba(216, 180, 254, 0.15)',
          border: '1px solid rgba(216, 180, 254, 0.25)',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '14px' }}>🎲</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: AppColors.accent }}>
            QUICK START
          </span>
        </div>

        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '22px',
          fontWeight: '700',
          color: AppColors.textPrimary,
        }}>
          Random Scenario
        </h2>
        <p style={{
          margin: '0 0 20px 0',
          fontSize: '14px',
          color: AppColors.textSecondary,
        }}>
          Jump into any of {totalLessons} practice scenarios
        </p>

        <button className="hero-btn" style={{
          width: '100%',
          padding: '14px 24px',
          borderRadius: '14px',
          border: 'none',
          background: 'linear-gradient(135deg, #d8b4fe 0%, #a855f7 100%)',
          color: '#1a0a2e',
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <span>▶</span> Start Random
        </button>
      </div>
    </div>
  );
};
```

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| File size (RolePlayPage.tsx) | 967 lines | ~400 lines |
| Inline components | 6 | 0 |
| Animations | 1 (pulse) | 6+ |
| Glass-morphism elements | 0 | 5+ |
| Consistent with HomePage | No | Yes |
| Mobile performance | Good | Good (no regression) |

---

## Risk Mitigation

1. **Performance:** Test animations on low-end devices
2. **Accessibility:** Ensure all interactive elements have focus states
3. **Breaking changes:** Keep existing prop interfaces where possible
4. **Testing:** Manual test all 3 view states after each phase

---

## Future Enhancements (Post-Redesign)

1. **Collection images:** Add hero images to collection headers
2. **Progress indicators:** Show completion percentage on cards
3. **Favorites:** Add ability to favorite scenarios
4. **Search:** Add search functionality for lessons
5. **Sorting:** Allow sorting by level, popularity, or recent

---

## Appendix: File Cleanup

After redesign, these inline components should be removed from RolePlayPage.tsx:
- `Header` (lines 94-127) → Use `RolePlayHeader`
- `LevelFilterChip` (lines 130-159) → Use `LevelFilterChips`
- `CollectionLessonCard` (lines 162-270) → Use `LessonCard`
- `RandomButton` (lines 273-308) → Use `RandomButton` component
- `CollectionSection` (lines 311-410) → Use `CollectionGrid`
- `FirebaseCategorySection` (lines 413-472) → Refactor into CategorySection
