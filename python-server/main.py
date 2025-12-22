"""
FastAPI server for Gemini Live API ephemeral token provisioning.

This server provides ephemeral tokens for direct client-to-Gemini connections.
The client connects directly to Gemini Live API using these tokens.
"""

import os
from typing import Optional, List
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.cloud import firestore

from app.config import config
from app.token_service import get_token_service
from app.review_service import get_review_service
from app.analytics_service import get_analytics_service
from app.language_service import get_language_service
from app.prompt_builder import get_prompt_builder


# Request/Response models
class LessonTask(BaseModel):
    """A single lesson task/objective."""
    id: str
    text: str


class TokenRequest(BaseModel):
    """Request body for token creation."""
    userId: str
    systemPrompt: Optional[str] = None
    tasks: Optional[List[LessonTask]] = None  # Lesson objectives for auto-injection
    isReviewLesson: bool = False  # Whether this is a review lesson
    expireMinutes: int = 30
    lockConfig: bool = True
    voiceName: Optional[str] = None  # Gemini voice (e.g., 'Aoede', 'Puck', 'Leda')


class TokenResponse(BaseModel):
    """Response body with ephemeral token."""
    token: str
    expiresAt: str
    newSessionExpiresAt: str
    model: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    print("=" * 50)
    print("Starting Gemini Token Server")
    print("=" * 50)
    config.validate()
    config.print_config()
    yield
    print("[Shutdown] Done")


app = FastAPI(
    title="Gemini Token Server",
    description="Ephemeral token provisioning for direct client-to-Gemini Live API connections",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware - must be added FIRST for proper error handling
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "model": config.GEMINI_MODEL,
        "version": "2.0.0",
        "mode": "token-provisioning"
    }


@app.post("/api/token", response_model=TokenResponse)
async def create_token(request: TokenRequest):
    """
    Create an ephemeral token for direct client-to-Gemini Live API connection.

    The client uses this token to connect directly to Gemini via WebSocket,
    bypassing this server for all audio/data streaming.

    Token Configuration:
    - 30 minute max expiry
    - Affective dialog enabled
    - Session resumption enabled
    - Automatic VAD (always-listening)
    - Context window compression

    Request Body:
        userId: User ID for tracking
        systemPrompt: Teacher's custom system prompt (scenario, role, etc.)
        tasks: Optional list of lesson objectives for auto-injection
        isReviewLesson: Whether this is a review lesson
        expireMinutes: Token lifetime (max 30 minutes)
        lockConfig: Lock token to specific config (recommended: true)
        voiceName: Voice for speech synthesis

    Returns:
        token: Ephemeral token to use as API key
        expiresAt: Token expiration timestamp
        newSessionExpiresAt: New session window expiration
        model: Gemini model the token is valid for
    """
    try:
        token_service = get_token_service()
        prompt_builder = get_prompt_builder()

        # Determine if we have tasks
        has_tasks = request.tasks is not None and len(request.tasks) > 0

        # Build final prompt with auto-injected tool instructions
        final_prompt = None
        if request.systemPrompt:
            # Convert LessonTask models to dicts for prompt_builder
            tasks_list = None
            if has_tasks:
                tasks_list = [{"id": t.id, "text": t.text} for t in request.tasks]

            final_prompt = prompt_builder.build(
                teacher_prompt=request.systemPrompt,
                tasks=tasks_list,
                is_review_lesson=request.isReviewLesson
            )

        # Create token with assembled prompt and conditional tools
        ephemeral_token = await token_service.create_ephemeral_token(
            expire_minutes=min(request.expireMinutes, 30),
            new_session_expire_minutes=2,
            lock_config=request.lockConfig,
            system_prompt=final_prompt,
            voice_name=request.voiceName,
            has_tasks=has_tasks,
            is_review_lesson=request.isReviewLesson
        )

        # Logging
        print(f"\n{'='*60}", flush=True)
        print(f"[Token] AUTO-INJECT TOOL INSTRUCTIONS - Request Summary", flush=True)
        print(f"{'='*60}", flush=True)
        print(f"[Token] User: {request.userId}", flush=True)
        print(f"[Token] Voice: {request.voiceName or 'Aoede (default)'}", flush=True)
        print(f"[Token] Has tasks: {has_tasks} ({len(request.tasks) if has_tasks else 0} tasks)", flush=True)
        print(f"[Token] Is review lesson: {request.isReviewLesson}", flush=True)

        if has_tasks:
            print(f"[Token] Tasks:", flush=True)
            for t in request.tasks:
                print(f"[Token]   - {t.id}: {t.text}", flush=True)

        if final_prompt:
            print(f"\n[Token] PROMPT ASSEMBLY:", flush=True)
            print(f"[Token] Final prompt length: {len(final_prompt)} chars", flush=True)

            # Check for auto-injected sections
            injections = []
            if "Autonomous Tracking" in final_prompt:
                injections.append("Base Tool Instructions")
            if "Task Completion" in final_prompt:
                injections.append("Task Completion Instructions")
            if "Review Session Tools" in final_prompt:
                injections.append("Review Session Instructions")

            if injections:
                print(f"[Token] ✅ Auto-injected sections: {', '.join(injections)}", flush=True)
            else:
                print(f"[Token] ⚠️ No tool instructions found in prompt", flush=True)

            # Show full prompt for debugging (can be removed in production)
            print(f"\n[Token] === FULL ASSEMBLED PROMPT ===", flush=True)
            print(final_prompt, flush=True)
            print(f"[Token] === END PROMPT ===\n", flush=True)
        else:
            print(f"[Token] ⚠️ No system prompt provided", flush=True)

        return TokenResponse(
            token=ephemeral_token.token,
            expiresAt=ephemeral_token.expires_at.isoformat(),
            newSessionExpiresAt=ephemeral_token.new_session_expires_at.isoformat(),
            model=config.GEMINI_MODEL
        )
    except Exception as e:
        print(f"[Token] Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"Failed to create token: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "Gemini Token Server",
        "version": "2.0.0",
        "description": "Ephemeral token provisioning for direct Gemini Live API connections",
        "endpoints": {
            "token": "POST /api/token",
            "health": "GET /health",
            "review_generate": "POST /api/review/generate",
            "review_batch": "POST /api/review/generate-batch",
            "analytics": "GET /api/analytics/teacher/{teacherId}",
            "mistakes": "GET /api/mistakes/teacher/{teacherId}",
            "pulse_get": "GET /api/pulse/teacher/{teacherId}",
            "pulse_generate": "POST /api/pulse/teacher/{teacherId}",
            "translate": "POST /api/translate",
            "tts": "POST /api/tts"
        },
        "architecture": "Client gets token here, then connects directly to Gemini Live API"
    }


