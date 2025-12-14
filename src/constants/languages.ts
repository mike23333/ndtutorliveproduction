/**
 * Language and daily goal constants for the tutoring app
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'uk-UA', name: 'Ukrainian', flag: '\u{1F1FA}\u{1F1E6}' },
  { code: 'es-ES', name: 'Spanish', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'fr-FR', name: 'French', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de-DE', name: 'German', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'it-IT', name: 'Italian', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'pt-BR', name: 'Portuguese', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'ja-JP', name: 'Japanese', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'ko-KR', name: 'Korean', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'zh-CN', name: 'Mandarin', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'pl-PL', name: 'Polish', flag: '\u{1F1F5}\u{1F1F1}' },
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const DEFAULT_TARGET_LANGUAGE: SupportedLanguageCode = 'uk-UA';
export const DEFAULT_DAILY_GOAL = 15; // minutes

export const DAILY_GOAL_OPTIONS = [
  { minutes: 5, label: 'Quick', description: 'Quick daily practice' },
  { minutes: 10, label: 'Light', description: 'Light practice' },
  { minutes: 15, label: 'Regular', description: 'Recommended' },
  { minutes: 20, label: 'Dedicated', description: 'Dedicated learner' },
  { minutes: 30, label: 'Intensive', description: 'Intensive practice' },
] as const;

/**
 * Get language info by code
 */
export function getLanguageByCode(code: string) {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get daily goal option by minutes
 */
export function getDailyGoalOption(minutes: number) {
  return DAILY_GOAL_OPTIONS.find(opt => opt.minutes === minutes);
}
