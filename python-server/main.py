"""
FastAPI server for Gemini Live API ephemeral token provisioning.

This server provides ephemeral tokens for direct client-to-Gemini connections.
The client connects directly to Gemini Live API using these tokens.
"""

from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import config
from app.token_service import get_token_service


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
            "health": "GET /health"
        },
        "architecture": "Client gets token here, then connects directly to Gemini Live API"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=config.PORT,
        reload=True
    )