# ==================== REVIEW LESSON ENDPOINTS ====================

class GenerateReviewRequest(BaseModel):
    """Request body for single user review generation."""
    userId: str


class GenerateReviewResponse(BaseModel):
    """Response for review generation."""
    success: bool
    reviewId: Optional[str] = None
    struggleCount: int = 0
    message: str


@app.post("/api/review/generate", response_model=GenerateReviewResponse)
async def generate_review(request: GenerateReviewRequest):
    """
    Generate a weekly review lesson for a specific user.

    Called manually or by scheduler. Checks for:
    - Minimum 3 struggles
    - No existing review this week
    - Struggles not reviewed in last 7 days

    The generated prompt incorporates the student's level and is tailored
    for natural conversation practice with their struggle words.
    """
    try:
        review_service = get_review_service()
        review = review_service.create_review_lesson(request.userId)

        if review:
            return GenerateReviewResponse(
                success=True,
                reviewId=review.id,
                struggleCount=len(review.struggle_words),
                message=f"Review created with {len(review.struggle_words)} struggle words at level {review.user_level}"
            )
        else:
            return GenerateReviewResponse(
                success=False,
                message="Insufficient struggles or review already exists for this week"
            )
    except Exception as e:
        print(f"[Review] Error generating review: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))


class GenerateBatchReviewsRequest(BaseModel):
    """Request for batch review generation (scheduler trigger)."""
    triggerSecret: str  # Simple auth for scheduler


class GenerateBatchReviewsResponse(BaseModel):
    """Response for batch generation."""
    usersProcessed: int
    reviewsCreated: int
    errors: int


@app.post("/api/review/generate-batch", response_model=GenerateBatchReviewsResponse)
async def generate_batch_reviews(request: GenerateBatchReviewsRequest):
    """
    Generate weekly reviews for all active users.

    Triggered by Cloud Scheduler at Sunday 6PM Kyiv time.
    Requires SCHEDULER_SECRET env var for authentication.

    Processes users who have had sessions in the last 7 days
    and generates personalized review lessons for each.
    """
    # Validate scheduler secret
    expected_secret = os.getenv("SCHEDULER_SECRET", "")
    if not expected_secret or request.triggerSecret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid scheduler secret")

    try:
        review_service = get_review_service()
        db = firestore.Client()

        # Get users with recent sessions (last 7 days)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        users_ref = db.collection('users')
        query = users_ref.where('lastSessionAt', '>=', seven_days_ago)

        users_processed = 0
        reviews_created = 0
        errors = 0

        for user_doc in query.stream():
            user_id = user_doc.id
            users_processed += 1

            try:
                review = review_service.create_review_lesson(user_id)
                if review:
                    reviews_created += 1
            except Exception as e:
                print(f"[Review] Error for user {user_id}: {e}", flush=True)
                errors += 1

        print(f"[Review] Batch complete: {users_processed} users, {reviews_created} reviews, {errors} errors", flush=True)

        return GenerateBatchReviewsResponse(
            usersProcessed=users_processed,
            reviewsCreated=reviews_created,
            errors=errors
        )
    except Exception as e:
        print(f"[Review] Batch error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ANALYTICS ENDPOINTS ====================

@app.get("/api/analytics/teacher/{teacherId}")
async def get_teacher_analytics(
    teacherId: str,
    period: str = "week",
    level: str = "all"
):
    """
    Get analytics for a teacher's class.

    Query Parameters:
        period: Time period - "week", "month", or "all-time" (default: "week")
        level: CEFR level filter - "A1"-"C2" or "all" (default: "all")

    Returns analytics grouped by CEFR level including:
        - Student counts and session activity
        - Average stars and practice minutes
        - Week-over-week trends
        - Per-lesson performance stats
        - Student activity status
        - Top struggle words/phrases
        - Cross-level insights (mismatches, advancement candidates)
    """
    # Validate period
    if period not in ["week", "month", "all-time"]:
        raise HTTPException(status_code=400, detail="Invalid period. Use: week, month, all-time")

    # Validate level
    valid_levels = ["all", "A1", "A2", "B1", "B2", "C1", "C2"]
    if level not in valid_levels:
        raise HTTPException(status_code=400, detail=f"Invalid level. Use: {', '.join(valid_levels)}")

    try:
        analytics_service = get_analytics_service()
        result = analytics_service.get_teacher_analytics(teacherId, period, level)
        return result
    except Exception as e:
        print(f"[Analytics] Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CLASS MISTAKES ENDPOINTS ====================

@app.get("/api/mistakes/teacher/{teacherId}")
async def get_class_mistakes(
    teacherId: str,
    period: str = "week"
):
    """
    Get all student mistakes/errors for a teacher's class.

    Used by the Insights tab to show common mistakes across all students.

    Query Parameters:
        period: Time period - "week", "month", or "all-time" (default: "week")

    Returns:
        mistakes: Array of mistake objects with student info and audio URLs
        summary: Counts by error type (Grammar, Pronunciation, Vocabulary, Cultural)
    """
    # Validate period
    if period not in ["week", "month", "all-time"]:
        raise HTTPException(status_code=400, detail="Invalid period. Use: week, month, all-time")

    try:
        analytics_service = get_analytics_service()
        result = analytics_service.get_class_mistakes(teacherId, period)
        return result
    except Exception as e:
        print(f"[Mistakes] Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CLASS PULSE ENDPOINTS ====================

@app.get("/api/pulse/teacher/{teacherId}")
async def get_class_pulse(teacherId: str):
    """
    Get existing Class Pulse insights for a teacher (without regenerating).

    Returns today's AI-generated insights if available.
    Use POST to generate/refresh insights.
    """
    try:
        analytics_service = get_analytics_service()
        result = analytics_service.get_class_pulse(teacherId)
        return result
    except Exception as e:
        print(f"[ClassPulse] Error getting pulse: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pulse/teacher/{teacherId}")
async def generate_class_pulse(teacherId: str, force: bool = False):
    """
    Generate AI-powered Class Pulse insights for a teacher.

    Uses Gemini 2.5 Pro to analyze class data and generate 2-3 actionable insights.
    Implements smart triggering - only calls Gemini when meaningful new data exists:
    - 3+ new sessions since last generation, OR
    - 5+ new struggles since last generation

    Query Parameters:
        force: Force regeneration even if no new data (default: false)

    Returns:
        insights: Array of insight objects (type, level, title, message)
        generatedAt: Timestamp of generation
        stillValidAt: Timestamp of last validation
        isNew: Whether insights were freshly generated

    Insight types:
        - "warning": Needs teacher attention (low scores, inactive students)
        - "info": Neutral observation (patterns, trends)
        - "success": Positive news (advancement candidates, improvements)
    """
    try:
        print(f"[ClassPulse] POST request for teacher {teacherId}, force={force}", flush=True)
        analytics_service = get_analytics_service()
        result = analytics_service.generate_class_pulse(teacherId, force=force)
        return result
    except Exception as e:
        import traceback
        print(f"[ClassPulse] Error generating pulse: {e}", flush=True)
        print(f"[ClassPulse] Traceback: {traceback.format_exc()}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))


class AskQuestionRequest(BaseModel):
    """Request body for asking a custom question about the class."""
    question: str


# ==================== TRANSLATION ENDPOINTS ====================

class TranslateRequest(BaseModel):
    """Request body for translation."""
    text: str
    targetLanguage: str  # BCP-47 code like 'uk-UA', 'es-ES'
    sourceLanguage: Optional[str] = None  # Auto-detect if not provided


class TranslateResponse(BaseModel):
    """Response with translated text."""
    translatedText: str
    detectedSourceLanguage: str
    targetLanguage: str


@app.post("/api/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """
    Translate text to the target language.

    Uses Google Cloud Translation API to translate text.
    The target language should be a BCP-47 code (e.g., 'uk-UA', 'es-ES').

    Request Body:
        text: Text to translate
        targetLanguage: Target language code (BCP-47)
        sourceLanguage: Optional source language (auto-detects if not provided)

    Returns:
        translatedText: The translated text
        detectedSourceLanguage: The detected source language
        targetLanguage: The target language used
    """
    try:
        language_service = get_language_service()
        result = language_service.translate_text(
            text=request.text,
            target_language=request.targetLanguage,
            source_language=request.sourceLanguage
        )

        print(f"[Translate] '{request.text[:50]}...' -> {request.targetLanguage}", flush=True)

        return TranslateResponse(
            translatedText=result["translatedText"],
            detectedSourceLanguage=result["detectedSourceLanguage"],
            targetLanguage=result["targetLanguage"]
        )
    except Exception as e:
        print(f"[Translate] Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


# ==================== TEXT-TO-SPEECH ENDPOINTS ====================

class TTSRequest(BaseModel):
    """Request body for text-to-speech."""
    text: str
    languageCode: str = "en-US"  # BCP-47 code
    voiceName: Optional[str] = None
    speakingRate: float = 0.9  # Slightly slower for learning
    pitch: float = 0.0


class TTSResponse(BaseModel):
    """Response with audio data."""
    audioContent: str  # Base64-encoded MP3 audio
    contentType: str


@app.post("/api/tts", response_model=TTSResponse)
async def text_to_speech(request: TTSRequest):
    """
    Convert text to speech audio.

    Uses Google Cloud Text-to-Speech API to synthesize speech.
    Returns base64-encoded MP3 audio for web playback.

    Request Body:
        text: Text to synthesize
        languageCode: Language code (default: en-US)
        voiceName: Optional specific voice name
        speakingRate: Speech speed (0.25-4.0, default: 0.9 for clarity)
        pitch: Voice pitch adjustment (-20 to 20)

    Returns:
        audioContent: Base64-encoded MP3 audio
        contentType: MIME type (audio/mpeg)
    """
    try:
        language_service = get_language_service()
        audio_base64 = language_service.text_to_speech_base64(
            text=request.text,
            language_code=request.languageCode,
            voice_name=request.voiceName,
            speaking_rate=request.speakingRate,
            pitch=request.pitch
        )

        print(f"[TTS] Generated audio for: '{request.text[:50]}...'", flush=True)

        return TTSResponse(
            audioContent=audio_base64,
            contentType="audio/mpeg"
        )
    except Exception as e:
        print(f"[TTS] Error: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"Text-to-speech failed: {str(e)}")


@app.post("/api/pulse/teacher/{teacherId}/ask")
async def ask_class_question(teacherId: str, request: AskQuestionRequest):
    """
    Ask a custom question about your class and get an AI-generated answer.

    The AI analyzes your class data (students, sessions, mistakes, lessons)
    to provide a personalized answer to your question.

    Example questions:
        - "Who hasn't practiced this week?"
        - "Who's struggling with past tense?"
        - "Compare my top and struggling students"
        - "What should I focus on tomorrow?"
        - "Which lesson is causing the most mistakes?"

    Returns:
        answer: Natural language answer to the question
    """
    try:
        print(f"[ClassPulse] Question from teacher {teacherId}: {request.question}", flush=True)
        analytics_service = get_analytics_service()
        result = analytics_service.answer_class_question(teacherId, request.question)
        return result
    except Exception as e:
        import traceback
        print(f"[ClassPulse] Error answering question: {e}", flush=True)
        print(f"[ClassPulse] Traceback: {traceback.format_exc()}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=config.PORT,
        reload=True
    )
