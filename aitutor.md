Build in flutter but will build for web first, will use firebase, and Google Cloud.

Product Requirements Document (PRD): AI English Contextual Tutor
1. Executive Summary
An AI-powered mobile application designed for Ukrainian students to practice English speaking skills. The core differentiator is Teacher-Led Context: teachers create scenarios (prompts) based on recent lessons, and the AI acts as a roleplay partner.
Target Audience: Ukrainian students (Levels A1-C2).
Key Tech: Gemini 3.0 Flash (Multimodal Live API).
Primary Interaction: Voice-first roleplay with real-time text/visual support.

2. Technical Architecture
AI Model: Gemini 3.0 Flash (chosen for low latency and multimodal capabilities).
Connection Type: WebSocket / Real-time API (to support interruptibility and "live" conversation feel).
Audio Stack:
Input: Speech-to-Text (STT) optimized for English (with Ukrainian accent tolerance) and Ukrainian.
Output: Text-to-Speech (TTS) with "Native English" voice for the Actor persona and "Supportive" voice for the Tutor persona.
Backend Logic: Dynamic System Prompt Injection (Server-side).

3. User Roles & Workflows
A. The Teacher (Admin Dashboard)
Goal: Create a practice mission in <30 seconds.
Features:
Create Mission Interface:
Topic/Scenario: Text Input (e.g., "Ordering coffee at a rude cafe").
Tone: Dropdown (Friendly, Strict, Fast, Confused).
Target Vocabulary: Input field for 3-5 specific words (optional).
Visual Context: Drag & Drop Image Upload (Optional).
Logic: If Image = Null, trigger AI to generate a text-based setting description as the first message.
Assign to Group: Select checkbox (e.g., "Group A - Beginners").
Class Pulse Report:
View completion rates.
View "Stuck Point Heatmap" (common errors across the class).
B. The Student (Mobile App)
Goal: Practice speaking without fear.
Features:
Onboarding:
Level Slider: User selects proficiency (Beginner A1 $\rightarrow$ Fluent C2). This sets the {STUDENT_LEVEL} variable.
Class Code: Input code to join Teacher’s Group.
The Chat Interface (The "Stage"):
Background: Displays the Teacher's image (or generative emoji wallpaper if no image).
Input: "Push-to-Talk" microphone button.
Output: Dynamic text bubbles + Audio.
The "Whisper" Button (Key Feature):
Interaction: Hold-to-Talk button (distinct color).
Logic: Signals AI to switch context. Input is Ukrainian $\rightarrow$ AI responds in Ukrainian (explanation) $\rightarrow$ AI prompts student to try again in English.

4. AI Logic & Prompt Engineering
Developer Note: The application must dynamically assemble the System Instruction before the session starts.
The Dynamic Prompt Template
Plaintext
**SYSTEM CONFIGURATION**
Role: You are a roleplay actor and a hidden language tutor.
Model Behavior: Gemini 3.0 Flash.

**INPUT VARIABLES**
Scenario: {TEACHER_SCENARIO}
Tone: {TEACHER_TONE}
Proficiency Level: {STUDENT_LEVEL}
Target Vocab: {VOCAB_LIST}
Visual Context: [Image Data Stream]

**OPERATIONAL RULES**
1. **Level Adaptation:**
   - IF Level = A1/A2: Speak slowly, use simple SVO sentences. Wait longer for responses.
   - IF Level = B1/B2: Natural speed, introduce phrasal verbs.
   - IF Level = C1/C2: Native speed, complex grammar, slang.

2. **The "Whisper" Protocol (Language Toggle):**
   - IF input language detects UKRAINIAN:
     - STOP Roleplay.
     - Switch to "Tutor Mode" (Speak Ukrainian).
     - Explain the concept or translate the user's request.
     - End with: "Try saying that in English."
   - IF input language detects ENGLISH:
     - RESUME Roleplay immediately.

3. **Correction Logic (False Friends):**
   - Ignore minor grammar errors that don't hurt meaning.
   - INTERRUPT if user makes a "Ukrainian interference error" (e.g., saying "magazine" for "shop"). Briefly explain the difference in Ukrainian, then resume.

4. **Scenario Handling:**
   - IF Image is provided: Incorporate visual details from the image into your dialogue.
   - IF No Image: Start the chat by vividly describing the setting in 2 sentences.









