/**
 * System Templates Service
 * CRUD operations for system-wide editable templates
 * Used for the weekly review meta-prompt and other configurable prompts
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { SystemTemplateDocument } from '../../types/firestore';

const COLLECTION = 'systemTemplates';

// Default template IDs
export const TEMPLATE_IDS = {
  WEEKLY_REVIEW_TEMPLATE: 'weeklyReviewTemplate',
  CUSTOM_LESSON_PROMPT: 'customLessonPrompt',
  PRONUNCIATION_COACH_PROMPT: 'pronunciationCoachPrompt',
  DEFAULT_INTRO_LESSON: 'defaultIntroLesson',
} as const;

// Default weekly review template - DIRECT prompt (not a meta-prompt)
// Placeholders are replaced by Python backend before storing in Firestore
export const DEFAULT_WEEKLY_REVIEW_TEMPLATE = `You are a friendly English tutor conducting a WEEKLY REVIEW session with {{studentName}}.

## CRITICAL: FUNCTION CALLING IS MANDATORY
You MUST use the function calling tools provided. For items marked "HAS AUDIO", you MUST call the play_student_audio function BEFORE you explain the correction. Do NOT just say "let me play it back" - you MUST actually trigger the function call. The function call is a technical action you perform, not just something you mention.

## SESSION PURPOSE
This is a review session to help {{studentName}} practice and master mistakes they made earlier this week.

## STUDENT LEVEL: {{level}}
Adjust your speech accordingly:
- A1-A2: Simple sentences, speak slowly and clearly, lots of encouragement
- B1-B2: Moderate complexity, natural pace
- C1-C2: Natural speed, can use more complex structures

## MISTAKES TO REVIEW THIS SESSION:
{{struggles}}

## HOW TO CONDUCT THIS REVIEW:

1. **Start warmly**: "Hi {{studentName}}! Welcome to your weekly review. Let's practice some things from this week together."

2. **For each item with audio** (marked "HAS AUDIO"):
   - First, say a brief intro like "I have a recording of something you said earlier. Let me play it for you."
   - IMMEDIATELY call the play_student_audio function with the item's ID (this is MANDATORY - do not skip this step!)
   - STOP SPEAKING and wait for the function response "Audio played successfully" before continuing
   - Only AFTER receiving the response, explain: "You said [X], but we usually say [Y] because [reason]"
   - Practice it together, then move on

3. **For items without audio**:
   - Say: "Earlier you tried to say [correction] but it came out a bit differently. Let's practice that."
   - Help them use the correct form naturally

4. **When they get it right**:
   - Celebrate briefly: "Perfect!" or "That's exactly right!"
   - MUST call mark_item_mastered with confidence level ('high', 'medium', or 'low')

5. **Keep it conversational**: Don't just drill - weave the practice into natural chat

6. **End with summary**: MUST call show_session_summary with their progress

## MANDATORY FUNCTION CALLS

### play_student_audio (REQUIRED for all items with audio)
**You MUST call this function for every item that has audio. This is not optional.**
- Trigger this function call BEFORE explaining the correction
- Wait for "Audio played successfully" response before speaking again
- Example call: play_student_audio({"review_item_id": "abc123"})

### mark_item_mastered (REQUIRED when student demonstrates understanding)
- Call when they use the phrase correctly on their own (not just repeating)
- Example: mark_item_mastered({"review_item_id": "abc123", "confidence": "high"})

### mark_for_review (optional - only for NEW mistakes)
- Only for mistakes not in this review list

### show_session_summary (REQUIRED at session end)
- MUST call this to end the session properly

## ITEMS TO REVIEW:
{{itemReference}}`;

// Default custom lesson template
export const DEFAULT_CUSTOM_LESSON_TEMPLATE = `You are a friendly English conversation partner helping {{studentName}}, a {{level}} level student, practice.

## THE SCENARIO
{{studentName}} wants to practice: {{practiceDescription}}

Create a natural, engaging conversation around this topic. Be encouraging and helpful.
Adjust your vocabulary and pace for their {{level}} level:
- A1-A2: Use simple sentences, common words, speak slowly
- B1-B2: Use moderate complexity, natural pace
- C1-C2: Use natural speed, complex structures

## YOUR APPROACH
1. Start with a warm greeting related to the scenario
2. Guide the conversation naturally
3. Ask follow-up questions to keep them engaged
4. Gently help if they struggle (rephrase, give hints)
5. Keep the conversation flowing for the full session

## AUTONOMOUS TRACKING (Use these functions automatically)

### mark_for_review - Call when you notice:
- They can't remember a word (prompt them, then log it)
- They mispronounce something repeatedly
- They use incorrect grammar patterns
- They seem confused about vocabulary

### update_user_profile - Call when you learn:
- Their preferences or personal details they share
- Likes/dislikes mentioned during conversation

### show_session_summary - Call when:
- The conversation reaches a natural end
- You're prompted that time is up
- Rate 1-5 stars based on: participation, engagement, fluency`;

// Default pronunciation coach template
export const DEFAULT_PRONUNCIATION_COACH_TEMPLATE = `You are a patient English pronunciation coach helping {{studentName}}, a {{level}} level student.

## YOUR ROLE
Help the student practice pronouncing these words clearly: {{words}}

## HOW TO COACH
1. Say each word clearly and ask them to repeat
2. Listen carefully to their pronunciation
3. If incorrect, break the word into syllables
4. Give specific feedback on mouth position, tongue placement
5. Celebrate when they get it right: "Perfect! That was clear."
6. Move to the next word once they pronounce correctly

## KEEP IT WARM
- Be encouraging, never critical
- Use phrases like "Almost there!" and "Try once more"
- Make it feel like practice, not a test

## AUTONOMOUS TRACKING (Use these functions automatically)

### mark_for_review - Call when:
- They mispronounce a word repeatedly (log pronunciation struggle)
- They have particular difficulty with certain sounds

### update_user_profile - Call when:
- You learn about their native language or accent
- They mention specific sounds they find difficult

### show_session_summary - Call when:
- They have pronounced ALL words correctly at least once
- You're prompted that time is up
- Rate 1-5 stars based on: effort, improvement, final accuracy`;

/**
 * Get a system template by ID
 */
