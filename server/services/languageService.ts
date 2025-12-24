/**
 * Language Service
 * Handles all language-related operations for multi-language support
 */

import {
  LanguageConfig,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getLanguageConfig,
  getLanguageConfigOrDefault,
  isValidLanguage,
  getAllLanguageCodes
} from '../config/languages';

class LanguageService {
  /**
   * Get configuration for a specific language
   */
  getLanguageConfig(code: string): LanguageConfig | undefined {
    return getLanguageConfig(code);
  }

  /**
   * Get configuration or fall back to default
   */
  getLanguageConfigOrDefault(code: string): LanguageConfig {
    return getLanguageConfigOrDefault(code);
  }

  /**
   * Get the AI prompt instruction for a language
   */
  getPromptInstruction(code: string): string {
    const config = this.getLanguageConfigOrDefault(code);
    return config.promptInstruction;
  }

  /**
   * Get TTS voice ID for a language (ElevenLabs)
   */
  getTTSVoiceId(code: string): string {
    const config = this.getLanguageConfigOrDefault(code);
    return config.ttsVoiceId;
  }

  /**
   * Get TTS model for a language (ElevenLabs)
   */
  getTTSModel(code: string): string {
    const config = this.getLanguageConfigOrDefault(code);
    return config.ttsModel;
  }

  /**
   * Get Google TTS voice ID for a language
   */
  getGoogleVoiceId(code: string): string {
    const config = this.getLanguageConfigOrDefault(code);
    return config.googleVoiceId;
  }

  /**
   * Get Google TTS language code for a language
   */
  getGoogleLanguageCode(code: string): string {
    const config = this.getLanguageConfigOrDefault(code);
    return config.googleLanguageCode;
  }

  /**
   * Get all supported languages
   */
  getAllLanguages(): LanguageConfig[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Check if a language code is valid
   */
  isValidLanguage(code: string): boolean {
    return isValidLanguage(code);
  }

  /**
   * Get all language codes
   */
  getAllLanguageCodes(): string[] {
    return getAllLanguageCodes();
  }

  /**
   * Get the default language code
   */
  getDefaultLanguage(): string {
    return DEFAULT_LANGUAGE;
  }

  /**
   * Build a language-aware prompt by prepending language instruction
   */
  buildLanguageAwarePrompt(basePrompt: string, languageCode: string): string {
    const instruction = this.getPromptInstruction(languageCode);
    return `${instruction}\n\n${basePrompt}`;
  }

  /**
   * Get language display info for UI
   */
  getLanguageDisplayInfo(code: string): { name: string; nativeName: string; flag: string; mixName: string } {
    const config = this.getLanguageConfigOrDefault(code);
    return {
      name: config.name,
      nativeName: config.nativeName,
      flag: config.flag,
      mixName: config.mixName
    };
  }

  /**
   * Get voice configuration for a specific provider
   */
  getVoiceForProvider(languageCode: string, provider: 'google' | 'elevenlabs'): { voiceId: string; languageCode?: string; modelId?: string } {
    const config = this.getLanguageConfigOrDefault(languageCode);
    
    if (provider === 'google') {
      return {
        voiceId: config.googleVoiceId,
        languageCode: config.googleLanguageCode
      };
    } else {
      return {
        voiceId: config.ttsVoiceId,
        modelId: config.ttsModel
      };
    }
  }

  /**
   * Get voice configuration with fallback handling
   */
  getVoiceWithFallback(languageCode: string, provider: 'google' | 'elevenlabs'): { voiceId: string; languageCode?: string; modelId?: string } {
    try {
      return this.getVoiceForProvider(languageCode, provider);
    } catch (error) {
      console.warn(`Voice not available for language ${languageCode} with provider ${provider}, falling back to English`);
      return this.getVoiceForProvider('en', provider);
    }
  }

  /**
   * Validate if a language is supported by a specific provider
   */
  isLanguageSupportedByProvider(languageCode: string, provider: 'google' | 'elevenlabs'): boolean {
    const config = this.getLanguageConfig(languageCode);
    if (!config) return false;
    
    if (provider === 'google') {
      return !!config.googleVoiceId && !!config.googleLanguageCode;
    } else {
      return !!config.ttsVoiceId && !!config.ttsModel;
    }
  }
}

export const languageService = new LanguageService();
