# Auto-Inject Tool Instructions Plan

## Problem Statement

Teachers create custom lessons with system prompts but often forget to include tool calling instructions. This causes:
- `mark_task_complete` not being called when students complete tasks
- `mark_for_review` not tracking errors properly
- `show_session_summary` not triggering at session end
- Inconsistent lesson behavior across different teachers

## Current State

### Frontend Flow
```
ChatPage → sessionStorage (RoleConfig) → useGeminiChat
         → tokenService.getToken(systemPrompt, voiceName)
         → POST /api/token { systemPrompt, voiceName, ... }
```

### Backend Flow
```
token_service.py:
  - Receives systemPrompt from frontend
  - Bakes it directly into live_config['system_instruction']
  - Always includes ALL 6 tool declarations
  - Returns ephemeral token
```

### Current Data Structures

**AIRole.tasks** (frontend):
```typescript
tasks?: Array<{ id: string; text: string }>;
```

**LessonTask** (Firestore):
```typescript
interface LessonTask {
  id: string;
  text: string;
}
```

### The Gap

- Tool declarations are always added (correct)
- Tool INSTRUCTIONS (when to call them) rely on teacher's system prompt (incorrect)
- Tasks exist in the data but aren't automatically mapped to tool instructions

---

## Proposed Solution

**Frontend sends structured data → Backend auto-injects tool instructions**

### Principle
- Teachers write WHAT (scenario, role, personality)
- Backend handles HOW (tool calling instructions)
- If tasks exist, backend generates task completion instructions
- If no tasks, backend omits task tool instructions

---

## Implementation Plan

### Phase 1: Backend Changes

#### 1.1 Create PromptBuilder Service

**File:** `python-server/app/services/prompt_builder.py`

```python
"""
Prompt Builder Service

Assembles final system prompts by combining teacher content
with auto-injected tool instructions.
"""

from typing import Optional


class PromptBuilder:
    """Builds system prompts with auto-injected tool instructions."""

    # Always injected - these tools work without configuration
    BASE_TOOL_INSTRUCTIONS = """

## Autonomous Tracking (use silently, never announce to student)

### Error Tracking
When the student makes a linguistic error, call `mark_for_review` silently:
- Grammar mistakes (wrong tense, word order, conjugation)
- Pronunciation errors (if apparent from context)
- Vocabulary misuse (wrong word choice)
Include: error_type, severity (1-10), user_sentence, correction, explanation

### User Preferences
When you learn about student interests or preferences, call `update_user_profile` to personalize future sessions.

### Session Summary
When the lesson naturally ends or student says goodbye, call `show_session_summary` with:
- 2-4 things the student did well (did_well)
- 2-3 areas to work on (work_on)
- 1-5 star rating based on participation and effort (stars)
- An encouraging summary paragraph (summary_text)
"""

    # Only injected when tasks are provided
    TASK_INSTRUCTIONS_TEMPLATE = """
### Task Completion
Call `mark_task_complete` IMMEDIATELY when the student achieves each objective:
{task_list}

Do not wait - call as soon as the task is clearly completed.
"""

    # Only injected for review lessons
    REVIEW_INSTRUCTIONS = """
### Review Session Tools
- Call `play_student_audio` to play back the student's original mistake before correcting
- Call `mark_item_mastered` when student demonstrates clear understanding of a reviewed item
  - Only call if they use it correctly in context, not just repeating after you
  - Include confidence level: low (hesitant), medium (minor issues), high (natural)
"""

    def build(
        self,
        teacher_prompt: str,
        tasks: Optional[list[dict]] = None,
        is_review_lesson: bool = False
    ) -> str:
        """
        Build the final system prompt.

        Args:
            teacher_prompt: The teacher's custom system prompt (scenario, role, etc.)
            tasks: Optional list of tasks [{"id": "1", "text": "Order a drink"}, ...]
            is_review_lesson: Whether this is a review lesson session

        Returns:
            Complete system prompt with tool instructions injected
        """
        sections = []

        # 1. Teacher's content first (their scenario, role, personality)
        sections.append(teacher_prompt.strip())

        # 2. Add task instructions if tasks exist
        if tasks and len(tasks) > 0:
            task_lines = "\n".join(
                f'- task_id="{task["id"]}" → {task["text"]}'
                for task in tasks
            )
            sections.append(
                self.TASK_INSTRUCTIONS_TEMPLATE.format(task_list=task_lines)
            )

        # 3. Add review lesson instructions if applicable
        if is_review_lesson:
            sections.append(self.REVIEW_INSTRUCTIONS)

        # 4. Always add base tool instructions
        sections.append(self.BASE_TOOL_INSTRUCTIONS)

        return "\n".join(sections)


# Singleton instance
_prompt_builder: Optional[PromptBuilder] = None


def get_prompt_builder() -> PromptBuilder:
    """Get singleton PromptBuilder instance."""
    global _prompt_builder
    if _prompt_builder is None:
        _prompt_builder = PromptBuilder()
    return _prompt_builder
```