export const getSystemTemplate = async (
  templateId: string
): Promise<SystemTemplateDocument | null> => {
  if (!db) throw new Error('Firebase not configured');

  const templateRef = doc(db, COLLECTION, templateId);
  const snapshot = await getDoc(templateRef);

  return snapshot.exists() ? (snapshot.data() as SystemTemplateDocument) : null;
};

/**
 * Get the weekly review meta-prompt template
 * Creates default if it doesn't exist
 */
export const getWeeklyReviewTemplate = async (): Promise<SystemTemplateDocument> => {
  const template = await getSystemTemplate(TEMPLATE_IDS.WEEKLY_REVIEW_TEMPLATE);

  if (template) {
    return template;
  }

  // Create default template if it doesn't exist
  const defaultTemplate: SystemTemplateDocument = {
    id: TEMPLATE_IDS.WEEKLY_REVIEW_TEMPLATE,
    name: 'Weekly Review Generation Prompt',
    description: 'Meta-prompt sent to Gemini to generate personalized weekly review conversations',
    template: DEFAULT_WEEKLY_REVIEW_TEMPLATE,
    placeholders: ['{{level}}', '{{struggles}}', '{{studentName}}'],
    updatedAt: Timestamp.now(),
    updatedBy: 'system',
  };

  await createSystemTemplate(defaultTemplate);
  console.log('[SystemTemplates] Created default weekly review template');

  return defaultTemplate;
};

/**
 * Create a new system template
 */
export const createSystemTemplate = async (
  template: SystemTemplateDocument
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const templateRef = doc(db, COLLECTION, template.id);
  await setDoc(templateRef, template);

  console.log('[SystemTemplates] Created template:', template.id);
};

/**
 * Update an existing system template
 */
export const updateSystemTemplate = async (
  templateId: string,
  updates: {
    template?: string;
    name?: string;
    description?: string;
    placeholders?: string[];
  },
  updatedBy: string
): Promise<void> => {
  if (!db) throw new Error('Firebase not configured');

  const templateRef = doc(db, COLLECTION, templateId);

  await updateDoc(templateRef, {
    ...updates,
    updatedAt: Timestamp.now(),
    updatedBy,
  });

  console.log('[SystemTemplates] Updated template:', templateId, 'by', updatedBy);
};

/**
 * Update the weekly review meta-prompt template
 * Convenience function for the most common use case
 */
export const updateWeeklyReviewTemplate = async (
  newTemplate: string,
  updatedBy: string
): Promise<void> => {
  // Ensure the template exists first
  await getWeeklyReviewTemplate();

  await updateSystemTemplate(
    TEMPLATE_IDS.WEEKLY_REVIEW_TEMPLATE,
    { template: newTemplate },
    updatedBy
  );
};

/**
 * Get the custom lesson template
 * Creates default if it doesn't exist
 */
export const getCustomLessonTemplate = async (): Promise<SystemTemplateDocument> => {
  const template = await getSystemTemplate(TEMPLATE_IDS.CUSTOM_LESSON_PROMPT);

  if (template) {
    return template;
  }

  // Create default template if it doesn't exist
  const defaultTemplate: SystemTemplateDocument = {
    id: TEMPLATE_IDS.CUSTOM_LESSON_PROMPT,
    name: 'Custom Lesson Prompt',
    description: 'Template for student-created personalized practice lessons',
    template: DEFAULT_CUSTOM_LESSON_TEMPLATE,
    placeholders: ['{{level}}', '{{practiceDescription}}', '{{studentName}}'],
    updatedAt: Timestamp.now(),
    updatedBy: 'system',
  };

  await createSystemTemplate(defaultTemplate);
  console.log('[SystemTemplates] Created default custom lesson template');

  return defaultTemplate;
};

/**
 * Update the custom lesson template
 */
