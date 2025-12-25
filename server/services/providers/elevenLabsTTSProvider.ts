import { ElevenLabsClient } from 'elevenlabs';
import { TTSProvider, TTSOptions } from '../types/ttsTypes';
import { languageService } from '../languageService';

/**
 * ElevenLabs Text-to-Speech Provider
 * Refactored from existing ttsService.ts implementation
 */
export class ElevenLabsTTSProvider implements TTSProvider {
  name = 'elevenlabs' as const;
  priority = 2; // Fallback provider
  private client: ElevenLabsClient | null = null;
  
  constructor() {
    this.initializeClient();
  }
  
  private initializeClient(): void {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (apiKey) {
      try {
        this.client = new ElevenLabsClient({ apiKey });
        console.log('✓ ElevenLabs client initialized');
      } catch (error) {
        console.error('Failed to initialize ElevenLabs client:', error);
        this.client = null;
      }
    } else {
      console.log('ElevenLabs API key not found, ElevenLabs TTS unavailable');
    }
  }
  
  async isAvailable(): Promise<boolean> {
    return this.client !== null && !!process.env.ELEVENLABS_API_KEY;
  }
  
  async textToSpeech(text: string, options?: TTSOptions): Promise<Buffer | null> {
    if (!this.client) {
      console.log('ElevenLabs not configured, skipping TTS');
      return null;
    }

    try {
      // Humanize mathematical notation for natural speech
      const humanizedText = this.humanizeMathText(text);
      
      // Use language service for voice selection
      const languageCode = options?.languageCode || 'en';
      const voiceConfig = languageService.getVoiceWithFallback(languageCode, 'elevenlabs');
      
      // Override with explicit options if provided
      const voiceId = options?.voiceId || voiceConfig.voiceId;
      const modelId = options?.modelId || voiceConfig.modelId || 'eleven_turbo_v2_5';
      
      console.log(`Attempting ElevenLabs TTS with voice: ${voiceId}, model: ${modelId}`);
      
      // Use multilingual turbo model for Hinglish support
      const audio = await this.client.generate({
        voice: voiceId,
        text: humanizedText,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true
        }
      });

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      console.log(`ElevenLabs TTS success: ${buffer.length} bytes`);
      return buffer;
    } catch (error: any) {
      console.error('ElevenLabs TTS error:', error);
      console.error('Error details:', error.message, error.statusCode);
      return null;
    }
  }
  
  async textToSpeechStream(text: string, options?: TTSOptions): Promise<AsyncIterable<Buffer> | null> {
    if (!this.client) {
      console.log('ElevenLabs not configured, skipping TTS');
      return null;
    }

    try {
      // Humanize mathematical notation for natural speech
      const humanizedText = this.humanizeMathText(text);
      
      // Use language service for voice selection
      const languageCode = options?.languageCode || 'en';
      const voiceConfig = languageService.getVoiceWithFallback(languageCode, 'elevenlabs');
      
      // Override with explicit options if provided
      const voice = options?.voiceId || voiceConfig.voiceId;
      const model = options?.modelId || voiceConfig.modelId || 'eleven_turbo_v2_5';
      
      console.log(`Attempting ElevenLabs streaming TTS with voice: ${voice}, model: ${model}`);
      
      // Use streaming for faster response
      const audioStream = await this.client.generate({
        voice,
        text: humanizedText,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true
        },
        stream: true
      });

      console.log(`ElevenLabs streaming TTS started`);
      return audioStream;
    } catch (error: any) {
      console.error('ElevenLabs streaming TTS error:', error);
      console.error('Error details:', error.message, error.statusCode);
      return null;
    }
  }
  
  /**
   * Get voice ID based on language code (legacy method, now uses language service)
   * @deprecated Use languageService.getVoiceForProvider instead
   */
  private getVoiceId(languageCode?: string): string {
    if (!languageCode) {
      return process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
    }
    
    // Map language codes to ElevenLabs voice IDs
    const voiceMap: { [key: string]: string } = {
      'en': process.env.ELEVENLABS_ENGLISH_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
      'hi': process.env.ELEVENLABS_HINDI_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
      'ta': process.env.ELEVENLABS_TAMIL_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
      'te': process.env.ELEVENLABS_TELUGU_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
      'bn': process.env.ELEVENLABS_BENGALI_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
      'gu': process.env.ELEVENLABS_GUJARATI_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
      'mr': process.env.ELEVENLABS_MARATHI_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
      'kn': process.env.ELEVENLABS_KANNADA_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
      'ml': process.env.ELEVENLABS_MALAYALAM_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
      'pa': process.env.ELEVENLABS_PUNJABI_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'
    };
    
    return voiceMap[languageCode] || voiceMap['en'];
  }
  
  /**
   * Get model ID based on language code (legacy method, now uses language service)
   * @deprecated Use languageService.getVoiceForProvider instead
   */
  private getModelId(languageCode?: string): string {
    if (!languageCode || languageCode === 'en') {
      return process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5';
    }
    
    // Use multilingual model for non-English languages
    return process.env.ELEVENLABS_MULTILINGUAL_MODEL_ID || 'eleven_multilingual_v2';
  }
  
  /**
   * Humanize mathematical symbols and notation for natural speech
   * Same logic as Google TTS for consistency
   */
  private humanizeMathText(text: string): string {
    let humanized = text;
    
    // Remove code blocks (ASCII art) - don't read them aloud
    humanized = humanized.replace(/```[\s\S]*?```/g, ' [diagram shown] ');
    
    // Remove markdown headers (# ## ### etc.) - just keep the text
    humanized = humanized.replace(/^#{1,6}\s+/gm, ''); // Remove # at start of lines
    humanized = humanized.replace(/#{1,6}\s+/g, ''); // Remove # anywhere else
    
    // Remove markdown formatting
    humanized = humanized.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    humanized = humanized.replace(/\*(.*?)\*/g, '$1'); // Italic
    humanized = humanized.replace(/__(.*?)__/g, '$1'); // Bold
    humanized = humanized.replace(/_(.*?)_/g, '$1'); // Italic
    
    // Remove markdown links [text](url) -> text
    humanized = humanized.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Remove markdown list markers
    humanized = humanized.replace(/^[\s]*[-*+]\s+/gm, ''); // Unordered lists
    humanized = humanized.replace(/^[\s]*\d+\.\s+/gm, ''); // Ordered lists
    
    // Remove emoji and special characters that might be read as symbols
    humanized = humanized.replace(/[🎭🎁👨‍👩‍👧‍👦❤️📚🎯💡]/g, '');
    
    // Remove other markdown symbols
    humanized = humanized.replace(/`([^`]+)`/g, '$1'); // Inline code
    humanized = humanized.replace(/>/g, ''); // Blockquotes
    
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