"""
Weekly Review Generator Service

Generates personalized review lessons based on student struggles.
Uses Gemini 2.0 Flash to create natural conversational prompts.
Fetches the meta-prompt template from Firestore so teachers can edit it.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from dataclasses import dataclass

from google import genai
from google.cloud import firestore

from app.config import config


@dataclass
class ReviewItem:
    """Review item document from Firestore (new schema)."""
    id: str
    error_type: str  # Grammar, Pronunciation, Vocabulary, Cultural
    severity: int  # 1-10 scale
    user_sentence: str
    correction: str
    explanation: Optional[str]
    review_count: int
    mastered: bool
    last_reviewed_at: Optional[datetime]
    audio_url: Optional[str] = None  # Firebase Storage download URL for error audio


# Legacy type for backwards compatibility during migration
@dataclass
class StruggleItem:
    """Struggle document from Firestore (legacy)."""
    id: str
    word: str
    struggle_type: str
    context: str
    severity: str
    review_count: int
    mastered: bool
    last_reviewed_at: Optional[datetime]


@dataclass
class ReviewLesson:
    """Generated review lesson."""
    id: str
    user_id: str
    week_start: str
    status: str
    generated_prompt: str
    target_struggles: List[str]
    struggle_words: List[str]
    user_level: str
    estimated_minutes: int
    created_at: datetime


class ReviewService:
    """Service for generating weekly review lessons."""

    MIN_STRUGGLES = 3
    MAX_STRUGGLES = 8
    REVIEW_COOLDOWN_DAYS = 7
    MAX_REVIEW_COUNT = 3  # After 3 reviews, mark as mastered

    # Direct template (NOT a meta-prompt) - placeholders get replaced directly
    # This IS the final system prompt, not instructions to generate one
    DEFAULT_REVIEW_TEMPLATE = """You are a friendly English tutor conducting a WEEKLY REVIEW session with {{studentName}}.

## SESSION PURPOSE
This is a review session to help {{studentName}} practice and master mistakes they made earlier this week. Your goal is to help them improve through natural conversation, not drilling.

## STUDENT LEVEL: {{level}}
Adjust your speech accordingly:
- A1-A2: Simple sentences, speak slowly and clearly, lots of encouragement
- B1-B2: Moderate complexity, natural pace
- C1-C2: Natural speed, can use more complex structures

## MISTAKES TO REVIEW THIS SESSION:
{{struggles}}

## HOW TO CONDUCT THIS REVIEW:

1. **Start warmly**: "Hi {{studentName}}! Welcome to your weekly review. Let's practice some things from this week together."

2. **For each item with audio** (marked "HAS AUDIO"):
   - Say: "Earlier this week, you said something I'd like us to work on. Let me play it back..."
   - Call `play_student_audio` with that item's ID
   - **IMPORTANT: Stay COMPLETELY SILENT after calling play_student_audio. Do not speak until you receive the "Audio played successfully" response. The student needs to hear their recording without you talking over it.**
   - Once you receive confirmation the audio finished, THEN explain: "You said [X], but we usually say [Y] because [reason]"
   - Practice it together, then move on

3. **For items without audio**:
   - Say: "Earlier you tried to say [correction] but it came out a bit differently. Let's practice that."
   - Help them use the correct form naturally

4. **When they get it right**:
   - Celebrate briefly: "Perfect!" or "That's exactly right!"
   - Call `mark_item_mastered` with confidence level ('high', 'medium', or 'low')

5. **Keep it conversational**: Don't just drill - weave the practice into natural chat

6. **End with summary**: Call `show_session_summary` with their progress

## REVIEW SESSION TOOLS (Use these automatically)

### play_student_audio
- USE THIS for every item that has audio!
- Call it BEFORE explaining the correction so they hear themselves first
- **After calling, WAIT SILENTLY for "Audio played successfully" response before speaking**
- Parameters: { "review_item_id": "the-item-id" }

### mark_item_mastered
- Call when they demonstrate understanding (not just repeating after you)
- Parameters: { "review_item_id": "the-item-id", "confidence": "high|medium|low" }

### mark_for_review
- Only for NEW mistakes not in this review
- Parameters: { "error_type": "...", "severity": 1-10, "user_sentence": "...", "correction": "...", "explanation": "..." }

### show_session_summary
- Call at the end of the session
- Parameters: { "strengths": [...], "areas_for_improvement": [...], "stars": 1-5, "summary": "..." }