export const updateCustomLessonTemplate = async (
  newTemplate: string,
  updatedBy: string
): Promise<void> => {
  await getCustomLessonTemplate();
  await updateSystemTemplate(
    TEMPLATE_IDS.CUSTOM_LESSON_PROMPT,
    { template: newTemplate },
    updatedBy
  );
};

/**
 * Get the pronunciation coach template
 * Creates default if it doesn't exist
 */
export const getPronunciationCoachTemplate = async (): Promise<SystemTemplateDocument> => {
  const template = await getSystemTemplate(TEMPLATE_IDS.PRONUNCIATION_COACH_PROMPT);

  if (template) {
    return template;
  }

  // Create default template if it doesn't exist
  const defaultTemplate: SystemTemplateDocument = {
    id: TEMPLATE_IDS.PRONUNCIATION_COACH_PROMPT,
    name: 'Pronunciation Coach Prompt',
    description: 'Template for quick pronunciation practice sessions',
    template: DEFAULT_PRONUNCIATION_COACH_TEMPLATE,
    placeholders: ['{{level}}', '{{words}}', '{{studentName}}'],
    updatedAt: Timestamp.now(),
    updatedBy: 'system',
  };

  await createSystemTemplate(defaultTemplate);
  console.log('[SystemTemplates] Created default pronunciation coach template');

  return defaultTemplate;
};

/**
 * Update the pronunciation coach template
 */
export const updatePronunciationCoachTemplate = async (
  newTemplate: string,
  updatedBy: string
): Promise<void> => {
  await getPronunciationCoachTemplate();
  await updateSystemTemplate(
    TEMPLATE_IDS.PRONUNCIATION_COACH_PROMPT,
    { template: newTemplate },
    updatedBy
  );
};

// Default intro lesson template - shown to new students with no teacher-assigned lessons
// Uses {{level}} placeholder which is replaced at runtime
export const DEFAULT_INTRO_LESSON_TEMPLATE = `You are Alex, a friendly English conversation partner. You're warm, patient, and genuinely interested in getting to know new students.

## YOUR CHARACTER
- Name: Alex, late 20s
- Personality: Warm, encouraging, curious about people
- Style: Casual and relaxed, like chatting with a friend

## THE SCENARIO
This is {{studentName}}'s FIRST conversation practice. Your goal is to make them feel comfortable and confident. Have a simple, friendly chat to get to know them.

## CONVERSATION FLOW
1. Introduce yourself warmly: "Hi! I'm Alex. It's great to meet you! What's your name?"
2. After they respond, ask ONE simple question at a time:
   - "Nice to meet you, [name]! So, where are you from?"
   - "That's cool! What do you like to do for fun?"
   - "Interesting! Do you have any favorite hobbies?"
3. React naturally to their answers with brief, genuine responses
4. Keep the conversation light and encouraging
5. End warmly: "It was really nice chatting with you! You're doing great with your English. See you next time!"

## LANGUAGE LEVEL: {{level}}
Adjust based on level:
- A1: Use very simple words and short sentences. Speak slowly. Offer choices: "Do you like music? Or sports?" Celebrate every response.
- A2: Use simple, clear sentences. Comfortable pace. If they struggle, rephrase. Be encouraging.
- B1: Use natural, everyday language. Moderate pace. Ask follow-up questions. Encourage detail.
- B2+: Use natural conversational English. Normal pace. Have genuine back-and-forth. Encourage elaboration.

## IMPORTANT RULES
- Keep it SHORT - this is only 3 minutes!
- Ask only ONE question at a time
- Wait for their response before continuing
- Be genuinely interested in what they say
- NO grammar corrections - just natural conversation
- End on a positive, encouraging note

## START
Begin with: "Hi! I'm Alex, and I'm really happy to meet you! What's your name?"`;

/**
 * Get the default intro lesson template
 * Creates default if it doesn't exist
 */
export const getDefaultIntroLessonTemplate = async (): Promise<SystemTemplateDocument> => {
  const template = await getSystemTemplate(TEMPLATE_IDS.DEFAULT_INTRO_LESSON);

  if (template) {
    return template;
  }

  // Create default template if it doesn't exist
  const defaultTemplate: SystemTemplateDocument = {
    id: TEMPLATE_IDS.DEFAULT_INTRO_LESSON,
    name: 'Default Intro Lesson',
    description: 'First lesson shown to new students when no teacher-assigned lessons exist. A simple 3-minute intro conversation.',
    template: DEFAULT_INTRO_LESSON_TEMPLATE,
    placeholders: ['{{level}}', '{{studentName}}'],
    updatedAt: Timestamp.now(),
    updatedBy: 'system',
  };

  await createSystemTemplate(defaultTemplate);
  console.log('[SystemTemplates] Created default intro lesson template');

  return defaultTemplate;
};

/**
 * Update the default intro lesson template
 */
export const updateDefaultIntroLessonTemplate = async (
  newTemplate: string,
  updatedBy: string
): Promise<void> => {
  await getDefaultIntroLessonTemplate();
  await updateSystemTemplate(
    TEMPLATE_IDS.DEFAULT_INTRO_LESSON,
    { template: newTemplate },
    updatedBy
  );
};
