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
