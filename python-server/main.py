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


# Request/Response models
class TokenRequest(BaseModel):
    """Request body for token creation."""
    userId: str
    systemPrompt: Optional[str] = None
    expireMinutes: int = 30
    lockConfig: bool = True


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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        systemPrompt: Optional system prompt locked into the token
        expireMinutes: Token lifetime (max 30 minutes)
        lockConfig: Lock token to specific config (recommended: true)

    Returns:
        token: Ephemeral token to use as API key
        expiresAt: Token expiration timestamp
        newSessionExpiresAt: New session window expiration
        model: Gemini model the token is valid for
    """
    try:
        token_service = get_token_service()
        ephemeral_token = await token_service.create_ephemeral_token(
            expire_minutes=min(request.expireMinutes, 30),
            new_session_expire_minutes=2,
            lock_config=request.lockConfig,
            system_prompt=request.systemPrompt
        )

        print(f"[Token] Created token for user {request.userId}", flush=True)
        if request.systemPrompt:
            print(f"[Token] System prompt length: {len(request.systemPrompt)} chars", flush=True)
            print(f"[Token] System prompt (first 300 chars): {request.systemPrompt[:300]}...", flush=True)
            # Check if function calling instructions are included
            if "FUNCTION CALLING" in request.systemPrompt:
                print(f"[Token] ✅ Function calling instructions INCLUDED", flush=True)
                # Show function calling section
                fc_index = request.systemPrompt.find("# FUNCTION CALLING")
                if fc_index >= 0:
                    print(f"[Token] Function calling section: {request.systemPrompt[fc_index:fc_index+500]}...", flush=True)
            else:
                print(f"[Token] ⚠️ WARNING: No function calling instructions in prompt!", flush=True)
        else:
            print(f"[Token] ❌ WARNING: No system prompt provided!", flush=True)

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
            "review_batch": "POST /api/review/generate-batch"
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=config.PORT,
        reload=True
    )
