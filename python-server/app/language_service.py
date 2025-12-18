"""
Language Service - Translation and Text-to-Speech functionality.

Provides:
- Translation via Google Cloud Translation API
- Text-to-Speech via Google Cloud TTS API
"""

import base64
from typing import Optional
from google.cloud import translate_v2 as translate
from google.cloud import texttospeech


class LanguageService:
    """Service for translation and text-to-speech operations."""

    def __init__(self):
        """Initialize language service clients."""
        self._translate_client: Optional[translate.Client] = None
        self._tts_client: Optional[texttospeech.TextToSpeechClient] = None

    @property
    def translate_client(self) -> translate.Client:
        """Lazy initialization of translation client."""
        if self._translate_client is None:
            self._translate_client = translate.Client()
        return self._translate_client

    @property
    def tts_client(self) -> texttospeech.TextToSpeechClient:
        """Lazy initialization of TTS client."""
        if self._tts_client is None:
            self._tts_client = texttospeech.TextToSpeechClient()
        return self._tts_client

    def translate_text(
        self,
        text: str,
        target_language: str,
        source_language: Optional[str] = None
    ) -> dict:
        """
        Translate text to target language.

        Args:
            text: Text to translate
            target_language: BCP-47 language code (e.g., 'uk', 'es', 'fr')
            source_language: Optional source language code (auto-detect if not provided)

        Returns:
            dict with translated text and detected source language
        """
        # Extract language code from BCP-47 format (e.g., 'uk-UA' -> 'uk')
        target_code = target_language.split('-')[0] if '-' in target_language else target_language

        try:
            result = self.translate_client.translate(
                text,
                target_language=target_code,
                source_language=source_language
            )

            return {
                "translatedText": result["translatedText"],
                "detectedSourceLanguage": result.get("detectedSourceLanguage", source_language),
                "targetLanguage": target_code
            }
        except Exception as e:
            print(f"[LanguageService] Translation error: {e}", flush=True)
            raise

    # Best voices by language - Studio (most realistic) > Neural2 > Standard
    BEST_VOICES = {
        "en-US": "en-US-Studio-O",   # Studio female - most realistic
        "en-GB": "en-GB-Neural2-F",  # Neural2 female, British English
        "uk-UA": "uk-UA-Standard-A", # Ukrainian (Studio/Neural2 not available)
        "es-ES": "es-ES-Studio-F",   # Studio female, Spanish
        "fr-FR": "fr-FR-Neural2-A",  # Neural2 female, French
        "de-DE": "de-DE-Studio-B",   # Studio female, German
        "it-IT": "it-IT-Neural2-A",  # Neural2 female, Italian
        "pt-BR": "pt-BR-Neural2-A",  # Neural2 female, Portuguese
        "ja-JP": "ja-JP-Neural2-B",  # Neural2 female, Japanese
        "ko-KR": "ko-KR-Neural2-A",  # Neural2 female, Korean
        "zh-CN": "cmn-CN-Neural2-A", # Neural2 female, Mandarin Chinese
    }

    def text_to_speech(
        self,
        text: str,
        language_code: str = "en-US",
        voice_name: Optional[str] = None,
        speaking_rate: float = 0.9,
        pitch: float = 0.0
    ) -> bytes:
        """
        Convert text to speech audio using high-quality Neural2 voices.

        Args:
            text: Text to synthesize
            language_code: BCP-47 language code (e.g., 'en-US', 'uk-UA')
            voice_name: Optional specific voice name (uses Neural2 default if not provided)
            speaking_rate: Speed of speech (0.25 to 4.0, default 0.9 for clarity)
            pitch: Voice pitch adjustment (-20.0 to 20.0)

        Returns:
            MP3 audio bytes
        """
        # Use best available voice (Studio > Neural2 > Standard)
        if voice_name is None:
            voice_name = self.BEST_VOICES.get(language_code)

        # Build the voice request
        voice_params = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=voice_name,
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE if voice_name is None else None
        )

        # Select audio config - MP3 for web playback
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speaking_rate,
            pitch=pitch
        )

        # Build synthesis input
        synthesis_input = texttospeech.SynthesisInput(text=text)

        try:
            response = self.tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice_params,
                audio_config=audio_config
            )

            return response.audio_content
        except Exception as e:
            print(f"[LanguageService] TTS error: {e}", flush=True)
            raise

    def text_to_speech_base64(
        self,
        text: str,
        language_code: str = "en-US",
        voice_name: Optional[str] = None,
        speaking_rate: float = 0.9,
        pitch: float = 0.0
    ) -> str:
        """
        Convert text to speech and return base64-encoded audio.

        Args:
            text: Text to synthesize
            language_code: BCP-47 language code
            voice_name: Optional specific voice name
            speaking_rate: Speed of speech
            pitch: Voice pitch adjustment

        Returns:
            Base64-encoded MP3 audio string
        """
        audio_bytes = self.text_to_speech(
            text=text,
            language_code=language_code,
            voice_name=voice_name,
            speaking_rate=speaking_rate,
            pitch=pitch
        )
        return base64.b64encode(audio_bytes).decode('utf-8')


# Singleton instance
_language_service: Optional[LanguageService] = None


def get_language_service() -> LanguageService:
    """Get the singleton LanguageService instance."""
    global _language_service
    if _language_service is None:
        _language_service = LanguageService()
    return _language_service
