# Lesson Creation: Progressive Disclosure Redesign

## Overview

Transform the existing `LessonFormModal` from a single scrollable form into a guided, stepped experience with progress indication. The design follows progressive disclosure principles—revealing complexity at the moment it matters.

---

## Design Philosophy

- **Simplicity through reduction**: One thought at a time
- **Mirror teacher cognition**: What → How → Who
- **Earn progression**: Each step feels complete before the next
- **Quiet confidence**: UI elements don't compete for attention

---

## The Three Steps

### Step 1: The Essence (33%)
*"What is this lesson?"*

| Field | Required | Notes |
|-------|----------|-------|
| Title | Yes | Primary input, prominent |
| Description | Yes | Textarea, what students will practice |
| Cover Image | No | Optional visual identity |

**Validation**: Continue button disabled until title and description have content.

---

### Step 2: The Intelligence (66%)
*"How should the AI behave?"*

| Field | Required | Notes |
|-------|----------|-------|
| Template Selector | No | "Load from Template" dropdown, only if templates exist |
| System Prompt | Yes | Large textarea, monospace font |
| Save as Template | No | Link button below system prompt |
| Duration | Yes | Number input, 1-60 minutes, default 15 |
| Tasks | No | Add/remove task items, numbered list |

**Validation**: Continue button disabled until system prompt has content.

**Note**: "Save as Template" appears only in this step.

---

### Step 3: The Audience (100%)
*"Who sees this, and where?"*

| Field | Required | Notes |
|-------|----------|-------|
| Target Level | No | A1-C2 dropdown, default "All Levels" |
| RolePlay Collection | No | Dropdown, only if collections exist |
| Show on Homepage | No | Toggle, default true |
| First Lesson | No | Toggle for new student onboarding |
| Assign to Students | No | Multi-select chips, only if private students exist |

**Validation**: None required. All fields optional.

**Final Action**: "Create Lesson" button.

---

## Progress Bar Specification

### Visual Design
- **Position**: Top of modal, full width
- **Height**: 3px
- **Background**: `rgba(255, 255, 255, 0.1)` (track)
- **Fill**: Gradient from `accentPurple` to `accentBlue`
- **Border Radius**: 1.5px (pill shape)
- **Transition**: `width 300ms ease-out`

### Behavior
| State | Progress |
|-------|----------|
| Step 1 active | 33% |
| Step 2 active | 66% |
| Step 3 active | 100% |
| Edit mode | 100% (always full) |

---

## Two Modes

### Create Mode (New Lesson)
- Linear progression through steps
- Only current step visible
- "Continue" button advances to next step
- "Back" link returns to previous step
- Progress bar animates with each step
- Final step shows "Create Lesson" button

### Edit Mode (Existing Lesson)
- All three steps visible as collapsible sections
- Each section shows summary when collapsed
- Tap section header to expand/collapse
- Progress bar always at 100%
- "Update Lesson" button always visible at bottom

---

## Edit Mode: Collapsed Summaries

### Step 1 Summary
```
"Ordering at a Restaurant"
Description, Image uploaded
```
Format: Title in quotes, then comma-separated indicators for description and image.

### Step 2 Summary
```
15 min · 3 tasks · From template
```
Format: Duration, task count (if any), template indicator (if loaded).

### Step 3 Summary
```
B1 · Homepage · 2 students assigned
```
Format: Level (or "All levels"), homepage status, student count (if any).

---

## Transitions

### Step-to-Step (Create Mode)
- Current content fades out and slides left (150ms)
- New content fades in and slides from right (150ms)
- Progress bar width animates (300ms)

### Expand/Collapse (Edit Mode)
- Height animation: 200ms ease-out
- Content opacity: 150ms
- Chevron rotation: 200ms

---

## Component Structure

```
LessonFormModal/
├── LessonFormModal.tsx        # Main container, mode logic
├── ProgressBar.tsx            # Thin progress indicator
├── StepIndicator.tsx          # "Step 1 of 3" text
├── steps/
│   ├── StepEssence.tsx        # Step 1: title, description, image
│   ├── StepIntelligence.tsx   # Step 2: prompt, duration, tasks
│   └── StepAudience.tsx       # Step 3: level, collection, toggles
├── CollapsibleSection.tsx     # Edit mode accordion
└── StepNavigation.tsx         # Back/Continue/Create buttons
```

---

## State Management

### New State Required
```typescript
interface LessonFormState {
  // Existing form data...
  currentStep: 1 | 2 | 3;
  mode: 'create' | 'edit';
  expandedSections: {
    essence: boolean;
    intelligence: boolean;
    audience: boolean;
  };
}
```

### Step Validation
```typescript
const canProceedFromStep1 = formData.title.trim() && formData.description.trim();
const canProceedFromStep2 = formData.systemPrompt.trim();
const canCreate = canProceedFromStep1 && canProceedFromStep2;
```

---

## Responsive Considerations

- Modal max-width remains 600px
- Step content uses existing clamp() patterns for padding/fonts
- Progress bar spans full modal width (no side padding)
- On very small screens, collapsed summaries may truncate with ellipsis

---

## Accessibility

- Progress bar has `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Step changes announced via `aria-live="polite"` region
- Collapsed sections use `aria-expanded` attribute
- Focus moves to first input when step changes

---

## Migration Path

1. Create new component files alongside existing `LessonFormModal.tsx`
2. Build stepped flow for create mode first
3. Add edit mode with collapsible sections
4. Test both modes thoroughly
5. Replace import in `TeacherDashboard.tsx`
6. Remove old `LessonFormModal.tsx`

---

## Open Questions Resolved

| Question | Decision |
|----------|----------|
| Can teachers skip steps? | No, linear progression |
| Edit mode behavior | All steps collapsed, expandable |
| Tasks placement | Step 2 (Intelligence) |
| Save as Template | Step 2 only |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/LessonFormModal.tsx` | Complete rewrite |
| `src/hooks/useLessonForm.ts` | Add step state, expanded sections |
| `src/components/dashboard/` | Add new step components |

---

## Success Criteria

- [ ] New lesson creation feels calm, not overwhelming
- [ ] Teachers complete lessons faster (fewer abandoned forms)
- [ ] Edit mode provides quick overview and targeted editing
- [ ] Progress bar provides quiet confidence
- [ ] No functionality lost from current implementation