## ITEMS TO REVIEW:
{{itemReference}}"""

    def __init__(self):
        """Initialize with Firestore and Gemini clients."""
        import os
        from google.oauth2 import service_account

        # Use service account credentials if available
        creds_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'firebase-service-account.json')
        if os.path.exists(creds_path):
            credentials = service_account.Credentials.from_service_account_file(creds_path)
            self._db = firestore.Client(project='ndtutorlive', credentials=credentials)
        else:
            # Fallback to default credentials
            self._db = firestore.Client(project='ndtutorlive')

        # Configure Gemini client for prompt generation
        self._client = genai.Client(api_key=config.GEMINI_API_KEY)

    def get_review_template(self) -> str:
        """
        Fetch the review session template from Firestore.
        Falls back to default if not found.
        """
        try:
            template_ref = self._db.document('systemTemplates/weeklyReviewTemplate')
            template_doc = template_ref.get()

            if template_doc.exists:
                data = template_doc.to_dict()
                return data.get('template', self.DEFAULT_REVIEW_TEMPLATE)

            print('[Review] Template not found in Firestore, using default')
            return self.DEFAULT_REVIEW_TEMPLATE

        except Exception as e:
            print(f'[Review] Error fetching template: {e}, using default')
            return self.DEFAULT_REVIEW_TEMPLATE

    def get_user_level(self, user_id: str) -> str:
        """
        Fetch user's proficiency level from Firestore.
        Defaults to B1 if not set.
        """
        try:
            user_ref = self._db.document(f'users/{user_id}')
            user_doc = user_ref.get()

            if user_doc.exists:
                data = user_doc.to_dict()
                return data.get('level', 'B1')

            return 'B1'

        except Exception as e:
            print(f'[Review] Error fetching user level: {e}, defaulting to B1')
            return 'B1'

    def get_eligible_review_items(self, user_id: str) -> List[ReviewItem]:
        """
        Get review items eligible for weekly review.

        Criteria:
        - mastered = false
        - reviewCount < 3
        - lastReviewedAt is null OR > 7 days ago
        """
        # Use new reviewItems collection
        review_items_ref = self._db.collection(f'users/{user_id}/reviewItems')

        # Query for unmastered review items
        query = review_items_ref.where('mastered', '==', False)
        docs = query.stream()

        eligible = []
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.REVIEW_COOLDOWN_DAYS)

        for doc in docs:
            data = doc.to_dict()

            # Skip if already reviewed 3+ times
            if data.get('reviewCount', 0) >= self.MAX_REVIEW_COUNT:
                continue

            # Skip if reviewed within last 7 days
            last_reviewed = data.get('lastReviewedAt')
            if last_reviewed:
                # Handle Firestore timestamp
                if hasattr(last_reviewed, 'timestamp'):
                    last_reviewed_dt = datetime.fromtimestamp(
                        last_reviewed.timestamp(), tz=timezone.utc
                    )
                elif isinstance(last_reviewed, datetime):
                    last_reviewed_dt = last_reviewed.replace(tzinfo=timezone.utc)
                else:
                    last_reviewed_dt = None

                if last_reviewed_dt and last_reviewed_dt > cutoff_date:
                    continue

            # Ensure severity is numeric (some legacy items might have string values)
            raw_severity = data.get('severity', 5)
            if isinstance(raw_severity, str):
                try:
                    severity = int(raw_severity)
                except ValueError:
                    severity = 5  # Default if can't parse
            else:
                severity = int(raw_severity) if raw_severity else 5

            eligible.append(ReviewItem(
                id=doc.id,
                error_type=data.get('errorType', 'Vocabulary'),
                severity=severity,  # Now 1-10 scale (guaranteed int)
                user_sentence=data.get('userSentence', ''),
                correction=data.get('correction', ''),
                explanation=data.get('explanation'),
                review_count=data.get('reviewCount', 0),
                mastered=data.get('mastered', False),
                last_reviewed_at=last_reviewed,
                audio_url=data.get('audioUrl'),  # Fetch audio URL for playback
            ))

        # Sort by severity (higher = more critical, prioritize) then by review count (lower first)
        # New severity is 1-10 where 10 is most critical
        eligible.sort(key=lambda r: (-r.severity, r.review_count))

        return eligible[:self.MAX_STRUGGLES]

    # Legacy method - kept for backwards compatibility during migration
    def get_eligible_struggles(self, user_id: str) -> List[StruggleItem]:
        """
        @deprecated Use get_eligible_review_items instead.
        Get struggles eligible for review from legacy collection.
        """
        struggles_ref = self._db.collection(f'users/{user_id}/struggles')

        query = struggles_ref.where('mastered', '==', False)
        docs = query.stream()

        eligible = []
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.REVIEW_COOLDOWN_DAYS)

        for doc in docs:
            data = doc.to_dict()

            if data.get('reviewCount', 0) >= self.MAX_REVIEW_COUNT:
                continue

            last_reviewed = data.get('lastReviewedAt')
            if last_reviewed:
                if hasattr(last_reviewed, 'timestamp'):
                    last_reviewed_dt = datetime.fromtimestamp(
                        last_reviewed.timestamp(), tz=timezone.utc
                    )
                elif isinstance(last_reviewed, datetime):
                    last_reviewed_dt = last_reviewed.replace(tzinfo=timezone.utc)
                else:
                    last_reviewed_dt = None

                if last_reviewed_dt and last_reviewed_dt > cutoff_date:
                    continue

            eligible.append(StruggleItem(
                id=doc.id,
                word=data.get('word', ''),
                struggle_type=data.get('struggleType', 'vocabulary'),
                context=data.get('context', ''),
                severity=data.get('severity', 'moderate'),
                review_count=data.get('reviewCount', 0),
                mastered=data.get('mastered', False),
                last_reviewed_at=last_reviewed,
            ))

        severity_order = {'significant': 0, 'moderate': 1, 'minor': 2}
        eligible.sort(key=lambda s: (severity_order.get(s.severity, 1), s.review_count))

        return eligible[:self.MAX_STRUGGLES]

    def generate_review_prompt_from_items(self, items: List[ReviewItem], level: str) -> str:
        """
        Generate the review session prompt by filling in template placeholders.
        No AI generation - just direct placeholder replacement for predictable results.
        """
        template = self.get_review_template()

        # Format review items for the {{struggles}} section
        item_descriptions = []
        for item in items:
            audio_status = 'HAS AUDIO' if item.audio_url else 'no audio'
            desc = f'- **{item.correction}** ({audio_status})\n'
            desc += f'  - ID: `{item.id}`\n'
            desc += f'  - Student said: "{item.user_sentence}"\n'
            desc += f'  - Error type: {item.error_type}'
            if item.explanation:
                desc += f'\n  - Why: {item.explanation}'
            item_descriptions.append(desc)

        struggles_text = '\n'.join(item_descriptions)

        # Build the item reference section for easy ID lookup
        item_reference = self._build_item_reference_section(items)

        # Replace all placeholders
        prompt = template.replace('{{level}}', level)
        prompt = prompt.replace('{{struggles}}', struggles_text)
        prompt = prompt.replace('{{itemReference}}', item_reference)
        # Note: {{studentName}} is replaced at runtime by the frontend

        return prompt

    def _build_item_reference_section(self, items: List[ReviewItem]) -> str:
        """
        Build a reference section with explicit item IDs for function calls.
        This ensures the AI has the specific IDs needed for play_student_audio and mark_item_mastered.
        """
        lines = [
            '## REVIEW ITEM REFERENCE (for function calls)',
            '',
            'Use these exact IDs when calling play_student_audio or mark_item_mastered:',
            ''
        ]

        for item in items:
            audio_status = 'HAS AUDIO' if item.audio_url else 'no audio'
            lines.append(f'- ID: `{item.id}` | "{item.correction}" | {audio_status}')

        return '\n'.join(lines)

    def _create_fallback_prompt_from_items(self, items: List[ReviewItem], level: str) -> str:
        """Create a basic fallback prompt from review items if Gemini fails."""
        corrections = ', '.join([f'"{r.correction}"' for r in items[:5]])
        item_reference = self._build_item_reference_section(items)
        return f"""You are Sam, a friendly cafe owner helping a customer.
