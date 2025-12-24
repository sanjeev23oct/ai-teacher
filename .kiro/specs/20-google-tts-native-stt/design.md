# Design Document

## Overview

This design outlines the implementation of a dual-provider Text-to-Speech (TTS) system with Google Cloud TTS as the primary provider and ElevenLabs as a configurable fallback, along with enhanced native Speech-to-Text (STT) using the Web Speech API. The system provides robust audio generation with automatic failover capabilities and environment-based provider configuration.

## Architecture

### Current Architecture
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Server    │───▶│ ElevenLabs  │
│ Components  │    │ TTS Service │    │     API     │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │ Audio Cache │
       │            │   System    │
       │            └─────────────┘
       │
       ▼
┌─────────────┐
│ Web Speech  │
│     API     │
└─────────────┘
```

### New Dual-Provider Architecture
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Server    │───▶│ Google TTS  │
│ Components  │    │ TTS Service │    │ (Primary)   │
└─────────────┘    │             │    └─────────────┘
       │            │             │           │
       │            │             │           ▼ (fallback)
       │            │             │    ┌─────────────┐
       │            │             │───▶│ ElevenLabs  │
       │            │             │    │ (Fallback)  │
       │            │             │    └─────────────┘
       │            │             │           │
       │            │             ▼           ▼
       │            │      ┌─────────────┐
       │            │      │ Audio Cache │
       │            │      │   System    │
       │            │      └─────────────┘
       │            │
       ▼            ▼
┌─────────────┐ ┌─────────────┐
│ Web Speech  │ │ Provider    │
│ API (STT)   │ │ Selection   │
└─────────────┘ └─────────────┘
```

## Components and Interfaces

### 1. Dual-Provider TTS Service

**Location**: `server/services/ttsService.ts`

```typescript
interface TTSProvider {
  name: 'google' | 'elevenlabs';
  priority: number;
  isAvailable(): Promise<boolean>;
  textToSpeech(text: string, options?: TTSOptions): Promise<Buffer | null>;
  textToSpeechStream(text: string, options?: TTSOptions): Promise<AsyncIterable<Buffer> | null>;
}

interface TTSOptions {
  languageCode?: string;
  voiceId?: string;
  modelId?: string;
  speakingRate?: number;
  pitch?: number;
}

interface TTSConfig {
  primaryProvider: 'google' | 'elevenlabs';
  fallbackEnabled: boolean;
  providers: {
    google: GoogleTTSConfig;
    elevenlabs: ElevenLabsConfig;
  };
}

class DualProviderTTSService {
  private providers: Map<string, TTSProvider>;
  private config: TTSConfig;
  
  async textToSpeech(text: string, options?: TTSOptions): Promise<Buffer | null>
  async textToSpeechStream(text: string, options?: TTSOptions): Promise<AsyncIterable<Buffer> | null>
  private async tryProvider(provider: TTSProvider, text: string, options?: TTSOptions): Promise<Buffer | null>
  private async getAvailableProvider(): Promise<TTSProvider | null>
  private logProviderUsage(provider: string, success: boolean, responseTime: number): void
}
```

### 2. Google TTS Provider (Working Implementation)

**Location**: `server/services/providers/googleTTSProvider.ts`

