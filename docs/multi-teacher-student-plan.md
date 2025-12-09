# Multi-Teacher Student System - Implementation Plan

## Overview

Implement tenant isolation so each teacher sees only their own students and students see only their teacher's missions.

**Note:** No backwards compatibility needed - no existing students in production.

## Current State

- `UserDocument` has `classCode` and `groupIds` but **no `teacherId`**
- `MissionDocument` has `teacherId` - missions are teacher-scoped
- `GroupDocument` exists but is unused - no UI to manage groups
- `getAllActiveMissions()` returns ALL missions from ALL teachers
- No student-teacher linking mechanism implemented
- No "Join Class" flow for students

## Student Sign-Up Flow (Option A: Code First, Then Level)

```
┌─────────────────────────────────────────────────────────────────┐
│                      SIGN UP FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SIGN UP PAGE                                                 │
│     ├── Email, Password, Name                                    │
│     ├── Role: Student / Teacher                                  │
│     └── [Create Account]                                         │
│              │                                                   │
│              ▼                                                   │
│  2. IF STUDENT → JOIN CLASS PAGE (/join-class)                   │
│     ├── "Enter your teacher's class code"                        │
│     ├── [  ABC123  ]                                            │
│     ├── Shows: "Joining Mrs. Smith's Class" (validates live)    │
│     └── [Join Class]                                            │
│              │                                                   │
│              ▼                                                   │
│  3. SELECT LEVEL PAGE (/select-level) - existing                 │
│     ├── "What's your English level?"                            │
│     ├── A1 / A2 / B1 / B2 / C1 / C2                            │
│     └── [Continue]                                              │
│              │                                                   │
│              ▼                                                   │
│  4. HOME PAGE (/)                                                │
│     └── Shows teacher's missions filtered by student's level    │
│                                                                  │
│  IF TEACHER → TEACHER DASHBOARD (/teacher)                       │
│     └── Shows class code: "Share ABC123 with your students"     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Code Before Level?

1. Teacher might have level-specific missions (A1 missions, B2 missions)
2. Student's level selection filters their teacher's content
3. Teacher immediately sees new student in roster
4. Validation shows teacher name for trust ("Yes, that's my teacher")

### Data Written at Each Step

| Step | Data Written |
|------|-------------|
| Sign Up | `users/{uid}` with `role: 'student'`, no teacherId yet |
| Join Class | Update `users/{uid}` with `teacherId`, `teacherName`, `joinedClassAt` |
| Select Level | Update `users/{uid}` with `level` |

### Incomplete Sign-Up Handling

If student abandons mid-flow:
- Has account but no `teacherId` → redirect to `/join-class` on login
- Has `teacherId` but no `level` → redirect to `/select-level` on login
- Has both → go to home page

## Proposed Architecture

### Data Model Change

Add to `UserDocument` (for students):
```typescript
interface UserDocument {
  // ... existing fields ...

  // Direct teacher assignment (for students only)
  teacherId?: string;        // Teacher's UID who owns this student
  teacherName?: string;      // Denormalized for display
  joinedClassAt?: Timestamp; // When student joined the class
}
```

Add to `UserDocument` (for teachers):
```typescript
interface UserDocument {
  // ... existing fields ...

