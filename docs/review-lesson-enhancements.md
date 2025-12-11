# Review Lesson Enhancements - Implementation Plan

## Overview
Enhance the weekly review lesson with audio playback of student mistakes and intelligent mastery tracking.

Goal: A targeted session where the user fixes past mistakes.
The Setup: Python looks at Firestore, finds the top 3 unresolved errors, and generates a System Prompt: look at our current week review logic and system prompt. it's editable from teacher admin.
"You are a Review Tutor. Help the student fix these errors:
ID: err_882 | Mistake: 'I am agree' | URL: https://.../err_882.mp3
Use the tool trigger_flashback(url) to show them."
The Connection: Python gives React the Ephemeral Token + The list of MP3 URLs (to preload).
The Lesson:
Gemini: "Let's listen to what you said..." -> Sends trigger_flashback.
React: Mutes Mic -> Plays Audio -> Unmutes Mic -> Sends tool_response.
Gemini: "Did you hear that? Try again."


---

## Feature 1: Play Student Audio During Review

### Concept
AI tutor can play back the student's original audio when they made a mistake, creating a powerful "mirror moment" for self-awareness.

### Function Tool Definition
```typescript
{
  name: "play_student_audio",
  description: "Play a short audio clip of a mistake the student made previously. Use when hearing themselves would help the student understand and correct the error.",
  parameters: {
    type: "object",
    properties: {
      review_item_id: {
        type: "string",
        description: "ID of the reviewItem containing the audio"
      }
    },
    required: ["review_item_id"]
  }
}
```

### UX Flow
```
AI: "Last week you had trouble with the 'th' sound. Let me play what you said..."

[plays 2-3 second audio clip from reviewItem.audioUrl]

AI: "You said 'I sink' instead of 'I think'. The 'th' sound needs
     your tongue between your teeth. Let's practice - say 'think'."

[student speaks]

AI: "Much better! I can hear the 'th' clearly now."
```

### Frontend Implementation
- Listen for `play_student_audio` function call in chat
- Fetch audioUrl from reviewItem document
- Play audio using existing audio player component (need to build)
- Return confirmation to AI that audio played

### Design Principles
- Frame with empathy: "Let me show you..." not "You said this wrong"
- AI decides when audio is pedagogically useful (not every time) so adjust the current default review system prompt. 
- Keep clips short (2-3 seconds max)

---

## Feature 2: Mark Item as Mastered

### Concept
AI tutor marks a reviewItem as mastered when student demonstrates clear understanding - not just repetition, but natural usage.

### Function Tool Definition
```typescript
{
  name: "mark_item_mastered",
  description: "Mark a review item as mastered when the student demonstrates clear understanding and correct usage.",
  parameters: {
    type: "object",
    properties: {
      review_item_id: {
        type: "string",
        description: "ID of the reviewItem to mark as mastered"
      },
      confidence: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "AI's confidence in mastery based on student's response"
      }
    },
    required: ["review_item_id", "confidence"]
  }
}
```

### Document Update
```typescript
// users/{userId}/reviewItems/{reviewItemId}
{
  mastered: true,
  masteredAt: Timestamp.now(),
  masteredConfidence: "high" | "medium" | "low",
  reviewCount: increment(1)
}
```

### When AI Should Call This
- Student produces correct form naturally in conversation
- Student self-corrects without prompting
- Student explains why the original was wrong (metacognition)

### When AI Should NOT Call This
- Student just repeats after AI (parroting)
- Student hesitates significantly before correct answer
- Student gets it right but seems unsure

---



---

## Implementation Order

1. **mark_item_mastered** - Simplest, standalone value
2. **play_student_audio** - Requires audio player integration

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/functions.ts` | Add MarkItemMasteredParams type |
| `src/services/firebase/sessionData.ts` | Add markItemMastered(), findSimilarMasteredItem() |
| `src/hooks/useGeminiChat.ts` | Handle play_student_audio, mark_item_mastered function calls |
| `src/types/firestore.ts` | Add masteredAt, masteredConfidence, resurfacedAt, resurfaceCount to ReviewItemDocument |
| System prompt for review lesson | Add function definitions |

---

## Open Questions


3. **Audio availability** - What if reviewItem has no audioUrl? (Skip audio playback gracefully) you don't play it adjust the prompt to not call that tool function and just review it normally without audio.
4. **Multiple errors per session** - Rate limit mastery marking? (Don't mark 10 items in 30 seconds)
