/**
 * TTS Provider Interface and Types
 * Defines the common interface for all TTS providers (Google, ElevenLabs, etc.)
 */

export interface TTSOptions {
  languageCode?: string;
  voiceId?: string;
  modelId?: string;
  speakingRate?: number;
  pitch?: number;
  volumeGainDb?: number;
}

export interface TTSProvider {
  name: 'google' | 'elevenlabs';
  priority: number;
  
  /**
   * Check if the provider is available and properly configured
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Generate speech audio from text
   * @param text - Text to convert to speech
   * @param options - Voice and audio configuration options
   * @returns Audio buffer or null if generation fails
   */
  textToSpeech(text: string, options?: TTSOptions): Promise<Buffer | null>;
  
  /**
   * Generate streaming speech audio from text
   * @param text - Text to convert to speech
   * @param options - Voice and audio configuration options
   * @returns Async iterable of audio chunks or null if generation fails
   */
  textToSpeechStream(text: string, options?: TTSOptions): Promise<AsyncIterable<Buffer> | null>;
}

export interface TTSConfig {
  primaryProvider: 'google' | 'elevenlabs';
  fallbackEnabled: boolean;
  providers: {
    google: {
      enabled: boolean;
      apiKey?: string;
      projectId?: string;
    };
    elevenlabs: {
      enabled: boolean;
      apiKey?: string;
    };
  };
}

export interface TTSUsageLog {
  timestamp: Date;
  provider: 'google' | 'elevenlabs' | 'browser';
  success: boolean;
  responseTime: number;
  characterCount: number;
  languageCode?: string;
  voiceId?: string;
  modelId?: string;
  errorMessage?: string;
  fallbackUsed: boolean;
  // Enhanced logging fields
  audioSizeBytes?: number;
  estimatedCost?: number;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export type TTSProviderName = 'google' | 'elevenlabs';