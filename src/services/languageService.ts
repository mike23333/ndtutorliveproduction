/**
 * Language Service - Translation and Text-to-Speech API client
 *
 * Provides translation and TTS functionality by calling the Python backend.
 */

interface TranslateResponse {
  translatedText: string;
  detectedSourceLanguage: string;
  targetLanguage: string;
}

interface TTSResponse {
  audioContent: string; // Base64-encoded MP3
  contentType: string;
}

export class LanguageService {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:8080';
  }

  /**
   * Translate text to the target language
   *
   * @param text - Text to translate
   * @param targetLanguage - BCP-47 language code (e.g., 'uk-UA', 'es-ES')
   * @param sourceLanguage - Optional source language (auto-detects if not provided)
   * @returns Translated text and language info
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslateResponse> {
    const response = await fetch(`${this.apiUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Translation failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Convert text to speech audio
   *
   * @param text - Text to synthesize
   * @param languageCode - BCP-47 language code (default: 'en-US')
   * @param options - Optional TTS settings
   * @returns Base64-encoded MP3 audio
   */
  async textToSpeech(
    text: string,
    languageCode: string = 'en-US',
    options?: {
      voiceName?: string;
      speakingRate?: number;
      pitch?: number;
    }
  ): Promise<TTSResponse> {
    const response = await fetch(`${this.apiUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        languageCode,
        voiceName: options?.voiceName,
        speakingRate: options?.speakingRate ?? 0.9,
        pitch: options?.pitch ?? 0.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Play TTS audio directly
   *
   * @param text - Text to speak
   * @param languageCode - Language code
   * @returns Audio element that's playing
   */
  async speak(
    text: string,
    languageCode: string = 'en-US',
    options?: {
      voiceName?: string;
      speakingRate?: number;
      pitch?: number;
    }
  ): Promise<HTMLAudioElement> {
    const ttsResponse = await this.textToSpeech(text, languageCode, options);

    // Create audio element from base64 data
    const audio = new Audio(`data:audio/mpeg;base64,${ttsResponse.audioContent}`);

    // Return a promise that resolves when audio starts playing
    return new Promise((resolve, reject) => {
      audio.oncanplaythrough = () => {
        audio.play()
          .then(() => resolve(audio))
          .catch(reject);
      };
      audio.onerror = () => reject(new Error('Failed to load audio'));
    });
  }
}

// Singleton instance
let languageServiceInstance: LanguageService | null = null;

export function getLanguageService(): LanguageService {
  if (!languageServiceInstance) {
    languageServiceInstance = new LanguageService();
  }
  return languageServiceInstance;
}
