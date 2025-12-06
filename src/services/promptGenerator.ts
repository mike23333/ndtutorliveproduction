/**
 * AI Prompt Generation Service
 * Dynamically generates system prompts based on role configuration
 */

import type { AIRole, StudentLevel, PersonaType, ToneType } from '../types/ai-role';

/**
 * Level descriptions for prompt context
 */
const LEVEL_DESCRIPTIONS: Record<StudentLevel, string> = {
  A1: 'complete beginner with minimal vocabulary (A1 CEFR)',
  A2: 'elementary learner with basic phrases (A2 CEFR)',
  B1: 'intermediate learner who can handle everyday conversations (B1 CEFR)',
  B2: 'upper-intermediate learner with good fluency (B2 CEFR)',
  C1: 'advanced learner with near-native proficiency (C1 CEFR)',
  C2: 'mastery-level learner with native-like competency (C2 CEFR)',
};

/**
 * Tone-specific behavior instructions
 */
const TONE_INSTRUCTIONS: Record<ToneType, string> = {
  friendly: 'Be warm, encouraging, and supportive. Use positive reinforcement and smile in your tone.',
  strict: 'Be direct and focused on accuracy. Correct errors immediately but constructively.',
  fast: 'Speak quickly and naturally as a native speaker would. Use colloquialisms and contractions.',
  confused: 'Act confused and need clarification often. This helps the student practice explaining and repeating.',
};

/**
 * Persona-specific role instructions
 */
const PERSONA_INSTRUCTIONS: Record<PersonaType, string> = {
  actor: `You are role-playing a character in a realistic scenario. Stay in character throughout the conversation.
Your goal is to create an immersive, natural dialogue that helps the student practice real-world English.
React naturally to what the student says, make small talk, and create a believable interaction.`,

  tutor: `You are an English tutor helping the student improve their skills.
When the student makes mistakes, gently correct them and explain why.
Provide examples, encourage practice, and adapt your teaching to their level.
When they speak in Ukrainian (whisper mode), respond with helpful translations and explanations in both languages.`,
};

/**
 * Generate level-appropriate vocabulary guidance
 */
function generateVocabularyGuidance(level: StudentLevel, targetVocab?: string[]): string {
  const complexity = level === 'A1' || level === 'A2' ? 'simple, common words' :
                     level === 'B1' || level === 'B2' ? 'everyday vocabulary and some idioms' :
                     'advanced vocabulary, idioms, and nuanced expressions';

  let guidance = `Use ${complexity} appropriate for a ${LEVEL_DESCRIPTIONS[level]}.`;

  if (targetVocab && targetVocab.length > 0) {
    guidance += `\n\nTarget vocabulary to naturally incorporate: ${targetVocab.join(', ')}.`;
    guidance += ' Try to use these words in context and encourage the student to use them too.';
  }

  return guidance;
}

/**
 * Generate sentence complexity guidance
 */
function generateComplexityGuidance(level: StudentLevel): string {
  const guidance: Record<StudentLevel, string> = {
    A1: 'Use very short, simple sentences. Speak slowly and clearly. Repeat key words.',
    A2: 'Use short sentences with basic grammar. Speak clearly with simple structures.',
    B1: 'Use standard conversational sentences. Mix simple and compound sentences.',
    B2: 'Use natural conversation with varied sentence structures. Include some complex sentences.',
    C1: 'Use sophisticated language with complex sentences. Challenge the student with advanced structures.',
    C2: 'Use native-level language with nuanced expressions. Engage at a fully fluent level.',
  };

  return guidance[level];
}

/**
 * Generate correction strategy based on level
 */
function generateCorrectionStrategy(level: StudentLevel, persona: PersonaType): string {
  if (persona === 'tutor') {
    return `When the student makes errors:
- Gently correct mistakes with examples
- Explain grammar rules when needed
- Ask them to repeat correctly
- Provide positive reinforcement
- Adjust correction frequency based on their confidence level`;
  }

  // For actor persona, be more subtle
  const strategy: Record<StudentLevel, string> = {
    A1: 'If they make errors, gently rephrase correctly in your response without explicitly correcting.',
    A2: 'Occasionally model correct usage by rephrasing their mistakes naturally in your replies.',
    B1: 'Subtly correct errors by restating correctly, as a native speaker would in conversation.',
    B2: 'React naturally to errors, sometimes asking for clarification if meaning is unclear.',
    C1: 'Only correct errors that impede understanding, maintaining natural conversation flow.',
    C2: 'Treat errors naturally as you would with any fluent speaker, rarely correcting unless critical.',
  };

  return strategy[level];
}

/**
 * Generate complete system prompt for an AI role
 */
