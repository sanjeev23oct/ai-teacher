# Implementation Plan

- [x] 1. Install Google Cloud TTS dependencies and update environment configuration
  - Install @google-cloud/text-to-speech package
  - Add Google TTS environment variables to .env.example
  - Update server package.json with new dependency
  - _Requirements: 4.1, 4.2_

- [x] 2. Create dual-provider TTS service architecture
  - [x] 2.1 Create TTSProvider interface and base types
    - Define TTSProvider interface with common methods
    - Create TTSOptions interface for voice configuration
    - Add provider priority and availability checking
    - _Requirements: 1.1, 4.2_

  - [x] 2.2 Implement Google TTS Provider based on working implementation
    - Create GoogleTTSProvider class with API key authentication
    - Implement textToSpeech method using Google Cloud TTS client
    - Add pseudo-streaming support for textToSpeechStream
    - Include humanizeMathText function for educational content
    - _Requirements: 1.1, 1.4, 3.1_

  - [ ]* 2.3 Write property test for Google TTS provider
    - **Property 1: Primary Provider Usage**
    - **Validates: Requirements 1.1**

  - [x] 2.4 Refactor existing ElevenLabs code into ElevenLabsTTSProvider
    - Extract current ElevenLabs logic into provider class
    - Implement TTSProvider interface
    - Maintain existing functionality and voice configurations
    - _Requirements: 1.2, 6.1_

  - [ ]* 2.5 Write property test for ElevenLabs TTS provider
    - **Property 2: Automatic Provider Fallback**
    - **Validates: Requirements 1.2**

  - [x] 2.6 Create DualProviderTTSService orchestrator
    - Implement provider selection logic based on environment variables
    - Add automatic fallback mechanism between providers
    - Include comprehensive logging for provider usage
    - Handle browser TTS as final fallback
    - _Requirements: 1.2, 1.3, 4.3_

  - [ ]* 2.7 Write property test for dual provider fallback
    - **Property 3: Multi-level Fallback Chain**
    - **Validates: Requirements 1.3**

- [x] 3. Update environment configuration and provider selection
  - [x] 3.1 Add Google TTS environment variables
    - Add GOOGLE_API_KEY configuration
    - Add TTS_PROVIDER selection variable
    - Add TTS_FALLBACK_ENABLED flag
    - Add language-specific Google voice configurations
    - _Requirements: 4.1, 4.2_

  - [x] 3.2 Create ProviderConfigService for environment-based configuration
    - Load and validate TTS provider configuration
    - Implement provider priority determination
    - Add configuration validation and error handling
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ]* 3.3 Write property test for provider configuration
    - **Property 4: Provider Configuration Flexibility**
    - **Validates: Requirements 4.2, 4.3, 4.4**

- [ ] 4. Update language service for dual-provider voice mapping
  - [x] 4.1 Extend language service with Google voice mappings
    - Add Google TTS voice configurations for all supported languages
    - Map internal language codes to Google voice IDs
    - Maintain existing ElevenLabs voice mappings
    - _Requirements: 3.1, 3.2_

  - [x] 4.2 Implement provider-specific voice selection
    - Create getVoiceForProvider method
    - Handle voice fallbacks for unavailable languages
    - Add voice validation and error handling
    - _Requirements: 3.2, 3.3, 3.5_

  - [ ]* 4.3 Write property test for language voice mapping
    - **Property 6: Language Voice Mapping Consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update existing TTS service to use dual-provider system
  - [x] 6.1 Replace current ttsService.ts with dual-provider implementation
    - Update textToSpeech function to use DualProviderTTSService
    - Update textToSpeechStream function with provider fallback
    - Maintain existing function signatures for backward compatibility
    - _Requirements: 6.1, 6.5_

  - [x] 6.2 Update all service imports and dependencies
    - Update revisionFriendService.ts TTS imports
    - Update ncertExplainerService.ts TTS imports
    - Update audioCacheService.ts provider logging
    - Ensure all existing services work with new provider system
    - _Requirements: 6.1, 6.2_

  - [ ]* 6.3 Write property test for API backward compatibility
    - **Property 14: API Backward Compatibility**
    - **Validates: Requirements 6.1**

