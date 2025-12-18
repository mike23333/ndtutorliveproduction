# Voice Preview Audio Files

This directory should contain MP3 preview files for each Gemini voice.

## Required Files

Generate these 8 MP3 files, each saying: **"Hello! I'm ready to help you practice English."**

| File | Voice ID |
|------|----------|
| puck.mp3 | Puck |
| charon.mp3 | Charon |
| kore.mp3 | Kore |
| fenrir.mp3 | Fenrir |
| aoede.mp3 | Aoede |
| leda.mp3 | Leda |
| orus.mp3 | Orus |
| zephyr.mp3 | Zephyr |

## How to Generate

### Option 1: Use Google Cloud Text-to-Speech

```bash
# Install gcloud CLI and authenticate
# Then use the Journey/Polyglot voices or similar

for voice in puck charon kore fenrir aoede leda orus zephyr; do
  gcloud text-to-speech synthesize-text \
    --text="Hello! I'm ready to help you practice English." \
    --voice="en-US-Journey-D" \
    --audio-encoding=MP3 \
    --output="${voice}.mp3"
done
```

### Option 2: Use Gemini Live API

Create a simple script that connects to Gemini Live API with each voice and records the output.

### Option 3: Manual Recording

Record the phrase with different voice characteristics that match each personality:
- **Puck**: Conversational, friendly
- **Charon**: Deep, authoritative
- **Kore**: Neutral, professional
- **Fenrir**: Warm, approachable
- **Aoede**: Melodic, expressive
- **Leda**: Gentle, patient
- **Orus**: Clear, articulate
- **Zephyr**: Light, encouraging

## File Specifications

- Format: MP3
- Duration: ~3 seconds
- Sample Rate: 44.1kHz or 48kHz
- Bit Rate: 128kbps or higher
