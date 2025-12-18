/**
 * Voice Constants
 * Available voices for Gemini Live API
 */

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  personality: string;
}

/**
 * Available Gemini Live API voices
 * All voices speak the preview phrase: "Hello! I'm ready to help you practice English."
 */
export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Puck',
    name: 'Puck',
    description: 'Conversational & friendly',
    personality: 'Great for everyday practice',
  },
  {
    id: 'Charon',
    name: 'Charon',
    description: 'Deep & authoritative',
    personality: 'Perfect for business English',
  },
  {
    id: 'Kore',
    name: 'Kore',
    description: 'Neutral & professional',
    personality: 'Ideal for formal settings',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    description: 'Warm & approachable',
    personality: 'Best for beginners',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    description: 'Melodic & expressive',
    personality: 'Popular choice',
  },
  {
    id: 'Leda',
    name: 'Leda',
    description: 'Gentle & patient',
    personality: 'Great for building confidence',
  },
  {
    id: 'Orus',
    name: 'Orus',
    description: 'Clear & articulate',
    personality: 'Focus on pronunciation',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    description: 'Light & encouraging',
    personality: 'Fun and energetic',
  },
];

/**
 * Default voice for new users and fallback
 */
export const DEFAULT_VOICE = 'Aoede';

/**
 * Get voice option by ID
 */
export function getVoiceById(id: string): VoiceOption | undefined {
  return AVAILABLE_VOICES.find((v) => v.id === id);
}

/**
 * Get voice preview audio URL
 */
export function getVoicePreviewUrl(voiceId: string): string {
  return `/audio/voices/${voiceId.toLowerCase()}.mp3`;
}
