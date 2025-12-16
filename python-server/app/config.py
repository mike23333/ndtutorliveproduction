"""
Configuration management for the Python server.
Loads environment variables and provides typed config access.
"""

import os
from typing import List
from dotenv import load_dotenv

# Load .env file if present (for local development)
load_dotenv()


class Config:
    """Application configuration from environment variables."""

    # Gemini API Key (required for ephemeral tokens)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Google Cloud (for Vertex AI fallback if needed)
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "")
    GCP_LOCATION: str = os.getenv("GCP_LOCATION", "us-central1")

    # Server
    PORT: int = int(os.getenv("PORT", "8080"))
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000"
    ).split(",")

    # Gemini Model - Native Audio for voice conversations
    # Updated to December 2025 version which has improved function calling
    GEMINI_MODEL: str = os.getenv(
        "GEMINI_MODEL",
        "gemini-2.5-flash-native-audio-preview-12-2025"
    )

    @classmethod
    def validate(cls) -> bool:
        """Validate required configuration is present."""
        if not cls.GEMINI_API_KEY:
            print("ERROR: GEMINI_API_KEY is required for ephemeral token generation.")
            return False
        return True

    @classmethod
    def print_config(cls) -> None:
        """Print current configuration (excluding secrets)."""
        print(f"Gemini API Key: {'*' * 8 + cls.GEMINI_API_KEY[-4:] if cls.GEMINI_API_KEY else '(not set)'}")
        print(f"Port: {cls.PORT}")
        print(f"Allowed Origins: {cls.ALLOWED_ORIGINS}")
        print(f"Gemini Model: {cls.GEMINI_MODEL}")


config = Config()
