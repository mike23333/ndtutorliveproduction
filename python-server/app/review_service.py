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
class StruggleItem:
    """Struggle document from Firestore."""
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

    # Default meta-prompt template (used if Firestore template doesn't exist)
    DEFAULT_META_PROMPT = """Generate a 5-minute conversational English practice system prompt.

The student's English level is: {{level}} (CEFR scale)
Adjust vocabulary, sentence complexity, and pace accordingly:
- A1-A2: Use simple sentences, common words, speak slowly and clearly
- B1-B2: Use moderate complexity, introduce idioms gradually, natural pace
- C1-C2: Use natural speed, complex structures, nuanced vocabulary

The student struggled with these words/phrases this week:
{{struggles}}

Create a system prompt for an AI tutor that will:
1. Have a natural conversation (restaurant, cafe, travel, or everyday scenario)
2. Organically include opportunities to use these words
3. NOT quiz or drill - just natural conversation
4. Gently help if they struggle again (rephrase, give hints)
5. Celebrate when they use the words correctly (brief acknowledgment)
6. Keep it warm and encouraging throughout

The prompt should define:
- A specific persona with a name and friendly role
- A realistic scenario that naturally includes the target vocabulary
- How to introduce each word naturally in conversation
- How to provide gentle scaffolding if they struggle

IMPORTANT: The prompt MUST include this exact section for autonomous function calling:

## AUTONOMOUS TRACKING (Use these functions automatically)

### save_struggle_item - Call when you notice:
- They can't remember a word (prompt them, then log it)
- They mispronounce something repeatedly
- They use incorrect grammar patterns
- They seem confused about vocabulary

### update_user_profile - Call when you learn:
- Their preferences or personal details they share
- Likes/dislikes mentioned during conversation

### show_session_summary - Call when:
- The conversation reaches a natural end
- You're prompted that time is up
- Rate 1-5 stars based on: participation, vocabulary use, improvement shown

Return only the system prompt, no explanation or preamble."""

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

    def get_meta_prompt_template(self) -> str:
        """
        Fetch the meta-prompt template from Firestore.
        Falls back to default if not found.
        """
        try:
            template_ref = self._db.document('systemTemplates/weeklyReviewMetaPrompt')
            template_doc = template_ref.get()

            if template_doc.exists:
                data = template_doc.to_dict()
                return data.get('template', self.DEFAULT_META_PROMPT)

            print('[Review] Template not found in Firestore, using default')
            return self.DEFAULT_META_PROMPT

        except Exception as e:
            print(f'[Review] Error fetching template: {e}, using default')
            return self.DEFAULT_META_PROMPT

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

    def get_eligible_struggles(self, user_id: str) -> List[StruggleItem]:
        """
        Get struggles eligible for review.

        Criteria:
        - mastered = false
        - reviewCount < 3
        - lastReviewedAt is null OR > 7 days ago
        """
        struggles_ref = self._db.collection(f'users/{user_id}/struggles')

        # Query for unmastered struggles
        query = struggles_ref.where('mastered', '==', False)
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

        # Sort by severity (significant first) then by review count (lower first)
        severity_order = {'significant': 0, 'moderate': 1, 'minor': 2}
        eligible.sort(key=lambda s: (severity_order.get(s.severity, 1), s.review_count))

        return eligible[:self.MAX_STRUGGLES]

    def generate_review_prompt(self, struggles: List[StruggleItem], level: str) -> str:
        """
        Generate a conversational system prompt incorporating struggle words.
        Uses Gemini 2.0 Flash for natural language generation.
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

        Returns None if user has insufficient struggles or review already exists.
        """
        # Check for existing review this week
        week_start = self._get_week_start()
        review_id = f'week-{week_start}'

        existing_ref = self._db.document(f'users/{user_id}/reviewLessons/{review_id}')
        existing = existing_ref.get()
        if existing.exists:
            print(f'[Review] Review already exists for user {user_id} week {week_start}')
            return None

        # Get eligible struggles
        struggles = self.get_eligible_struggles(user_id)

        if len(struggles) < self.MIN_STRUGGLES:
            print(f'[Review] Insufficient struggles ({len(struggles)}) for user {user_id}')
            return None

        # Get user's level
        level = self.get_user_level(user_id)

        # Generate prompt
        generated_prompt = self.generate_review_prompt(struggles, level)

        # Create review document
        now = datetime.now(timezone.utc)
        review = ReviewLesson(
            id=review_id,
            user_id=user_id,
            week_start=week_start,
            status='ready',
            generated_prompt=generated_prompt,
            target_struggles=[s.id for s in struggles],
            struggle_words=[s.word for s in struggles],
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

        # Update struggles with review inclusion
        for struggle in struggles:
            struggle_ref = self._db.document(f'users/{user_id}/struggles/{struggle.id}')
            new_review_count = struggle.review_count + 1
            update_data = {
                'reviewCount': new_review_count,
                'lastReviewedAt': now,
                'includedInReviews': firestore.ArrayUnion([review_id]),
            }
            # Mark as mastered if this is the 3rd review
            if new_review_count >= self.MAX_REVIEW_COUNT:
                update_data['mastered'] = True
            struggle_ref.update(update_data)

        print(f'[Review] Created review for user {user_id} with {len(struggles)} struggles at level {level}')
        return review


# Singleton instance
_review_service: Optional[ReviewService] = None


def get_review_service() -> ReviewService:
    """Get singleton review service instance."""
    global _review_service
    if _review_service is None:
        _review_service = ReviewService()
    return _review_service