export function generateSystemPrompt(role: AIRole): string {
  const sections: string[] = [];

  // 1. Role and scenario
  sections.push('# YOUR ROLE');
  sections.push(role.systemPrompt);
  if (role.scenario) {
    sections.push(`\nScenario: ${role.scenario}`);
  }

  // 2. Persona instructions
  sections.push('\n# PERSONA BEHAVIOR');
  sections.push(PERSONA_INSTRUCTIONS[role.persona]);

  // 3. Tone
  sections.push('\n# TONE');
  sections.push(TONE_INSTRUCTIONS[role.tone]);

  // 4. Student level
  sections.push('\n# STUDENT LEVEL');
  sections.push(`The student is a ${LEVEL_DESCRIPTIONS[role.level]}.`);
  sections.push(generateComplexityGuidance(role.level));

  // 5. Vocabulary
  sections.push('\n# VOCABULARY');
  sections.push(generateVocabularyGuidance(role.level, role.targetVocabulary));

  // 6. Correction strategy
  sections.push('\n# ERROR HANDLING');
  sections.push(generateCorrectionStrategy(role.level, role.persona));

  // 7. Whisper mode handling
  if (role.persona === 'tutor') {
    sections.push('\n# WHISPER MODE (Ukrainian Support)');
    sections.push(`When the student asks in Ukrainian (marked as whisper mode):
1. First, acknowledge their question in Ukrainian
2. Provide the English translation they need
3. Give a brief explanation in Ukrainian if helpful
4. Encourage them to try saying it in English
5. Always end your response in Ukrainian to maintain their comfort

Example format:
"Так, 'medium' англійською означає 'середній'. Ти можеш сказати: 'I'd like a medium coffee, please.' Спробуй сказати це англійською!"
`);
  }

  // 8. Speech parameters
  sections.push('\n# SPEECH PARAMETERS');
  sections.push(`- Speech speed: ${role.levelConfig.speechSpeed}x normal`);
  sections.push(`- Sentence complexity: ${role.levelConfig.sentenceComplexity}/10`);
  sections.push(`- Response wait time: ${role.levelConfig.waitTime}ms`);

  // 9. General guidelines
  sections.push('\n# GENERAL GUIDELINES');
  sections.push('- Keep responses concise and natural');
  sections.push('- Create an encouraging, low-stress learning environment');
  sections.push('- Adapt to the student\'s energy and engagement level');
  sections.push('- Make learning feel like a natural conversation, not a test');
  sections.push('- If the student struggles, simplify your language temporarily');
  sections.push('- Celebrate small victories and progress');

  return sections.join('\n');
}

/**
 * Generate a preview of how the AI will behave with this configuration
 */
export function generateBehaviorPreview(role: AIRole): {
  sampleGreeting: string;
  sampleCorrection: string;
  characteristics: string[];
} {
  const levelAdj = role.level === 'A1' || role.level === 'A2' ? 'very simple' :
                   role.level === 'B1' || role.level === 'B2' ? 'conversational' :
                   'sophisticated';

  const speedAdj = role.levelConfig.speechSpeed < 0.8 ? 'slowly' :
                   role.levelConfig.speechSpeed > 1.1 ? 'quickly' :
                   'at normal pace';

  const characteristics = [
    `Speaks ${speedAdj}`,
    `Uses ${levelAdj} language`,
    `${role.tone.charAt(0).toUpperCase() + role.tone.slice(1)} tone`,
    `${role.persona === 'actor' ? 'Role-play' : 'Teaching'} mode`,
  ];

  // Generate sample greeting based on role
  let sampleGreeting = '';
  if (role.persona === 'actor' && role.scenario?.includes('café')) {
    sampleGreeting = role.level === 'A1' ?
      'Hello! What you want?' :
      role.level === 'C2' ?
      'Good morning! What can I get started for you today?' :
      'Hi there! What would you like to order?';
  } else if (role.persona === 'tutor') {
    sampleGreeting = role.tone === 'strict' ?
      'Let\'s begin. Show me what you\'ve learned.' :
      'Hello! I\'m excited to practice English with you today!';
  } else {
    sampleGreeting = 'Hello! How can I help you?';
  }

  // Generate sample correction
  const sampleCorrection = role.persona === 'tutor' ?
    'Good try! Instead of "I want coffee", you can say "I would like a coffee, please." Try again!' :
    role.level <= 'B1' ?
    'A coffee? Sure! Do you mean you\'d like a coffee?' :
    '*continues conversation naturally*';

  return {
    sampleGreeting,
    sampleCorrection,
    characteristics,
  };
}

/**
 * Validate role configuration
 */
export function validateRole(role: Partial<AIRole>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!role.name || role.name.trim().length === 0) {
    errors.push('Role name is required');
  }

  if (!role.systemPrompt || role.systemPrompt.trim().length < 10) {
    errors.push('System prompt must be at least 10 characters');
  }

  if (!role.persona) {
    errors.push('Persona type is required');
  }

  if (!role.level) {
    errors.push('Student level is required');
  }

  if (!role.tone) {
    errors.push('Tone is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