```typescript
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { ClientOptions } from 'google-gax';

interface GoogleTTSConfig {
  apiKey: string;
  projectId?: string;
}

class GoogleTTSProvider implements TTSProvider {
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
      const voiceId = options?.voiceId || 'en-IN-Wavenet-A';
      const langParts = voiceId.split('-');
      const languageCode = langParts.slice(0, 2).join('-');

      const request = {
        input: { text: this.humanizeMathText(text) },
        voice: {
          languageCode: languageCode,
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
    } catch (error) {
      console.error('Google TTS error:', error);
      return null;
    }
  }
  
  async textToSpeechStream(text: string, options?: TTSOptions): Promise<AsyncIterable<Buffer> | null> {
    // Google Cloud TTS doesn't support streaming, so we'll return the full audio as a single chunk
    const audioBuffer = await this.textToSpeech(text, options);
    if (!audioBuffer) return null;
    
    // Convert buffer to async iterable for compatibility with streaming interface
    return (async function* () {
      yield audioBuffer;
    })();
  }
  
  private humanizeMathText(text: string): string {
    // Same humanization logic as ElevenLabs
    let humanized = text;
    
    // Remove code blocks (ASCII art) - don't read them aloud
    humanized = humanized.replace(/```[\s\S]*?```/g, ' [diagram shown] ');
    
    // Remove markdown formatting
    humanized = humanized.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    humanized = humanized.replace(/\*(.*?)\*/g, '$1'); // Italic
    
    // Mathematical symbols
    humanized = humanized.replace(/×/g, ' times ');
    humanized = humanized.replace(/÷/g, ' divided by ');
    humanized = humanized.replace(/π/g, ' pi ');
    humanized = humanized.replace(/²/g, ' squared');
    humanized = humanized.replace(/³/g, ' cubed');
    
    // Clean up multiple spaces
    humanized = humanized.replace(/\s+/g, ' ').trim();
    
    return humanized;
  }
}
```

### 3. ElevenLabs TTS Provider

**Location**: `server/services/providers/elevenLabsTTSProvider.ts`

```typescript
class ElevenLabsTTSProvider implements TTSProvider {
  name = 'elevenlabs' as const;
  priority = 2; // Fallback provider
  
  async isAvailable(): Promise<boolean>
  async textToSpeech(text: string, options?: TTSOptions): Promise<Buffer | null>
  async textToSpeechStream(text: string, options?: TTSOptions): Promise<AsyncIterable<Buffer> | null>
  private getVoiceId(languageCode?: string): string
  private getModelId(languageCode?: string): string
}
```

### 4. Native STT Service

**Location**: `client/src/services/sttService.ts`

```typescript
interface STTConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

interface STTResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

class NativeSTTService {
  private recognition: SpeechRecognition | null;
  
  initialize(config: STTConfig): boolean
  startListening(): Promise<void>
  stopListening(): void
  onResult(callback: (result: STTResult) => void): void
  onError(callback: (error: SpeechRecognitionError) => void): void
  isSupported(): boolean
}
```

### 5. Provider Configuration Service

**Location**: `server/services/providerConfigService.ts`

```typescript
interface ProviderConfig {
  tts: {
    primary: 'google' | 'elevenlabs';
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
  };
}

class ProviderConfigService {
  loadConfig(): ProviderConfig
  validateConfig(config: ProviderConfig): boolean
  getProviderPriority(): Array<'google' | 'elevenlabs'>
  isProviderEnabled(provider: 'google' | 'elevenlabs'): boolean
}
```

### 3. Language Service Updates

**Location**: `server/services/languageService.ts`

```typescript
interface ProviderVoiceMapping {
  google: {
    voiceName: string;
    languageCode: string;
    gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  };
  elevenlabs: {
    voiceId: string;
    modelId: string;
  };
}

class LanguageService {
  getVoiceForProvider(languageCode: string, provider: 'google' | 'elevenlabs'): ProviderVoiceMapping[typeof provider]
  getSpeechRecognitionLanguage(languageCode: string): string
  private mapToGoogleLanguageCode(internalCode: string): string
  private mapToElevenLabsVoice(internalCode: string): string
}
```

## Data Models

### Environment Configuration

