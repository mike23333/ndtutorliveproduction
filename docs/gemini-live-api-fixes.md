# Gemini Live API - Self-Response & Turn-Taking Issues

## Problem Summary

The Gemini Live Speech API sometimes exhibits problematic behavior where:
- Gemini answers its own questions without user input
- Responses are cut off mid-sentence
- Responses restart from the beginning
- Other unpredictable "weird" behaviors occur

## Root Causes

### 1. Audio Echo/Feedback Loop
The AI's audio output is picked up by the microphone, causing Gemini to "hear itself" and interpret it as user speech.

**Google's recommendation:** *"To prevent the model from interrupting itself, use headphones."*

### 2. High VAD Sensitivity
Current configuration in `src/services/geminiDirectClient.ts`:
```typescript
automaticActivityDetection: {
  disabled: false,
  startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
  endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
  prefixPaddingMs: 200,
  silenceDurationMs: 500
}
```

High sensitivity increases responsiveness but also increases false positives from ambient noise, device sounds, or echo.

### 3. Known Server-Side Bugs

| Issue | Description | Status |
|-------|-------------|--------|
| [#952](https://github.com/google-gemini/cookbook/issues/952) | API returns multiple chunks or restarts answers in AUDIO mode | Open |
| [#707](https://github.com/googleapis/js-genai/issues/707) | Premature `turnComplete` despite incomplete content | P2 Bug |
| [#117](https://github.com/google-gemini/live-api-web-console/issues/117) | Native audio model stops midway while speaking | Open |

## Recommended Solutions

### Solution 1: Auto-Mute During AI Playback (Recommended)
Automatically mute the microphone while Gemini is speaking to prevent echo feedback.

**Location:** `src/hooks/useGeminiChat.ts`

```typescript
// In the connect callback configuration, add auto-mute logic:
onAudio: (audioData: ArrayBuffer) => {
  // Auto-mute when AI starts speaking
  if (!isMuted) {
    setIsMuted(true);
  }
  playAudioResponse(audioData);
},
onTurnComplete: () => {
  // Auto-unmute when AI finishes speaking
  setIsMuted(false);
  // ... existing code
}
```

### Solution 2: Lower VAD Sensitivity
Reduce false positive detections by lowering sensitivity.

**Location:** `src/services/geminiDirectClient.ts:126-132`

```typescript
realtimeInputConfig: {
  automaticActivityDetection: {
    disabled: false,
    startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',  // Changed from HIGH
    endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',      // Changed from HIGH
    prefixPaddingMs: 200,
    silenceDurationMs: 1000  // Increased from 500
  }
}
```

### Solution 3: Manual VAD Control (Push-to-Talk)
Disable automatic VAD entirely and implement manual turn control.

**Location:** `src/services/geminiDirectClient.ts`

```typescript
realtimeInputConfig: {
  automaticActivityDetection: {
    disabled: true  // Disable automatic detection
  }
}
```

Then send manual signals:
```typescript
// When user starts speaking
await session.send({ activityStart: {} });

// When user stops speaking
await session.send({ activityEnd: {} });
```

### Solution 4: Increase Silence Duration
Give more time before considering a turn complete.

```typescript
silenceDurationMs: 1500  // 1.5 seconds instead of 500ms
```

### Solution 5: Client-Side Echo Cancellation
Use Web Audio API's echo cancellation when requesting microphone access.

**Location:** `src/services/webAudioBridge.ts` (or wherever getUserMedia is called)

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
});
```

## Implementation Priority

| Priority | Solution | Effort | Impact |
|----------|----------|--------|--------|
| 1 | Auto-mute during playback | Low | High |
| 2 | Enable echo cancellation | Low | Medium |
| 3 | Lower VAD sensitivity | Low | Medium |
| 4 | Increase silence duration | Low | Low |
| 5 | Manual VAD (push-to-talk) | Medium | High |

## User Guidance

Consider adding a tooltip or help text recommending users:
- Use headphones to prevent audio feedback
- Speak clearly and pause between sentences
- Avoid background noise

## Recommended Settings for Language Learners

English learners have specific needs that differ from native speakers:
- **Slower speech** - they're translating in their head
- **Longer pauses** - thinking of vocabulary/grammar
- **Hesitation sounds** - "um", "uh", "err" while formulating
- **False starts** - beginning a sentence, stopping, restarting

### Optimal Configuration

```typescript
realtimeInputConfig: {
  automaticActivityDetection: {
    disabled: false,
    startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',   // Avoid triggering on hesitation sounds
    endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',       // Don't cut off during thinking pauses
    prefixPaddingMs: 300,                                 // Capture slightly more lead-in
    silenceDurationMs: 1500                               // 1.5 seconds - gives time to think
  }
}
```

### Setting Rationale

| Setting | Value | Why |
|---------|-------|-----|
| Start sensitivity | LOW | Prevents "um/uh" from triggering premature turn start |
| End sensitivity | LOW | Doesn't cut them off during mid-thought pauses |
| Prefix padding | 300ms | Captures the beginning of words (learners sometimes start quietly) |
| Silence duration | 1500ms | Gives 1.5 seconds to think - crucial for formulating in L2 |

### Level-Based Configuration (Optional)

Adjust silence duration based on student proficiency level:

| Level | silenceDurationMs | Reasoning |
|-------|-------------------|-----------|
| A1-A2 (Beginner) | 2000-2500ms | Need most thinking time |
| B1-B2 (Intermediate) | 1500ms | Moderate pause tolerance |
| C1-C2 (Advanced) | 1000ms | More fluent, less pause needed |

**Implementation idea:** Read the student's level from `roleConfig.level` and dynamically set `silenceDurationMs`:

```typescript
const getSilenceDuration = (level: string): number => {
  switch (level) {
    case 'A1':
    case 'A2':
      return 2500;
    case 'B1':
    case 'B2':
      return 1500;
    case 'C1':
    case 'C2':
      return 1000;
    default:
      return 1500;
  }
};
```

## References

- [Gemini Live API Capabilities Guide](https://ai.google.dev/gemini-api/docs/live-guide)
- [Get Started with Live API](https://ai.google.dev/gemini-api/docs/live)
- [Interactive Conversations Guide](https://cloud.google.com/vertex-ai/generative-ai/docs/live-api/streamed-conversations)
- [GitHub Issue #952 - Multiple chunks/restarting](https://github.com/google-gemini/cookbook/issues/952)
- [GitHub Issue #707 - Premature turnComplete](https://github.com/googleapis/js-genai/issues/707)
- [GitHub Issue #117 - Stops midway](https://github.com/google-gemini/live-api-web-console/issues/117)