-----


Screen Specifications
Chat Screen:
Top 30%: Visual Anchor (Teacher's Image or Scenario Title Card).
Middle: Chat bubbles. User bubbles align right; AI bubbles align left.
Bottom Control Bar: Large Mic Button (Center). Small "Whisper" Button (Left). "Hint/Stuck" Button (Right).
Post-Mission Feedback Card (The Debrief):
Outcome: "Mission Successful" (not a grade).
Golden Sentence: The student's best sentence highlighted.
The Upgrade: Split column showing "You Said" vs. "Better Way."
Audio Re-roll: Button to generate synthetic audio of the student's sentence corrected.

6. Edge Cases & Fallbacks
No Image Uploaded:
Dev Action: Frontend must not break. UI displays a placeholder pattern based on keywords (e.g., "Coffee" keyword = Coffee icon background). AI takes over scene-setting via text.
Student stays in Ukrainian too long:
AI Logic: If the student speaks Ukrainian for 3 turns in a row, AI politely says (in Ukrainian): "Let's switch back to English to practice. Ready?"
Silence/No Audio:
UI: If no audio detected for 10s, pulse the Mic button and display a text hint: "Try saying: 'Hello, can you help me?'"


The "Post-Lesson Feedback Card" is the most dangerous screen in the app. If it’s too harsh, the student quits. If it’s too vague, they don't learn.
Since we are targeting Ukrainian students, we need to balance high standards (they want to be correct) with high encouragement (they are often afraid to speak).
Here is the design for the "Mission Debrief" (we call it a Debrief, not a "Report Card," to keep the simulation feel).

The UI Layout: Top-to-Bottom Flow
Imagine a clean, scrolling card that pops up over the chat interface once the mission ends.
1. The "Outcome" Header (The Emotional Hook)
Instead of "Score: 80%," we focus on the communicative goal.
Visual: A large, animated icon (e.g., a Coffee Cup if the mission was a café, or a simple Checkmark).
Text: Dynamic text based on the story outcome.
Success: "Mission Complete: You got the coffee!"
Struggle: "Mission Complete: You got the coffee, but it took some negotiating."
Why: This reinforces that language is a tool to get things done, not just a grammar test.
2. The "Golden Sentence" (Positive Reinforcement)
Before showing errors, we show them their best moment.
Label: "Your Best Line ✨"
Content: The AI selects the most complex or grammatically perfect sentence the student spoke.
AI Comment: "Great use of the present perfect tense here! You sounded very natural."
3. The "Upgrade Zone" (Gentle Corrections)
We don't call this "Mistakes." We call it "Polishing" or "Upgrades." We limit this to top 3 errors to avoid overwhelming them.
The Layout: A split view.
Left (You said): "I need to buy a ticket on the train." (Strikethrough on the error).
Right (Native Speaker): "I need to buy a ticket for the train." (Green highlight).
The "False Friend" Alert:
If they made a Ukrainian-specific error (e.g., "shut the door" vs "close the door"), add a small Ukrainian flag icon 🇺🇦 with a tooltip: "In English, we usually 'close' doors, not 'shut' them in polite contexts."
4. The "Hear the Ideal You" Feature (Gemini 3.0 Magic)
This is the "killer feature" only possible with advanced AI.
Button: "Hear My Response Fixed" 🎧
Action: Gemini takes the student's original voice recording (or uses a similar synthetic voice), fixes the grammar instantly, and plays it back.
Result: The student hears themselves speaking perfect English. This is psychologically powerful for visualization.
5. Vocabulary Tracker
Visual: A simple row of bubbles showing the Teacher's required words.
State:
Green Bubble: "Used!"
Grey Bubble: "Missed."
Teacher Control: If the student misses a key word (e.g., "Prescription"), the AI notes it here: "You managed to buy the medicine without saying 'Prescription', but try to use it next time."

The Teacher's View (The "Classroom Pulse")
The teacher doesn't need to see every chat. They get a "Pulse Report" for the whole group.
The "Stuck Point" Heatmap:
"60% of Group A struggled with the Future Tense in this scenario."
Action: Teacher knows exactly what to review in the next live class.
Engagement Score:
Who spoke the most? Who used the "Whisper" button the most? (High Whisper usage = low confidence).

Summary of the Feedback Experience
Component
Student Sees
Purpose
Outcome Header
"Mission Complete: Ticket Purchased"
Validates they solved the real-world problem.
Golden Sentence
Their best recorded sentence.
boosts confidence before criticism.
Upgrade Zone
"You said X" -> "Native Actor would say Y"
Specific, actionable grammar fixes.
Audio Re-roll
Hearing the sentence spoken perfectly.
Auditory learning & accent training.
Vocab Badges
Which required words they hit.
Gamification of vocabulary.



Theme:

Global dark theme defaults to a near-black background (#242424) with semi-opaque white text, and uses a blue-violet accent for links (#646cff, hovering to #535bf2). Buttons in dark mode use a charcoal fill (#1a1a1a) and pick up the same link accent on hover.
Light mode flips to a white background with deep gray text (#213547), lightens the link hover to #747bff, and changes the button fill to a soft gray (#f9f9f9)

Feel free to use other colors like a world class designer would if you want.


Building for **Flutter Web** changes the game significantly. The web browser has strict security sandboxes (CORS, AudioContext policies) and does not support the same raw audio plugins as mobile.

Most standard Flutter audio packages **fail** at low-latency streaming on the web. They try to record to a file (Blob) first, which introduces a 2-3 second delay. For a "real-time" conversation, this is unacceptable.

Here is the **Web-First Architecture** & **Custom Audio Stack** required to make this work.

-----

### 1\. The Web Architecture

  * **Protocol:** WebSockets (`wss://`). HTTP/REST is too slow for audio streaming.
  * **Audio Format:**
      * **Input (Mic):** Browser default is 44.1kHz or 48kHz. We must **downsample** to **16kHz PCM** *in the browser* before sending to save bandwidth.
      * **Output (Speaker):** Gemini sends **24kHz PCM**. We must play this natively using the Web Audio API.
  * **Tech Stack:**
      * **Flutter:** UI & Logic.
      * **Dart Interop (`dart:js_interop`):** To talk to the browser's native audio engine.
      * **Cloud Run Proxy:** (Same as before) To hide API keys and manage the connection.

-----

### 2\. The "Hard Part": Web Audio Interop

Since generic packages are unreliable for *streaming* raw PCM on the web, you must hand this **JavaScript/Dart Bridge** to your developer. It uses the browser's `AudioContext` directly.

#### A. The JavaScript Layer (`web/audio_processor.js`)

*Add this file to your `web/` folder and include it in `index.html`.*

```javascript
// web/audio_processor.js

class AudioHandler {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        this.nextStartTime = 0;
        this.processor = null;
        this.inputStream = null;
    }

    // --- PLAYBACK (Gemini -> User) ---
    // Schedules raw PCM chunks (16-bit Int) to play smoothly
    playChunk(base64Data) {
        const raw = atob(base64Data);
        const rawLength = raw.length / 2;
        const arrayBuffer = new Float32Array(rawLength);

        // Convert 16-bit Int PCM to Float32 (Web Audio Standard)
        for (let i = 0; i < rawLength; i++) {
            const int16 = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
            // Normalize between -1.0 and 1.0
            const sample = (int16 >= 32768 ? int16 - 65536 : int16) / 32768.0;
            arrayBuffer[i] = sample;
        }

        const buffer = this.audioContext.createBuffer(1, rawLength, 24000);
        buffer.getChannelData(0).set(arrayBuffer);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);

        // Ensure smooth playback without gaps
        if (this.nextStartTime < this.audioContext.currentTime) {
            this.nextStartTime = this.audioContext.currentTime;
        }
        source.start(this.nextStartTime);
        this.nextStartTime += buffer.duration;
    }

    // --- RECORDING (User -> Gemini) ---
    async startRecording(onDataCallback) {
        // Ask for Mic Permission
        this.inputStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // We need to record at 16kHz for Gemini
        // Note: Browsers run at 44.1/48k, so we use a ScriptProcessor to downsample manually
        // In Prod: Use AudioWorklet for better performance, but ScriptProcessor is easier for MVP.
        const context = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const source = context.createMediaStreamSource(this.inputStream);
        
        // Buffer size 4096 gives ~250ms chunks.
        this.processor = context.createScriptProcessor(4096, 1, 1);
        
        source.connect(this.processor);
        this.processor.connect(context.destination);

        this.processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert Float32 to Int16 PCM
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                let s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            // Send back to Flutter as Base64
            const buffer = new Uint8Array(pcm16.buffer);
            let binary = '';
            const len = buffer.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(buffer[i]);
            }
            onDataCallback(btoa(binary));
        };
    }

    stopRecording() {
        if (this.inputStream) {
            this.inputStream.getTracks().forEach(track => track.stop());
        }
        if (this.processor) {
            this.processor.disconnect();
        }
    }
}

window.audioHandler = new AudioHandler();
```

#### B. The Flutter Bridge (`lib/services/web_audio_bridge.dart`)

*This allows your Dart code to call the JavaScript functions above.*

```dart
import 'dart:async';
import 'dart:js_interop';
import 'package:web/web.dart' as web;

// Define the JavaScript class interface
@JS('window.audioHandler')
external AudioHandlerJs get audioHandler;

@JS()
extension type AudioHandlerJs._(JSObject _) implements JSObject {
  external void playChunk(String base64Data);
  external void stopRecording();
  external JSPromise startRecording(JSFunction callback);
}

class WebAudioManager {
  final StreamController<String> _audioStreamController = StreamController();

  Stream<String> get audioStream => _audioStreamController.stream;

  Future<void> startRecording() async {
    // Pass a Dart function to JS to receive audio chunks
    final callback = (String base64Chunk) {
      _audioStreamController.add(base64Chunk);
    }.toJS;
    
    await audioHandler.startRecording(callback).toDart;
  }

  void playAudioChunk(String base64Audio) {
    audioHandler.playChunk(base64Audio);
  }

  void stop() {
    audioHandler.stopRecording();
  }
}
```

-----

### 3\. Implementation Checklist for Developer

1.  **Index.html:** Add `<script src="audio_processor.js"></script>` to the `web/` folder.
2.  **Dependencies:** Add `web: ^0.5.0` to `pubspec.yaml` (replaces `dart:html`).
3.  **CORS & Cloud Run:**
      * Since your Flutter Web App runs on a browser (e.g., `localhost:3000` or `firebaseapp.com`) and connects to Cloud Run, you **must** configure CORS on the Cloud Run server if you use HTTP, but strictly speaking, WebSockets (`ws://`) bypass standard CORS. However, ensure your Cloud Run service allows "Unauthenticated Invocations" for the MVP.
4.  **Auto-Play Policy:**
      * Browsers block audio ("The AudioContext was not allowed to start") until the user interacts with the page.
      * *Fix:* Ensure the connection starts only *after* the user clicks the "Start Mission" button. Do not start it on page load.

### 4\. Why this approach?

  * **Standard Packages:** `flutter_sound` or `record` often default to recording `.webm` or `.wav` files on web. Gemini **rejects** these formats in the Live API; it strictly demands **PCM 16kHz**.
  * **Latency:** This JavaScript approach converts audio instantly in small buffers (low latency). File-based approaches wait for the file to finish saving (high latency).
  * **Sample Rate:** This explicitly forces the browser to record at 16,000Hz, preventing the "Chipmunk Effect" (where 44.1kHz audio is interpreted as 16kHz, making it sound super slow/deep) or the reverse.






4. The "Agentic" Homework (Teacher Value)
Since the teacher is the "owner," we need to save her time.
The Feature: "Auto-Gap Analysis."
How it works:
After 20 students finish the "Cafe" mission, Gemini 3.0 analyzes the aggregate data.
It sends a notification to the Teacher: "80% of your class failed to use the Future Tense correctly. 60% confused 'kitchen' and 'chicken'. Would you like me to generate a 5-minute review exercise for tomorrow's class covering these two topics?"
Value: The app becomes her Teaching Assistant, not just a homework tool.

2. The "Politeness Filter" (Cultural Coaching)
Ukrainian is often more direct than English. A grammatically correct sentence can still sound "rude" to a native English speaker.
The Feature: A "Politeness Meter" that sits next to the grammar check.
Scenario:
Student says: "Give me the menu." (Grammatically perfect).
AI "Politeness" Feedback: "This is correct, but in a London cafe, this sounds aggressive 😠. Try: 'Could I please have the menu?' 🍵"
Value: This teaches culture, not just language. This is what students pay high hourly rates for with human tutors.