```bash
# Primary TTS Provider Configuration
TTS_PROVIDER=google  # Options: google, elevenlabs
TTS_FALLBACK_ENABLED=true

# Google Cloud TTS Configuration
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_PROJECT_ID=your-project-id  # Optional

# ElevenLabs TTS Configuration (Fallback)
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5

# Language-specific Google TTS voices
GOOGLE_ENGLISH_VOICE=en-IN-Wavenet-A
GOOGLE_HINDI_VOICE=hi-IN-Wavenet-A
GOOGLE_TAMIL_VOICE=ta-IN-Wavenet-A
GOOGLE_TELUGU_VOICE=te-IN-Standard-A
GOOGLE_BENGALI_VOICE=bn-IN-Wavenet-A
GOOGLE_GUJARATI_VOICE=gu-IN-Wavenet-A
GOOGLE_MARATHI_VOICE=mr-IN-Wavenet-A
GOOGLE_KANNADA_VOICE=kn-IN-Wavenet-A
GOOGLE_MALAYALAM_VOICE=ml-IN-Wavenet-A
GOOGLE_PUNJABI_VOICE=pa-IN-Wavenet-A
```

### Google TTS Request/Response Models

```typescript
interface GoogleTTSRequest {
  input: {
    text: string;
  };
  voice: {
    languageCode: string;
    name: string;
  };
  audioConfig: {
    audioEncoding: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
    speakingRate: number;
    pitch: number;
  };
}

interface GoogleTTSResponse {
  audioContent: Buffer;
}
```

### Provider Usage Logging

