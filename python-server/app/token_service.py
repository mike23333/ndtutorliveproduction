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
        system_prompt: Optional[str] = None
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
                            'voice_name': 'Aoede'
                        }
                    }
                },
                'enable_affective_dialog': True
            }

            if system_prompt:
                live_config['system_instruction'] = {
                    'parts': [{'text': system_prompt}]
                }

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
