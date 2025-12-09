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
  WEEKLY_REVIEW_META_PROMPT: 'weeklyReviewMetaPrompt',
  CUSTOM_LESSON_PROMPT: 'customLessonPrompt',
  PRONUNCIATION_COACH_PROMPT: 'pronunciationCoachPrompt',
} as const;

// Default weekly review meta-prompt template
export const DEFAULT_WEEKLY_REVIEW_TEMPLATE = `Generate a 5-minute conversational English practice system prompt for {{studentName}}.

The student's English level is: {{level}} (CEFR scale)
Adjust vocabulary, sentence complexity, and pace accordingly:
- A1-A2: Use simple sentences, common words, speak slowly and clearly
- B1-B2: Use moderate complexity, introduce idioms gradually, natural pace
- C1-C2: Use natural speed, complex structures, nuanced vocabulary

The student struggled with these words/phrases this week:
{{struggles}}

Create a system prompt for an AI tutor that will:
1. Have a natural conversation (restaurant, cafe, travel, or everyday scenario)
2. Organically include opportunities to use these words
3. NOT quiz or drill - just natural conversation
4. Gently help if they struggle again (rephrase, give hints)
5. Celebrate when they use the words correctly (brief acknowledgment)
6. Keep it warm and encouraging throughout

The prompt should define:
- A specific persona with a name and friendly role
- A realistic scenario that naturally includes the target vocabulary
- How to introduce each word naturally in conversation
- How to provide gentle scaffolding if they struggle

IMPORTANT: The prompt MUST include this exact section for autonomous function calling:

## AUTONOMOUS TRACKING (Use these functions automatically)

### save_struggle_item - Call when you notice:
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
- Rate 1-5 stars based on: participation, vocabulary use, improvement shown

Return only the system prompt, no explanation or preamble.`;

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

### save_struggle_item - Call when you notice:
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

### save_struggle_item - Call when:
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
  const template = await getSystemTemplate(TEMPLATE_IDS.WEEKLY_REVIEW_META_PROMPT);

  if (template) {
    return template;
  }

  // Create default template if it doesn't exist
  const defaultTemplate: SystemTemplateDocument = {
    id: TEMPLATE_IDS.WEEKLY_REVIEW_META_PROMPT,
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
    TEMPLATE_IDS.WEEKLY_REVIEW_META_PROMPT,
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