```typescript
interface TTSUsageLog {
  timestamp: Date;
  provider: 'google' | 'elevenlabs' | 'browser';
  success: boolean;
  responseTime: number;
  characterCount: number;
  languageCode: string;
  voiceId: string;
  errorMessage?: string;
  fallbackUsed: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Primary Provider Usage
*For any* text input, the TTS service should attempt to use the configured primary provider (Google TTS by default) before falling back to secondary providers.
**Validates: Requirements 1.1**

### Property 2: Automatic Provider Fallback
*For any* TTS request when the primary provider fails, the system should automatically attempt the fallback provider without user intervention.
**Validates: Requirements 1.2**

### Property 3: Multi-level Fallback Chain
*For any* TTS request when both API providers fail, the system should gracefully fallback to browser-native speech synthesis.
**Validates: Requirements 1.3**

### Property 4: Provider Configuration Flexibility
*For any* environment configuration change, the system should be able to switch primary and fallback providers without code changes or service restarts.
**Validates: Requirements 4.2, 4.3, 4.4**

### Property 5: Provider Usage Logging
*For any* TTS operation, the system should log which provider was used, response times, and success/failure status for monitoring and cost tracking.
**Validates: Requirements 4.5, 8.1, 8.2**

### Property 6: Real-time STT Feedback
*For any* active speech recognition session, the system should provide real-time visual feedback and handle both interim and final transcription results appropriately.
**Validates: Requirements 2.4, 2.5**

### Property 7: Multi-language TTS Support
*For any* supported language (Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi), the Google TTS service should use appropriate voices and automatically select correct parameters based on language preferences.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 8: Language Fallback Consistency
*For any* unavailable language voice, the system should fallback to English with appropriate error logging, ensuring service continuity.
**Validates: Requirements 3.5**

### Property 9: Configuration Management
*For any* TTS operation, the system should use Google Cloud TTS API key from environment variables and apply configurable voice types, speaking rates, and audio formats correctly.
**Validates: Requirements 4.1, 4.2**

### Property 10: Usage Logging and Monitoring
*For any* TTS API call, the system should log usage information for cost monitoring and provide clear error messages for invalid configurations.
**Validates: Requirements 4.3, 4.4**

### Property 11: Cache-based Cost Optimization
*For any* repeated audio request, the system should use existing audio caching to minimize API calls and optimize costs.
**Validates: Requirements 4.5**

### Property 12: Voice Chat STT Migration
*For any* voice chat interaction, the system should use only Web Speech API with appropriate Indian English language settings and provide real-time interim results.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 13: STT Error Recovery
*For any* speech recognition error (network issues, permission denials), the system should handle errors gracefully and automatically process completed transcriptions.
**Validates: Requirements 5.4, 5.5**

### Property 14: API Backward Compatibility
*For any* existing API endpoint call, the response format should remain identical to the current implementation, ensuring frontend compatibility.
**Validates: Requirements 6.1**

### Property 15: Cache Backward Compatibility
*For any* existing cached audio file, the updated system should maintain accessibility and validity after migration.
**Validates: Requirements 6.2**

### Property 16: UI Consistency Preservation
*For any* voice chat component interaction, the user interface and behavior should remain unchanged despite the STT implementation change.
**Validates: Requirements 6.3**

### Property 17: Error Handling Consistency
*For any* error condition, the system should provide the same level of error handling and user feedback as the current implementation.
**Validates: Requirements 6.5**

### Property 18: Streaming Audio Functionality
*For any* audio streaming request, Google TTS should support real-time streaming with immediate playback when chunks are available, and fallback to non-streaming when needed.
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 19: Cache-first Audio Delivery
*For any* cached audio request, the system should serve cached files immediately without re-generation and handle streaming resource cleanup appropriately.
**Validates: Requirements 7.4, 7.5**

### Property 20: Comprehensive Operation Logging
*For any* TTS or STT operation, the system should log detailed usage metrics, error information, and cache analytics for monitoring and performance comparison.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

## Error Handling

### TTS Error Scenarios

1. **Google Cloud API Failures**
   - Invalid API key: Return null, log error, fallback to browser TTS
   - Rate limiting: Implement exponential backoff, cache aggressively
   - Network timeouts: Retry with shorter text chunks, fallback to browser TTS
   - Quota exceeded: Log warning, fallback to browser TTS, notify administrators

2. **Voice Configuration Errors**
   - Unsupported language: Fallback to English voice with warning log
   - Invalid voice parameters: Use default voice configuration
   - SSML parsing errors: Strip SSML tags and use plain text

3. **Audio Generation Failures**
   - Empty audio response: Retry once, then fallback to browser TTS
   - Corrupted audio data: Validate audio headers, regenerate if needed
   - Streaming interruptions: Switch to non-streaming mode

### STT Error Scenarios

1. **Web Speech API Unavailability**
   - Browser not supported: Show clear message with supported browser list
   - HTTPS requirement: Display security warning and HTTPS requirement
   - Permissions denied: Guide user through microphone permission setup

2. **Recognition Failures**
   - No speech detected: Provide visual feedback, suggest speaking louder
   - Network errors: Show offline message, suggest trying again
   - Language not supported: Fallback to English, log unsupported language

3. **Audio Input Issues**
   - Microphone access denied: Clear instructions for enabling permissions
   - Poor audio quality: Suggest better microphone or quieter environment
   - Background noise: Implement noise detection and user guidance

## Testing Strategy

### Unit Testing

**TTS Service Tests:**
- Test Google Cloud TTS API integration with mock responses
- Verify voice selection logic for different languages
- Test audio format conversion and validation
- Verify fallback mechanisms when API fails

**STT Service Tests:**
- Mock Web Speech API for consistent testing
- Test language configuration and recognition setup
- Verify event handling for results and errors
- Test browser compatibility detection

**Language Service Tests:**
- Test language code mapping to Google TTS voices
- Verify speech recognition language configuration
- Test fallback language selection

### Integration Testing

**End-to-End Audio Flow:**
- Test complete TTS pipeline from text input to audio playback
- Verify audio caching integration with new TTS service
- Test streaming audio delivery and client playback
- Validate multi-language audio generation

**Voice Chat Integration:**
- Test STT integration with existing voice chat components
- Verify real-time transcription and interim results handling
- Test error recovery and user feedback mechanisms
- Validate conversation flow with new STT implementation

### Property-Based Testing

**Property Tests:**
- Generate random text inputs and verify consistent audio output
- Test language code variations and voice mapping consistency
- Verify cache key generation and retrieval across different inputs
- Test streaming chunk delivery order and completeness

### Performance Testing

**TTS Performance:**
- Measure Google TTS API response times vs ElevenLabs
- Test concurrent audio generation requests
- Verify memory usage during streaming operations
- Measure cache hit rates and cost savings

**STT Performance:**
- Test recognition accuracy with various Indian English accents
- Measure transcription latency and real-time performance
- Test continuous recognition stability over extended periods
- Verify browser resource usage during active recognition

### Compatibility Testing

**Browser Compatibility:**
- Test Web Speech API support across major browsers
- Verify audio playback compatibility with generated formats
- Test mobile browser speech recognition functionality
- Validate HTTPS requirement handling

**API Compatibility:**
- Verify existing API endpoints return identical response formats
- Test backward compatibility with cached audio files
- Validate client-side component integration
- Test deployment compatibility with existing infrastructure

## Implementation Notes

### Google Cloud TTS Setup (Working Configuration)

1. **Authentication Method:**
   - API Key authentication (simpler than service account)
   - Set `GOOGLE_API_KEY` environment variable
   - No need for service account JSON files

2. **Voice Selection Strategy:**
   - Use Wavenet voices for better quality (e.g., `en-IN-Wavenet-A`)
   - Fallback to Standard voices if Wavenet unavailable
   - Language code extracted from voice name (e.g., `en-IN-Wavenet-A` → `en-IN`)

3. **Audio Configuration:**
   - MP3 encoding for web compatibility
   - Default speaking rate: 1.0 (configurable)
   - Default pitch: 0.0 (configurable)
   - No volume gain adjustment needed

4. **Dependencies Required:**
   ```bash
   npm install @google-cloud/text-to-speech
   ```

### Dual-Provider Implementation Strategy

1. **Provider Priority System:**
   ```typescript
   const providerOrder = process.env.TTS_PROVIDER === 'elevenlabs' 
     ? ['elevenlabs', 'google', 'browser']
     : ['google', 'elevenlabs', 'browser'];
   ```

2. **Fallback Logic:**
   - Try primary provider first
   - On failure, try secondary provider
   - Final fallback to browser TTS
   - Log each attempt and result

3. **Environment-Based Switching:**
   - Change `TTS_PROVIDER=google` to use Google as primary
   - Change `TTS_PROVIDER=elevenlabs` to use ElevenLabs as primary
   - Set `TTS_FALLBACK_ENABLED=false` to disable fallback

4. **Streaming Compatibility:**
   - Google TTS doesn't support true streaming
   - Implement pseudo-streaming by yielding full buffer as single chunk
   - Maintain same interface as ElevenLabs streaming

### Language Support Implementation

1. **Voice Mapping:**
   ```typescript
   const GOOGLE_VOICES = {
     'en': 'en-IN-Wavenet-A',
     'hi': 'hi-IN-Wavenet-A', 
     'ta': 'ta-IN-Wavenet-A',
     'te': 'te-IN-Standard-A',
     'bn': 'bn-IN-Wavenet-A',
     'gu': 'gu-IN-Wavenet-A',
     'mr': 'mr-IN-Wavenet-A',
     'kn': 'kn-IN-Wavenet-A',
     'ml': 'ml-IN-Wavenet-A',
     'pa': 'pa-IN-Wavenet-A'
   };
   ```

2. **Language Code Extraction:**
   - Extract language from voice ID: `en-IN-Wavenet-A` → `en-IN`
   - Use for both Google TTS and Web Speech API
   - Maintain consistency across providers

### Web Speech API Enhancement

1. **Language Configuration:**
   ```typescript
   recognition.lang = 'en-IN'; // Primary
   recognition.continuous = false;
   recognition.interimResults = true;
   recognition.maxAlternatives = 1;
   ```

2. **Error Handling:**
   - Check browser support before initialization
   - Handle permission denied gracefully
   - Provide clear user feedback for common issues

3. **Performance Optimization:**
   - Restart recognition on certain errors
   - Implement confidence threshold filtering
   - Add timeout handling for long silences