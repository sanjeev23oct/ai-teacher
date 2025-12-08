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
   * Get TTS voice ID for a language
   */
  getTTSVoiceId(code: string): string {
    const config = this.getLanguageConfigOrDefault(code);
    return config.ttsVoiceId;
  }

  /**
   * Get TTS model for a language
   */
  getTTSModel(code: string): string {
    const config = this.getLanguageConfigOrDefault(code);
    return config.ttsModel;
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
}

export const languageService = new LanguageService();
