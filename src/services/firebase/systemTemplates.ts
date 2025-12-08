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
} as const;

// Default weekly review meta-prompt template
const DEFAULT_WEEKLY_REVIEW_TEMPLATE = `Generate a 5-minute conversational English practice system prompt.

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
    placeholders: ['{{level}}', '{{struggles}}'],
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
