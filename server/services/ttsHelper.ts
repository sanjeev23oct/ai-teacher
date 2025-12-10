// ===========================
// TTS Helper Service
// Reusable TTS generation with language support
// ===========================

import { generateSpeech } from './ttsService';
import { SUPPORTED_LANGUAGES } from '../config/languages';
import { AUDIO_DURATION_ESTIMATES } from '../config/audioCacheConfig';

/**
 * Generate TTS audio with language-aware voice selection
 * Reusable across all modules
 */
export async function generateTTS(
  text: string,
  languageCode: string = 'en'
): Promise<Buffer> {
  // Get language config
  const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
  
  if (!langConfig) {
    console.warn(`Language ${languageCode} not found, falling back to English`);
    return generateSpeech(text, 'en');
  }

  // Use existing ttsService which handles language-specific voice IDs
  return generateSpeech(text, languageCode);
}

/**
 * Estimate audio duration based on text length
 */
export function estimateAudioDuration(
  text: string,
  wordsPerMinute: number = AUDIO_DURATION_ESTIMATES.WORDS_PER_MINUTE
): number {
  const wordCount = text.split(/\s+/).length;
  return Math.ceil((wordCount / wordsPerMinute) * 60); // in seconds
}

export default {
  generateTTS,
  estimateAudioDuration,
};
