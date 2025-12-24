import { DualProviderTTSService } from './dualProviderTTSService';
import { TTSOptions } from './types/ttsTypes';

// Initialize the dual provider TTS service
const dualProviderTTS = new DualProviderTTSService();

/**
 * Generate speech audio using dual-provider system (Google primary, ElevenLabs fallback)
 * Maintains backward compatibility with existing function signature
 */
export async function textToSpeech(text: string): Promise<Buffer | null> {
  return await dualProviderTTS.textToSpeech(text);
}

/**
 * Generate streaming speech audio using dual-provider system
 * Maintains backward compatibility with existing function signature
 * @param text - Text to convert to speech
 * @param voiceId - Optional voice ID (will be mapped to appropriate provider)
 * @param modelId - Optional model ID (will be mapped to appropriate provider)
 */
export async function textToSpeechStream(
  text: string,
  voiceId?: string,
  modelId?: string
): Promise<AsyncIterable<Buffer> | null> {
  const options: TTSOptions = {};
  
  if (voiceId) options.voiceId = voiceId;
  if (modelId) options.modelId = modelId;
  
  return await dualProviderTTS.textToSpeechStream(text, options);
}

/**
 * Generate speech for Hinglish content using dual-provider system
 * Maintains backward compatibility with existing function signature
 */
export async function textToSpeechHinglish(text: string): Promise<Buffer | null> {
  const options: TTSOptions = {
    languageCode: 'hi', // Hindi language code
    voiceId: 'zT03pEAEi0VHKciJODfn', // Custom Hinglish voice for ElevenLabs
    modelId: 'eleven_multilingual_v2' // Multilingual model for ElevenLabs
  };
  
  return await dualProviderTTS.textToSpeech(text, options);
}

/**
 * Enhanced TTS function with full options support
 * New function that exposes all dual-provider capabilities
 */
export async function textToSpeechWithOptions(text: string, options?: TTSOptions): Promise<Buffer | null> {
  return await dualProviderTTS.textToSpeech(text, options);
}

/**
 * Enhanced streaming TTS function with full options support
 * New function that exposes all dual-provider streaming capabilities
 */
export async function textToSpeechStreamWithOptions(text: string, options?: TTSOptions): Promise<AsyncIterable<Buffer> | null> {
  return await dualProviderTTS.textToSpeechStream(text, options);
}

/**
 * Get TTS service statistics for monitoring
 */
export function getTTSStats() {
  return dualProviderTTS.getUsageStats();
}

/**
 * Get current TTS configuration
 */
export function getTTSConfiguration() {
  return dualProviderTTS.getConfiguration();
}

/**
 * Generate speech for a specific language (used by ttsHelper)
 * Maps to textToSpeechWithOptions with language-specific configuration
 */
export async function generateSpeech(text: string, languageCode: string): Promise<Buffer> {
  const options: TTSOptions = {
    languageCode: languageCode
  };
  
  const result = await dualProviderTTS.textToSpeech(text, options);
  
  if (!result) {
    throw new Error(`Failed to generate speech for language: ${languageCode}`);
  }
  
  return result;
}

/**
 * Check if a specific provider is available
 */
export async function isProviderAvailable(provider: 'google' | 'elevenlabs'): Promise<boolean> {
  return await dualProviderTTS.isProviderAvailable(provider);
}
