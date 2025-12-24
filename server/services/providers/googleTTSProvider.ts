import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { ClientOptions } from 'google-gax';
import { TTSProvider, TTSOptions } from '../types/ttsTypes';
import { languageService } from '../languageService';

/**
 * Google Cloud Text-to-Speech Provider
 * Based on working implementation from google_service.txt
 */
export class GoogleTTSProvider implements TTSProvider {
  name = 'google' as const;
  priority = 1; // Primary provider
  private client: TextToSpeechClient | null = null;
  
  constructor() {
    this.initializeClient();
  }
  
  private initializeClient(): void {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey) {
      try {
        const options: ClientOptions = {
          apiKey: apiKey
        };
        this.client = new TextToSpeechClient(options);
        console.log('✓ Google Cloud TTS client initialized');
      } catch (error) {
        console.error('Failed to initialize Google Cloud TTS client:', error);
        this.client = null;
      }
    } else {
      console.log('Google API key not found, Google TTS unavailable');
    }
  }
  
  async isAvailable(): Promise<boolean> {
    return this.client !== null && !!process.env.GOOGLE_API_KEY;
  }
  
  async textToSpeech(text: string, options?: TTSOptions): Promise<Buffer | null> {
    if (!this.client) {
      console.log('Google Cloud TTS client not initialized');
      return null;
    }

    try {
      // Use language service for voice selection
      const languageCode = options?.languageCode || 'en';
      const voiceConfig = languageService.getVoiceWithFallback(languageCode, 'google');
      
      // Override with explicit voiceId if provided
      const voiceId = options?.voiceId || voiceConfig.voiceId;
      const googleLanguageCode = voiceConfig.languageCode || this.extractLanguageCode(voiceId);

      console.log(`Attempting Google TTS with voice: ${voiceId}, language: ${googleLanguageCode}`);

      const request = {
        input: { text: this.humanizeMathText(text) },
        voice: {
          languageCode: googleLanguageCode,
          name: voiceId
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: options?.speakingRate || 1.0,
          pitch: options?.pitch || 0.0
        }
      };

      const [response] = await this.client.synthesizeSpeech(request);
      console.log(`Google TTS success: ${response.audioContent?.length} bytes`);
      return response.audioContent as Buffer;
    } catch (error: any) {
      console.error('Google TTS error:', error);
      console.error('Error details:', error.message);
      return null;
    }
  }
  
  async textToSpeechStream(text: string, options?: TTSOptions): Promise<AsyncIterable<Buffer> | null> {
    // Google Cloud TTS doesn't support true streaming, so we'll return the full audio as a single chunk
    const audioBuffer = await this.textToSpeech(text, options);
    if (!audioBuffer) return null;
    
    console.log('Google TTS streaming (pseudo-streaming with single chunk)');
    
    // Convert buffer to async iterable for compatibility with streaming interface
    return (async function* () {
      yield audioBuffer;
    })();
  }
  
  /**
   * Extract language code from voice ID (fallback method)
   */
  private extractLanguageCode(voiceId: string): string {
    const langParts = voiceId.split('-');
    return langParts.slice(0, 2).join('-');
  }
  
  /**
   * Get default voice for language code (legacy method, now uses language service)
   * @deprecated Use languageService.getVoiceForProvider instead
   */
  private getDefaultVoice(languageCode?: string): string {
    if (!languageCode) return 'en-IN-Wavenet-A';
    
    // Map language codes to Google TTS voices
    const voiceMap: { [key: string]: string } = {
      'en': process.env.GOOGLE_ENGLISH_VOICE || 'en-IN-Wavenet-A',
      'hi': process.env.GOOGLE_HINDI_VOICE || 'hi-IN-Wavenet-A',
      'ta': process.env.GOOGLE_TAMIL_VOICE || 'ta-IN-Wavenet-A',
      'te': process.env.GOOGLE_TELUGU_VOICE || 'te-IN-Standard-A',
      'bn': process.env.GOOGLE_BENGALI_VOICE || 'bn-IN-Wavenet-A',
      'gu': process.env.GOOGLE_GUJARATI_VOICE || 'gu-IN-Wavenet-A',
      'mr': process.env.GOOGLE_MARATHI_VOICE || 'mr-IN-Wavenet-A',
      'kn': process.env.GOOGLE_KANNADA_VOICE || 'kn-IN-Wavenet-A',
      'ml': process.env.GOOGLE_MALAYALAM_VOICE || 'ml-IN-Wavenet-A',
      'pa': process.env.GOOGLE_PUNJABI_VOICE || 'pa-IN-Wavenet-A'
    };
    
    return voiceMap[languageCode] || voiceMap['en'];
  }
  
  /**
   * Humanize mathematical symbols and notation for natural speech
   * Same logic as ElevenLabs for consistency
   */
  private humanizeMathText(text: string): string {
    let humanized = text;
    
    // Remove code blocks (ASCII art) - don't read them aloud
    humanized = humanized.replace(/```[\s\S]*?```/g, ' [diagram shown] ');
    
    // Remove markdown formatting
    humanized = humanized.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    humanized = humanized.replace(/\*(.*?)\*/g, '$1'); // Italic
    humanized = humanized.replace(/__(.*?)__/g, '$1'); // Bold
    humanized = humanized.replace(/_(.*?)_/g, '$1'); // Italic
    
    // Special mathematical symbols (not common in text)
    humanized = humanized.replace(/×/g, ' times ');
    humanized = humanized.replace(/÷/g, ' divided by ');
    humanized = humanized.replace(/≠/g, ' not equals ');
    humanized = humanized.replace(/≈/g, ' approximately equals ');
    humanized = humanized.replace(/≤/g, ' less than or equal to ');
    humanized = humanized.replace(/≥/g, ' greater than or equal to ');
    
    // Superscript numbers (Unicode)
    humanized = humanized.replace(/²/g, ' squared');
    humanized = humanized.replace(/³/g, ' cubed');
    
    // Greek letters (common in math/science)
    humanized = humanized.replace(/π/g, ' pi ');
    humanized = humanized.replace(/θ/g, ' theta ');
    humanized = humanized.replace(/α/g, ' alpha ');
    humanized = humanized.replace(/β/g, ' beta ');
    humanized = humanized.replace(/γ/g, ' gamma ');
    humanized = humanized.replace(/Δ/g, ' delta ');
    humanized = humanized.replace(/λ/g, ' lambda ');
    humanized = humanized.replace(/μ/g, ' mu ');
    humanized = humanized.replace(/σ/g, ' sigma ');
    humanized = humanized.replace(/Σ/g, ' sum of ');
    humanized = humanized.replace(/∞/g, ' infinity ');
    
    // Clean up multiple spaces
    humanized = humanized.replace(/\s+/g, ' ').trim();
    
    return humanized;
  }
}