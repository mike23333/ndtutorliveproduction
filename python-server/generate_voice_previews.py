"""
Generate voice preview audio files using Gemini's native audio output.
Each voice says: "Hello! I'm ready to help you practice English."

Usage:
    cd python-server
    python generate_voice_previews.py

Output:
    Creates WAV files in ../public/audio/voices/
"""

import os
import wave
import asyncio
from pathlib import Path

from google import genai
from google.genai import types

# Configuration
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    # Try to load from .env file
    from dotenv import load_dotenv
    load_dotenv()
    API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "audio" / "voices"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# The phrase each voice will say
PREVIEW_TEXT = "Hello! I'm ready to help you practice English."

# All available Gemini voices
VOICES = [
    "Puck",
    "Charon",
    "Kore",
    "Fenrir",
    "Aoede",
    "Leda",
    "Orus",
    "Zephyr",
]


def save_wave_file(filename: Path, pcm_data: bytes, channels=1, rate=24000, sample_width=2):
    """Save PCM audio data as a WAV file."""
    with wave.open(str(filename), "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        wf.writeframes(pcm_data)


def generate_voice_preview(client: genai.Client, voice_name: str) -> bytes:
    """Generate audio for a single voice using Gemini's TTS."""

    print(f"  Generating preview for voice: {voice_name}...")

    # Use Gemini's native audio generation (synchronous)
    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=PREVIEW_TEXT,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice_name
                    )
                )
            )
        )
    )

    # Extract audio data from response
    if response.candidates and response.candidates[0].content.parts:
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                return part.inline_data.data

    raise ValueError(f"No audio data in response for voice {voice_name}")


def main():
    """Generate all voice previews."""

    print("=" * 50)
    print("Gemini Voice Preview Generator")
    print("=" * 50)
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Preview text: '{PREVIEW_TEXT}'")
    print(f"Voices to generate: {len(VOICES)}")
    print("=" * 50)

    # Initialize client
    client = genai.Client(api_key=API_KEY)

    success_count = 0

    for voice in VOICES:
        try:
            # Generate audio (returns PCM data)
            pcm_data = generate_voice_preview(client, voice)

            # Save as WAV file
            output_file = OUTPUT_DIR / f"{voice.lower()}.wav"
            save_wave_file(output_file, pcm_data)

            file_size = output_file.stat().st_size / 1024
            print(f"  ✓ Saved: {output_file.name} ({file_size:.1f} KB)")
            success_count += 1

        except Exception as e:
            print(f"  ✗ Error generating {voice}: {e}")

    print("=" * 50)
    print(f"Generated {success_count}/{len(VOICES)} voice previews")
    print(f"Files saved to: {OUTPUT_DIR}")
    print("=" * 50)


if __name__ == "__main__":
    main()
