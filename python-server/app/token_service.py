"""
Ephemeral Token Service for Gemini Live API.

Generates short-lived tokens for direct client-to-Gemini connections.
Tokens are created using the v1alpha API with configurable expiry and constraints.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from dataclasses import dataclass

from google import genai
from google.genai import types

from app.config import config


@dataclass
class EphemeralToken:
    """Ephemeral token data."""
    token: str
    expires_at: datetime
    new_session_expires_at: datetime


class TokenService:
    """Service for creating ephemeral tokens for client-side Gemini connections."""

    def __init__(self):
        """Initialize the token service with Gemini Developer API client."""
        if not config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required for ephemeral token generation")

        self._client = genai.Client(
            api_key=config.GEMINI_API_KEY,
            http_options=types.HttpOptions(api_version='v1alpha')
        )

    async def create_ephemeral_token(
        self,
        expire_minutes: int = 30,
        new_session_expire_minutes: int = 2,
        lock_config: bool = True,
        system_prompt: Optional[str] = None,
        voice_name: Optional[str] = None
    ) -> EphemeralToken:
        """
        Create an ephemeral token for client-side Gemini Live API connection.

        Args:
            expire_minutes: Token lifetime in minutes (max 30)
            new_session_expire_minutes: Time window to start new sessions (default 2)
            lock_config: Whether to lock token to specific model/config
            system_prompt: Optional system prompt to lock into the token

        Returns:
            EphemeralToken with token string and expiry times
        """
        now = datetime.now(timezone.utc)
        expire_time = now + timedelta(minutes=min(expire_minutes, 30))
        new_session_expire_time = now + timedelta(minutes=new_session_expire_minutes)

        # Build config
        # uses > 1 allows token reuse for session resumption reconnects
        token_config: Dict[str, Any] = {
            'uses': 10,  # Allow multiple reconnects with same token for session resumption
            'expire_time': expire_time.isoformat(),
            'new_session_expire_time': new_session_expire_time.isoformat(),
        }

        # Optionally lock token to specific configuration
        if lock_config:
            live_config = {
                'response_modalities': ['AUDIO'],
                # Enable audio transcription for chat bubbles
                'output_audio_transcription': {},  # Transcribe AI's spoken responses
                'input_audio_transcription': {},   # Transcribe user's spoken input
                'session_resumption': {},
                'context_window_compression': {
                    'sliding_window': {}
                },
                'realtime_input_config': {
                    'automatic_activity_detection': {
                        'disabled': False,
                        'start_of_speech_sensitivity': 'START_SENSITIVITY_HIGH',
                        'end_of_speech_sensitivity': 'END_SENSITIVITY_HIGH',
                        'prefix_padding_ms': 200,
                        'silence_duration_ms': 500
                    }
                },
                'speech_config': {
                    'voice_config': {
                        'prebuilt_voice_config': {
                            'voice_name': voice_name or 'Aoede'
                        }
                    }
                },
                'enable_affective_dialog': True
            }

            if system_prompt:
                # Live API expects system_instruction as a simple string
                live_config['system_instruction'] = system_prompt

            # Add function calling tools for autonomous tracking
            live_config['tools'] = [{
                'function_declarations': [
                    {
                        'name': 'mark_for_review',
                        'description': 'Call this silently when the student makes a linguistic error. Do not interrupt the flow.',
                        'parameters': {
                            'type': 'object',
                            'properties': {
                                'error_type': {
                                    'type': 'string',
                                    'enum': ['Grammar', 'Pronunciation', 'Vocabulary', 'Cultural'],
                                    'description': 'The type of linguistic error'
                                },
                                'severity': {
                                    'type': 'integer',
                                    'description': '1 (Minor) to 10 (Critical)'
                                },
                                'user_sentence': {
                                    'type': 'string',
                                    'description': 'The approximate sentence the user just said'
                                },
                                'correction': {
                                    'type': 'string',
                                    'description': 'The correct native way to say it'
                                },
                                'explanation': {
                                    'type': 'string',
                                    'description': 'A very brief explanation of the rule'
                                }
                            },
                            'required': ['error_type', 'user_sentence', 'correction', 'severity']
                        }
                    },
                    {
                        'name': 'update_user_profile',
                        'description': 'Call this when you learn about student preferences or interests',
                        'parameters': {
                            'type': 'object',
                            'properties': {
                                'category': {'type': 'string', 'enum': ['topic', 'interest', 'learning_style', 'difficulty_preference']},
                                'value': {'type': 'string', 'description': 'The preference value'},
                                'sentiment': {'type': 'string', 'enum': ['positive', 'negative', 'neutral']},
                                'confidence': {'type': 'number', 'description': 'Confidence 0-1'}
                            },
                            'required': ['category', 'value', 'sentiment']
                        }
                    },
                    {
                        'name': 'show_session_summary',
                        'description': 'Call this at session end to display a summary for the student',
                        'parameters': {
                            'type': 'object',
                            'properties': {
                                'did_well': {'type': 'array', 'items': {'type': 'string'}, 'description': 'Things student did well'},
                                'work_on': {'type': 'array', 'items': {'type': 'string'}, 'description': 'Areas to practice'},
                                'stars': {'type': 'integer', 'description': 'Rating 1-5'},
                                'summary_text': {'type': 'string', 'description': 'Encouraging summary'},
                                'encouragement': {'type': 'string', 'description': 'Optional motivation'}
                            },
                            'required': ['did_well', 'work_on', 'stars', 'summary_text']
                        }
                    },
                    {
                        'name': 'mark_item_mastered',
                        'description': 'Mark a review item as mastered when the student demonstrates clear understanding. Call this during review sessions when the student correctly uses a phrase they previously struggled with. Do NOT call if they just repeat after you.',
                        'parameters': {
                            'type': 'object',
                            'properties': {
                                'review_item_id': {
                                    'type': 'string',
                                    'description': 'The exact ID of the review item to mark as mastered (from the ITEMS TO REVIEW list)'
                                },
                                'confidence': {
                                    'type': 'string',
                                    'enum': ['low', 'medium', 'high'],
                                    'description': 'How confident you are in their mastery: low (hesitant but correct), medium (correct with minor issues), high (natural and fluent)'
                                }
                            },
                            'required': ['review_item_id', 'confidence']
                        }
                    },
                    {
                        'name': 'play_student_audio',
                        'description': 'Play back audio of a mistake the student made earlier. Use this BEFORE explaining the correction so they can hear themselves. Only call for items marked as "HAS AUDIO" in the review list.',
                        'parameters': {
                            'type': 'object',
                            'properties': {
                                'review_item_id': {
                                    'type': 'string',
                                    'description': 'The exact ID of the review item with audio to play (from the ITEMS TO REVIEW list)'
                                }
                            },
                            'required': ['review_item_id']
                        }
                    },
                    {
                        'name': 'mark_task_complete',
                        'description': 'Call when student successfully accomplishes a lesson task/objective. Only call when the task is clearly completed, not when partially done or just discussed.',
                        'parameters': {
                            'type': 'object',
                            'properties': {
                                'task_id': {
                                    'type': 'string',
                                    'description': 'The ID of the completed task (e.g., "task-1", "task-2")'
                                }
                            },
                            'required': ['task_id']
                        }
                    }
                ]
            }]

            token_config['live_connect_constraints'] = {
                'model': config.GEMINI_MODEL,
                'config': live_config
            }

        # Create the token using the async client
        try:
            token_response = await self._client.aio.auth_tokens.create(
                config=token_config
            )

            return EphemeralToken(
                token=token_response.name,
                expires_at=expire_time,
                new_session_expires_at=new_session_expire_time
            )
        except Exception as e:
            print(f"[TokenService] Error creating token: {e}")
            raise


# Singleton instance
_token_service: Optional[TokenService] = None


def get_token_service() -> TokenService:
    """Get the singleton token service instance."""
    global _token_service
    if _token_service is None:
        _token_service = TokenService()
    return _token_service