- [ ] 7. Enhance Web Speech API integration for native STT
  - [x] 7.1 Create enhanced NativeSTTService
    - Improve Web Speech API initialization and configuration
    - Add better error handling for browser compatibility
    - Implement Indian English language configuration
    - Add real-time interim results handling
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [x] 7.2 Update VoiceChat component with enhanced STT
    - Improve speech recognition error handling
    - Add better user feedback for microphone permissions
    - Enhance visual feedback for listening states
    - Maintain existing UI behavior and appearance
    - _Requirements: 2.2, 2.4, 6.3_

  - [ ]* 7.3 Write property test for STT functionality
    - **Property 8: Real-time STT Feedback**
    - **Validates: Requirements 2.4, 2.5**

- [ ] 8. Add comprehensive logging and monitoring
  - [x] 8.1 Implement TTS usage logging
    - Log provider selection and usage for each request
    - Track response times and success rates per provider
    - Add character count and cost estimation logging
    - Include fallback usage tracking
    - _Requirements: 4.5, 8.1, 8.2_

  - [x] 8.2 Add provider performance monitoring
    - Create provider health checking
    - Implement automatic provider availability detection
    - Add performance metrics collection
    - Include cost comparison analytics
    - _Requirements: 8.1, 8.2, 8.5_

  - [ ]* 8.3 Write property test for usage logging
    - **Property 5: Provider Usage Logging**
    - **Validates: Requirements 4.5, 8.1, 8.2**

- [ ] 9. Update audio caching system for dual providers
  - [x] 9.1 Enhance audio cache to support multiple providers
    - Update cache metadata to include provider information
    - Ensure cached audio works regardless of generating provider
    - Maintain existing cache structure and compatibility
    - Add provider-agnostic cache key generation
    - _Requirements: 1.5, 6.2, 7.4_

  - [ ] 9.2 Update cache analytics for dual providers
    - Track cache hit rates per provider
    - Calculate cost savings across both providers
    - Add provider comparison metrics
    - Update admin cache management interface
    - _Requirements: 8.3, 8.5_

  - [ ]* 9.3 Write property test for cache compatibility
    - **Property 15: Cache Backward Compatibility**
    - **Validates: Requirements 6.2**

- [ ] 10. Update API endpoints and streaming support
  - [x] 10.1 Update TTS streaming endpoints
    - Ensure /api/tts/stream works with both providers
    - Add provider selection to streaming requests
    - Maintain existing streaming response format
    - Handle provider fallback during streaming
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 10.2 Update all TTS-related API endpoints
    - Update revision-friend audio streaming
    - Update smart-notes audio generation
    - Update voice-tutor TTS integration
    - Ensure consistent provider behavior across all endpoints
    - _Requirements: 6.1, 7.1_

  - [ ]* 10.3 Write property test for streaming functionality
    - **Property 18: Streaming Audio Functionality**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 11. Final integration testing and deployment preparation
  - [ ] 11.1 Test complete dual-provider system
    - Test Google TTS as primary with ElevenLabs fallback
    - Test ElevenLabs as primary with Google TTS fallback
    - Test browser TTS fallback when both APIs fail
    - Verify all existing features work with new system
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 11.2 Update deployment configuration
    - Add Google TTS environment variables to Railway deployment
    - Update .env.example with all new configuration options
    - Add deployment documentation for dual-provider setup
    - Test environment variable switching without restarts
    - _Requirements: 4.1, 4.2, 6.4_

  - [ ]* 11.3 Write integration tests for complete system
    - **Property 20: Comprehensive Operation Logging**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 12. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.