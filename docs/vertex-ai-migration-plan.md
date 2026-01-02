# Vertex AI Migration Plan

## Overview

This document outlines the plan to migrate from **Gemini API** (preview) to **Vertex AI** (GA) for the Gemini Live API integration.

## Why Migrate?

| Aspect | Gemini API (Current) | Vertex AI (Target) |
|--------|---------------------|-------------------|
| **Status** | Preview | GA (Production) |
| **Stability** | Occasional "Internal error" disconnects | Enterprise-grade stability |
| **SLA** | None | Google Cloud SLA |
| **Multi-region** | No | Yes |
| **Cost** | Same | Same |

## Voice Compatibility

**All 8 current voices are supported on Vertex AI:**

| Voice ID | Status | Description |
|----------|--------|-------------|
| Puck | ✅ Compatible | Conversational & friendly |
| Charon | ✅ Compatible | Deep & authoritative |
| Kore | ✅ Compatible | Neutral & professional |
| Fenrir | ✅ Compatible | Warm & approachable |
| Aoede | ✅ Compatible | Melodic & expressive (default) |
| Leda | ✅ Compatible | Gentle & patient |
| Orus | ✅ Compatible | Clear & articulate |
| Zephyr | ✅ Compatible | Light & encouraging |

**Vertex AI has 30 total voices** - can expand voice selection later if desired.

## Feature Compatibility

| Feature | Current Implementation | Vertex AI Support |
|---------|----------------------|-------------------|
| Affective Dialog | `enableAffectiveDialog: true` | ✅ Same config |
| Session Resumption | `sessionResumption` config | ✅ Same config |
| Voice Selection | `prebuiltVoiceConfig.voiceName` | ✅ Same config |
| VAD Settings | `automaticActivityDetection` | ✅ Same config |
| Function Calling | `tools` array | ✅ Same config |
| Transcription | `outputAudioTranscription` | ✅ Same config |

## Migration Steps

### Phase 1: GCP Setup (Prerequisites)

1. **Enable Vertex AI API**
   ```bash
   gcloud services enable aiplatform.googleapis.com
   ```

2. **Create Service Account**
   ```bash
   gcloud iam service-accounts create gemini-live-api \
     --display-name="Gemini Live API Service Account"
   ```

3. **Grant Permissions**
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:gemini-live-api@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```

4. **Download Service Account Key** (for Cloud Function)
   ```bash
   gcloud iam service-accounts keys create ./service-account.json \
     --iam-account=gemini-live-api@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

### Phase 2: Backend Changes (Cloud Function)

**Current:** Generates ephemeral API tokens
**New:** Generates short-lived OAuth2 access tokens

```typescript
// functions/src/generateAccessToken.ts (NEW)
import { GoogleAuth } from 'google-auth-library';

export async function generateVertexAccessToken(): Promise<{
  token: string;
  expiresAt: Date;
  project: string;
  location: string;
}> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();

  return {
    token: tokenResponse.token!,
    expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
    project: process.env.GOOGLE_CLOUD_PROJECT!,
    location: 'us-central1',
  };
}
```

### Phase 3: Frontend Changes

**File: `src/services/geminiDirectClient.ts`**

```typescript
// BEFORE (Gemini API)
this.client = new GoogleGenAI({
  apiKey: ephemeralToken.token,
  httpOptions: { apiVersion: 'v1alpha' }
});

// AFTER (Vertex AI)
this.client = new GoogleGenAI({
  vertexai: true,
  project: accessToken.project,
  location: accessToken.location,
  googleAuthOptions: {
    credentials: { access_token: accessToken.token }
  }
});
```

**File: `src/services/tokenService.ts`**

```typescript
// Update to call new Cloud Function endpoint
async getAccessToken(userId: string): Promise<VertexAccessToken> {
  const response = await fetch(
    `${FUNCTIONS_BASE_URL}/generateVertexAccessToken`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }
  );
  return response.json();
}
```

**File: `src/types/gemini.ts`**

```typescript
// Add new type
export interface VertexAccessToken {
  token: string;
  expiresAt: Date;
  project: string;
  location: string;
}
```

### Phase 4: Config Changes

**No changes needed for:**
- Voice configuration (same format)
- Affective dialog (same format)
- VAD settings (same format)
- Session resumption (same format)
- Function calling (same format)

### Phase 5: Testing

1. **Unit Tests**
   - Token generation
   - Client initialization
   - Voice selection

2. **Integration Tests**
   - Full conversation flow
   - Session resumption
   - Reconnection handling

3. **Load Tests**
   - Multiple concurrent sessions
   - Token refresh under load

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/geminiDirectClient.ts` | Update client initialization (~10 lines) |
| `src/services/tokenService.ts` | New endpoint for access tokens (~20 lines) |
| `src/types/gemini.ts` | Add VertexAccessToken type (~6 lines) |
| `functions/src/index.ts` | New generateVertexAccessToken function (~30 lines) |

**Total estimated changes:** ~70 lines of code

## Environment Variables

**New variables needed:**

```env
# Cloud Function
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Optional: Service account key path (if not using default credentials)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Rollback Plan

1. Keep current Gemini API code in separate branch
2. Feature flag to switch between backends
3. Monitor error rates after deployment
4. Rollback if error rate > 5%

## Timeline Estimate

| Phase | Duration |
|-------|----------|
| GCP Setup | 1 hour |
| Backend Changes | 2 hours |
| Frontend Changes | 1 hour |
| Testing | 2 hours |
| Deployment | 1 hour |
| **Total** | **~7 hours** |

## Cost Impact

**No additional cost** - Vertex AI pricing is identical to Gemini API:

| Token Type | Price per 1M |
|------------|--------------|
| Text input | $0.50 |
| Audio input | $3.00 |
| Text output | $2.00 |
| Audio output | $12.00 |

## Decision Checklist

Before proceeding, confirm:

- [ ] GCP project with billing enabled
- [ ] Vertex AI API quota sufficient for expected load
- [ ] Team familiar with GCP IAM and service accounts
- [ ] Monitoring/alerting set up for new endpoints

## References

- [Vertex AI Live API Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api)
- [Configure Language and Voice](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api/configure-language-voice)
- [js-genai SDK](https://github.com/googleapis/js-genai)
- [Vertex AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