#### 1.2 Update Token Endpoint

**File:** `python-server/app/main.py` (or routes file)

Update the token request model to accept tasks:

```python
from pydantic import BaseModel
from typing import Optional


class TokenRequest(BaseModel):
    userId: str
    systemPrompt: Optional[str] = None
    tasks: Optional[list[dict]] = None  # NEW: [{"id": "1", "text": "..."}]
    isReviewLesson: bool = False         # NEW
    expireMinutes: int = 30
    lockConfig: bool = True
    voiceName: Optional[str] = None


@app.post("/api/token")
async def create_token(request: TokenRequest):
    from app.services.prompt_builder import get_prompt_builder

    prompt_builder = get_prompt_builder()

    # Build final prompt with auto-injected instructions
    final_prompt = None
    if request.systemPrompt:
        final_prompt = prompt_builder.build(
            teacher_prompt=request.systemPrompt,
            tasks=request.tasks,
            is_review_lesson=request.isReviewLesson
        )

    # Create token with assembled prompt
    token = await token_service.create_ephemeral_token(
        system_prompt=final_prompt,
        voice_name=request.voiceName,
        expire_minutes=request.expireMinutes,
        lock_config=request.lockConfig
    )

    return {
        "token": token.token,
        "expiresAt": token.expires_at.isoformat(),
        "newSessionExpiresAt": token.new_session_expires_at.isoformat(),
        "model": config.GEMINI_MODEL
    }
```

#### 1.3 Conditionally Include Tool Declarations

**File:** `python-server/app/token_service.py`

Update to only include relevant tools based on lesson type:

```python
def _get_tool_declarations(
    self,
    has_tasks: bool = False,
    is_review_lesson: bool = False
) -> list[dict]:
    """Get tool declarations based on lesson configuration."""

    # Always included
    declarations = [
        self.MARK_FOR_REVIEW_DECLARATION,
        self.UPDATE_USER_PROFILE_DECLARATION,
        self.SHOW_SESSION_SUMMARY_DECLARATION,
    ]

    # Only include if lesson has tasks
    if has_tasks:
        declarations.append(self.MARK_TASK_COMPLETE_DECLARATION)

    # Only include for review lessons
    if is_review_lesson:
        declarations.append(self.MARK_ITEM_MASTERED_DECLARATION)
        declarations.append(self.PLAY_STUDENT_AUDIO_DECLARATION)

    return [{"function_declarations": declarations}]
```

---

### Phase 2: Frontend Changes

#### 2.1 Update TokenService

**File:** `src/services/tokenService.ts`