The student is at {level} level.
During your natural conversation about their coffee order and day,
find opportunities to practice these phrases: {corrections}.
Be warm and encouraging. Help gently if they struggle.

{item_reference}"""

    def generate_review_prompt(self, struggles: List[StruggleItem], level: str) -> str:
        """
        @deprecated Use generate_review_prompt_from_items instead.
        Generate a conversational system prompt incorporating struggle words.
        Uses Gemini 2.5 Flash for natural language generation.
        """
        # Fetch the editable template from Firestore
        template = self.get_meta_prompt_template()

        # Format struggles list
        struggle_descriptions = []
        for s in struggles:
            desc = f'- "{s.word}" ({s.struggle_type}'
            if s.context:
                desc += f' - {s.context}'
            desc += ')'
            struggle_descriptions.append(desc)

        struggle_text = '\n'.join(struggle_descriptions)

        # Substitute placeholders
        prompt = template.replace('{{level}}', level)
        prompt = prompt.replace('{{struggles}}', struggle_text)

        # Generate the actual conversation prompt using Gemini 2.5 Flash
        # Using stable model name (no suffix = stable version)
        try:
            response = self._client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            return response.text.strip()

        except Exception as e:
            print(f'[Review] Error generating prompt with Gemini: {e}')
            # Return a fallback prompt
            return self._create_fallback_prompt(struggles, level)

    def _create_fallback_prompt(self, struggles: List[StruggleItem], level: str) -> str:
        """Create a basic fallback prompt if Gemini fails."""
        words = ', '.join([s.word for s in struggles])
        return f"""You are Sam, a friendly cafe owner helping a customer.