  // Class code (for teachers only)
  classCode?: string;  // Unique 6-char code, generated on teacher registration
}
```

### Class Code Strategy

- **6-character alphanumeric code** stored on teacher's UserDocument
- Generated on teacher registration (random, unique)
- Case-insensitive validation
- Teacher can regenerate if needed (invalidates old code)

### Query Patterns

| Query | Collection | Filter |
|-------|------------|--------|
| Get teacher's students | `users` | `teacherId == X` AND `role == 'student'` |
| Get student's missions | `missions` | `teacherId == student.teacherId` AND `isActive == true` |
| Validate class code | `users` | `classCode == X` AND `role == 'teacher'` |
| Teacher analytics | `users/{uid}/sessions` | Filter students by teacherId first |

## Implementation Steps

### Phase 1: Core Infrastructure

1. **Update `UserDocument` type** (`src/types/firestore.ts`)
   - Add `teacherId?: string` (students)
   - Add `teacherName?: string` (students)
   - Add `joinedClassAt?: Timestamp` (students)
   - Add `classCode?: string` (teachers)
   - Remove unused `groupIds` field

2. **Create class code utilities** (`src/services/firebase/classCode.ts`)
   ```typescript
   // Generate unique 6-char class code
   generateClassCode(): string

   // Validate code and return teacher info (case-insensitive)
   validateClassCode(code: string): Promise<{teacherId: string, teacherName: string} | null>

   // Assign student to teacher
   assignStudentToTeacher(studentId: string, teacherId: string, teacherName: string): Promise<void>
   ```

3. **Create student query functions** (`src/services/firebase/students.ts`)
   ```typescript
   // Get all students for a teacher
   getStudentsForTeacher(teacherId: string): Promise<UserDocument[]>

   // Get missions for student (by their teacherId)
   getMissionsForStudent(teacherId: string, level?: ProficiencyLevel): Promise<MissionDocument[]>
   ```

### Phase 2: Student Flow

4. **Create JoinClassPage** (`src/pages/JoinClassPage.tsx`)
   - Large input field for class code (6 chars)
   - Live validation as user types (debounced)
   - Shows teacher name on valid code
   - Error state for invalid code
   - [Join Class] button → updates student doc → redirects to `/select-level`

5. **Update SignUpPage** (`src/pages/SignUpPage.tsx`)
   - Student registration → redirect to `/join-class`
   - Teacher registration → generate classCode, redirect to `/teacher`

6. **Update auth flow** (`src/services/firebase/auth.ts`)
   - `createUserDocument()`: Generate classCode for teachers

7. **Update HomePage** (`src/pages/HomePage.tsx`)
   - Remove `getAllActiveMissions()` call
   - Use `getMissionsForStudent(user.teacherId, user.level)`
   - If no `teacherId`, redirect to `/join-class`
   - If no `level`, redirect to `/select-level`

8. **Update routing/guards** (`src/App.tsx` or auth context)
   - Add redirect logic for incomplete student setup

### Phase 3: Teacher Flow

9. **Add class code display to TeacherDashboard**
   - Prominent card: "Your Class Code: ABC123"
   - "Share this code with your students"
   - Copy to clipboard button
   - Optional: Regenerate code button

10. **Add Students tab to TeacherDashboard** (`src/components/dashboard/StudentsTab.tsx`)
    - List all students where `teacherId == teacher.uid`
    - Show: name, level, joined date, last active, sessions, avg stars
    - Remove student button (clears their teacherId)
    - Empty state: "No students yet. Share your class code!"

### Phase 4: Security & Cleanup

11. **Update Firestore rules** (`firestore.rules`)
    ```javascript
    // Students can only read missions from their teacher
    match /missions/{missionId} {
      allow read: if request.auth != null &&
        (resource.data.teacherId == request.auth.uid ||
         resource.data.teacherId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.teacherId);
    }

    // Teachers can only read students assigned to them
    match /users/{userId} {
      allow read: if request.auth.uid == userId ||
        (resource.data.teacherId == request.auth.uid && resource.data.role == 'student');
    }
    ```

12. **Update Python analytics** (`python-server/app/analytics_service.py`)
    - Verify `_query_users()` filters by teacherId
    - Ensure no cross-teacher data leakage

13. **Remove unused code**
    - Remove `GroupDocument` type and related code (not using groups)
    - Remove `groupIds` from UserDocument
    - Remove `getAllActiveMissions()` function
    - Clean up any group-related UI/logic

## Files to Create/Modify

### New Files
- `src/services/firebase/classCode.ts` - Class code utilities
- `src/services/firebase/students.ts` - Student query functions
- `src/pages/JoinClassPage.tsx` - Student join class flow
- `src/components/dashboard/StudentsTab.tsx` - Teacher student roster

### Modified Files
- `src/types/firestore.ts` - Add teacherId, teacherName, joinedClassAt, classCode; remove groupIds
- `src/pages/SignUpPage.tsx` - Redirect students to `/join-class`
- `src/pages/HomePage.tsx` - Filter missions by teacherId, add redirects
- `src/pages/TeacherDashboard.tsx` - Add Students tab, show class code
- `src/services/firebase/auth.ts` - Generate classCode on teacher registration
- `src/services/firebase/missions.ts` - Add getMissionsForStudent, remove getAllActiveMissions
- `src/App.tsx` - Add `/join-class` route
- `firestore.rules` - Add tenant isolation rules
- `python-server/app/analytics_service.py` - Verify tenant filtering

### Files to Delete/Clean
- Remove `GroupDocument` type from `src/types/firestore.ts`
- Remove group-related functions from `src/services/firebase/` if any
- Remove `getAllActiveMissions()` from missions.ts

## Database Indexes Required

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "teacherId", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "classCode", "order": "ASCENDING" },
        { "fieldPath": "role", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "missions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "teacherId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "targetLevel", "order": "ASCENDING" }
      ]
    }
  ]
}
```

## Testing Checklist

- [ ] Teacher registration generates class code
- [ ] Teacher sees class code on dashboard
- [ ] Copy class code to clipboard works
- [ ] Student registration redirects to `/join-class`
- [ ] Invalid class code shows error
- [ ] Valid class code shows teacher name
- [ ] Class code validation is case-insensitive
- [ ] Join class updates student doc with teacherId
- [ ] After join, redirects to `/select-level`
- [ ] After level select, redirects to home
- [ ] Student sees only their teacher's missions
- [ ] Student missions filtered by their level
- [ ] Teacher A cannot see Teacher B's missions
- [ ] Teacher sees student roster in Students tab
- [ ] Teacher can remove student from class
- [ ] Removed student redirected to `/join-class`
- [ ] Analytics show only teacher's own students
- [ ] Firestore rules prevent cross-teacher reads

## Timeline Estimate

- Phase 1 (Core Infrastructure): 2 hours
- Phase 2 (Student Flow): 2-3 hours
- Phase 3 (Teacher Flow): 2 hours
- Phase 4 (Security & Cleanup): 1-2 hours
- Testing: 1-2 hours

**Total: ~8-11 hours of implementation**

## Open Questions

1. Should teacher be able to regenerate class code? (Yes - add button)
2. Maximum students per teacher? (Not for MVP, add later for cost control)
3. Can student leave class on their own? (Not for MVP, teacher removes them)