```typescript
interface TokenRequestParams {
  userId: string;
  systemPrompt?: string;
  tasks?: Array<{ id: string; text: string }>;  // NEW
  isReviewLesson?: boolean;                      // NEW
  voiceName?: string;
  forceRefresh?: boolean;
}

export class TokenService {
  // ... existing code ...

  async getToken(params: TokenRequestParams): Promise<EphemeralToken> {
    const { userId, systemPrompt, tasks, isReviewLesson, voiceName, forceRefresh } = params;

    // Cache key should include tasks hash for invalidation
    const cacheKey = this.getCacheKey(systemPrompt, tasks, voiceName);

    // ... cache check logic ...

    return this.fetchToken(params);
  }

  private async fetchToken(params: TokenRequestParams): Promise<EphemeralToken> {
    const response = await fetch(`${this.apiUrl}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        systemPrompt: params.systemPrompt,
        tasks: params.tasks,              // NEW
        isReviewLesson: params.isReviewLesson,  // NEW
        expireMinutes: 30,
        lockConfig: true,
        voiceName: params.voiceName
      })
    });

    // ... rest of method
  }
}
```

#### 2.2 Update GeminiDirectClient

**File:** `src/services/geminiDirectClient.ts`

Update connect method to pass tasks:

```typescript
async connect(
  userId: string,
  systemPrompt?: string,
  tasks?: Array<{ id: string; text: string }>,  // NEW
  isReviewLesson?: boolean,                      // NEW
  voiceName?: string
): Promise<void> {
  const ephemeralToken = await this.tokenService.getToken({
    userId,
    systemPrompt,
    tasks,          // NEW
    isReviewLesson, // NEW
    voiceName
  });

  // ... rest of connect logic
}
```

#### 2.3 Update useGeminiChat Hook

**File:** `src/hooks/useGeminiChat.ts`

Pass tasks through to the client:

```typescript
const connect = useCallback(async () => {
  // ... existing setup ...

  await geminiClient.current.connect(
    userId,
    role.systemPrompt,
    role.tasks,           // NEW - pass tasks from AIRole
    role.isReviewLesson,  // NEW
    role.voiceName || selectedVoice
  );
}, [role, userId, selectedVoice]);
```

---

### Phase 3: Teacher Dashboard (No Changes Required)

The current LessonFormModal already captures:
- `systemPrompt` (free text)
- `tasks` (list of objectives)

These are already stored in Firestore. The only change is that backend now uses them.

---

## Migration Notes

### Backward Compatibility

The changes are backward compatible:
- If `tasks` is not provided, no task instructions are injected
- If `isReviewLesson` is not provided, defaults to false
- Existing lessons continue to work

### Removing Redundant Prompt Content

After deployment, teachers can simplify their prompts by removing:
- Tool usage instructions
- Parameter explanations
- Task-to-ID mappings

These are now handled automatically.

---

## Testing Plan

### Unit Tests

1. **PromptBuilder tests:**
   - Empty tasks → no task instructions
   - With tasks → correct task_id mapping
   - Review lesson → includes review instructions
   - Always includes base instructions

2. **Token endpoint tests:**
   - Request without tasks → valid token
   - Request with tasks → valid token with task instructions
   - Review lesson flag → includes review tools

### Integration Tests

1. Create lesson with tasks → verify task completion works
2. Create lesson without tasks → verify no task_complete calls attempted
3. Review lesson → verify mastery tracking works

### Manual Testing

1. Teacher creates lesson with tasks via dashboard
2. Student starts lesson
3. Verify tasks panel shows tasks
4. Complete task objectives → verify mark_task_complete fires
5. End session → verify show_session_summary fires

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `python-server/app/services/prompt_builder.py` | NEW | PromptBuilder service |
| `python-server/app/main.py` | MODIFY | Update token endpoint to use PromptBuilder |
| `python-server/app/token_service.py` | MODIFY | Conditional tool declarations |
| `src/services/tokenService.ts` | MODIFY | Add tasks parameter |
| `src/services/geminiDirectClient.ts` | MODIFY | Pass tasks to token service |
| `src/hooks/useGeminiChat.ts` | MODIFY | Pass role.tasks through |

---

## Success Criteria

1. Teachers can write simple prompts without tool instructions
2. Tasks automatically map to mark_task_complete calls
3. Error tracking works without explicit instructions
4. Session summaries trigger automatically
5. Review lessons get review-specific tools
6. No breaking changes for existing lessons

---

## Timeline Estimate

- Phase 1 (Backend): Core implementation
- Phase 2 (Frontend): Pass tasks through
- Phase 3 (Testing): Verification
- Phase 4 (Cleanup): Update existing lesson prompts (optional)