The student is at {level} level.
During your natural conversation about their coffee order and day,
find opportunities to use these words: {words}.
Be warm and encouraging. Help gently if they struggle."""

    def _get_week_start(self) -> str:
        """Get ISO date string for the start of current week (Monday)."""
        today = datetime.now(timezone.utc).date()
        # Monday is weekday 0
        monday = today - timedelta(days=today.weekday())
        return monday.isoformat()

    def create_review_lesson(self, user_id: str) -> Optional[ReviewLesson]:
        """
        Create a weekly review lesson for a user.

        Returns None if user has insufficient review items or review already exists.
        Uses new reviewItems collection.
        """
        # Check for existing review this week
        week_start = self._get_week_start()
        review_id = f'week-{week_start}'

        existing_ref = self._db.document(f'users/{user_id}/reviewLessons/{review_id}')
        existing = existing_ref.get()
        if existing.exists:
            print(f'[Review] Review already exists for user {user_id} week {week_start}')
            return None

        # Get eligible review items (new collection)
        review_items = self.get_eligible_review_items(user_id)

        if len(review_items) < self.MIN_STRUGGLES:
            print(f'[Review] Insufficient review items ({len(review_items)}) for user {user_id}')
            return None

        # Get user's level
        level = self.get_user_level(user_id)

        # Generate prompt using new method
        generated_prompt = self.generate_review_prompt_from_items(review_items, level)

        # Create review document
        now = datetime.now(timezone.utc)

        # Use corrections as "struggle_words" for UI display
        display_words = [r.correction[:50] for r in review_items]  # Truncate long corrections

        review = ReviewLesson(
            id=review_id,
            user_id=user_id,
            week_start=week_start,
            status='ready',
            generated_prompt=generated_prompt,
            target_struggles=[r.id for r in review_items],  # IDs for tracking
            struggle_words=display_words,  # Display in UI
            user_level=level,
            estimated_minutes=5,
            created_at=now,
        )

        # Save to Firestore
        review_data = {
            'id': review.id,
            'userId': review.user_id,
            'weekStart': review.week_start,
            'status': review.status,
            'generatedPrompt': review.generated_prompt,
            'targetStruggles': review.target_struggles,
            'struggleWords': review.struggle_words,
            'userLevel': review.user_level,
            'estimatedMinutes': review.estimated_minutes,
            'createdAt': now,
            'completedAt': None,
            'sessionId': None,
            'stars': None,
        }
        existing_ref.set(review_data)

        # Update review items with review inclusion (new collection)
        for item in review_items:
            item_ref = self._db.document(f'users/{user_id}/reviewItems/{item.id}')
            new_review_count = item.review_count + 1
            update_data = {
                'reviewCount': new_review_count,
                'lastReviewedAt': now,
                'includedInReviews': firestore.ArrayUnion([review_id]),
            }
            # Mark as mastered if this is the 3rd review
            if new_review_count >= self.MAX_REVIEW_COUNT:
                update_data['mastered'] = True
            item_ref.update(update_data)

        print(f'[Review] Created review for user {user_id} with {len(review_items)} items at level {level}')
        return review


# Singleton instance
_review_service: Optional[ReviewService] = None


def get_review_service() -> ReviewService:
    """Get singleton review service instance."""
    global _review_service
    if _review_service is None:
        _review_service = ReviewService()
    return _review_service
