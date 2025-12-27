/**
 * Enhanced Native Speech-to-Text Service
 * Uses Web Speech API with improved error handling and configuration
 */

export interface STTOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface STTResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface STTCallbacks {
  onResult?: (result: STTResult) => void;
  onInterimResult?: (transcript: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onNoMatch?: () => void;
}

export class NativeSTTService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isListening: boolean = false;
  private callbacks: STTCallbacks = {};
  private options: STTOptions = {};
  private shouldStop: boolean = false; // Flag to prevent auto-restart

  constructor() {
    this.initializeRecognition();
  }

  /**
   * Initialize Web Speech API recognition
   */
  private initializeRecognition(): void {
    console.log('🎤 [STT] Initializing Web Speech API...');
    
    // Check for Web Speech API support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('❌ [STT] Web Speech API not supported in this browser');
      this.isSupported = false;
      return;
    }

    console.log('✅ [STT] Web Speech API found');
    this.isSupported = true;
    
    try {
      this.recognition = new SpeechRecognition();
      console.log('✅ [STT] SpeechRecognition instance created');
      this.setupRecognitionHandlers();
      console.log('✅ [STT] Event handlers configured');
    } catch (error) {
      console.error('❌ [STT] Failed to initialize SpeechRecognition:', error);
      this.isSupported = false;
    }
  }

  /**
   * Setup event handlers for speech recognition
   */
  private setupRecognitionHandlers(): void {
    if (!this.recognition) return;

    // Recognition starts
    this.recognition.onstart = () => {
      console.log('✅ [STT] Speech recognition started');
      this.isListening = true;
      this.shouldStop = false; // Reset the stop flag when starting
      this.callbacks.onStart?.();
    };

    // Recognition ends
    this.recognition.onend = () => {
      console.log('🎤 [STT] Speech recognition ended');
      this.isListening = false;
      
      // If we were supposed to be listening continuously and haven't been explicitly stopped,
      // and we have an onStart callback (indicating we should continue), then restart
      if (this.options.continuous && !this.shouldStop && this.callbacks.onStart) {
        console.log('🔄 [STT] Auto-restarting continuous recognition...');
        setTimeout(() => {
          if (!this.isListening && !this.shouldStop) {
            try {
              this.recognition.start();
            } catch (error) {
              console.error('❌ [STT] Failed to restart recognition:', error);
              this.callbacks.onError?.('Recognition stopped unexpectedly');
            }
          }
        }, 100);
      } else {
        this.callbacks.onEnd?.();
      }
    };

    // Results received
    this.recognition.onresult = (event: any) => {
      console.log('🎤 [STT] Results received, event:', event);
      console.log('🎤 [STT] Total results:', event.results.length);
      
      // Process all results to build complete transcript
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript;
          console.log(`🎤 [STT] Final result ${i}: "${transcript}"`);
        } else {
          interimTranscript += transcript;
          console.log(`🎤 [STT] Interim result ${i}: "${transcript}"`);
        }
      }
      
      // Send callbacks
      if (finalTranscript) {
        this.callbacks.onResult?.({
          transcript: finalTranscript,
          confidence: event.results[event.results.length - 1][0].confidence || 0,
          isFinal: true
        });
      }
      
      if (interimTranscript) {
        this.callbacks.onInterimResult?.(interimTranscript);
      }
    };

    // No speech detected
    this.recognition.onnomatch = () => {
      console.log('⚠️ [STT] No speech detected');
      this.callbacks.onNoMatch?.();
    };

    // Error handling
    this.recognition.onerror = (event: any) => {
      const error = event.error;
      console.error('❌ [STT] Speech recognition error:', error, 'Event:', event);
      
      let errorMessage = 'Speech recognition failed';
      
      switch (error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred during speech recognition.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed.';
          break;
        case 'bad-grammar':
          errorMessage = 'Speech recognition grammar error.';
          break;
        case 'language-not-supported':
          errorMessage = 'Selected language not supported for speech recognition.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${error}`;
      }
      
      console.error('❌ [STT] Processed error message:', errorMessage);
      this.callbacks.onError?.(errorMessage);
    };
  }

  /**
   * Check if speech recognition is supported
   */
  isSTTSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Check if currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Start speech recognition
   */
  startListening(options?: STTOptions, callbacks?: STTCallbacks): boolean {
    console.log('🎤 [STT] Starting speech recognition...');
    
    if (!this.isSupported) {
      console.error('❌ [STT] Speech recognition not supported');
      callbacks?.onError?.('Speech recognition not supported in this browser');
      return false;
    }

    if (this.isListening) {
      console.warn('⚠️ [STT] Speech recognition already active');
      return false;
    }

    // Store options and callbacks
    this.options = { ...this.getDefaultOptions(), ...options };
    this.callbacks = callbacks || {};

    console.log('🎤 [STT] Configuration:', this.options);

    // Configure recognition
    this.configureRecognition();

    try {
      console.log('🎤 [STT] Attempting to start recognition...');
      this.recognition.start();
      console.log('✅ [STT] Recognition start command sent');
      return true;
    } catch (error) {
      console.error('❌ [STT] Failed to start speech recognition:', error);
      
      let errorMessage = 'Failed to start speech recognition';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      this.callbacks.onError?.(errorMessage);
      return false;
    }
  }

  /**
   * Stop speech recognition
   */
  stopListening(): void {
    if (!this.recognition || !this.isListening) {
      return;
    }
    
    this.shouldStop = true; // Set the flag to prevent auto-restart
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  /**
   * Abort speech recognition immediately
   */
  abortListening(): void {
    if (!this.recognition || !this.isListening) {
      return;
    }
    
    this.shouldStop = true; // Set the flag to prevent auto-restart
    try {
      this.recognition.abort();
    } catch (error) {
      console.error('Error aborting speech recognition:', error);
    }
  }

  /**
   * Get default STT options
   */
  private getDefaultOptions(): STTOptions {
    return {
      language: 'en-IN', // Indian English by default
      continuous: false,
      interimResults: true,
      maxAlternatives: 1
    };
  }

  /**
   * Configure recognition with current options
   */
  private configureRecognition(): void {
    if (!this.recognition) return;

    this.recognition.lang = this.options.language || 'en-IN';
    this.recognition.continuous = this.options.continuous || false;
    this.recognition.interimResults = this.options.interimResults || true;
    this.recognition.maxAlternatives = this.options.maxAlternatives || 1;

    console.log('🎤 STT configured:', {
      language: this.recognition.lang,
      continuous: this.recognition.continuous,
      interimResults: this.recognition.interimResults,
      maxAlternatives: this.recognition.maxAlternatives
    });
  }

  /**
   * Get supported languages (if available)
   */
  getSupportedLanguages(): string[] {
    // Common languages supported by most browsers
    return [
      'en-US', // English (US)
      'en-IN', // English (India)
      'en-GB', // English (UK)
      'hi-IN', // Hindi (India)
      'ta-IN', // Tamil (India)
      'te-IN', // Telugu (India)
      'bn-IN', // Bengali (India)
      'gu-IN', // Gujarati (India)
      'kn-IN', // Kannada (India)
      'ml-IN', // Malayalam (India)
      'mr-IN', // Marathi (India)
      'pa-IN', // Punjabi (India)
    ];
  }

  /**
   * Check microphone permissions
   */
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately as we only needed to check permission
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Microphone permission check failed:', error);
      return false;
    }
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const hasPermission = await this.checkMicrophonePermission();
      if (hasPermission) {
        console.log('✅ Microphone permission granted');
        return true;
      } else {
        console.log('❌ Microphone permission denied');
        return false;
      }
    } catch (error) {
      console.error('Failed to request microphone permission:', error);
      return false;
    }
  }

  /**
   * Get browser compatibility info
   */
  getBrowserCompatibility(): {
    isSupported: boolean;
    browserName: string;
    hasWebkitPrefix: boolean;
  } {
    const hasWebkit = !!(window as any).webkitSpeechRecognition;
    const hasStandard = !!(window as any).SpeechRecognition;
    
    let browserName = 'Unknown';
    if (navigator.userAgent.includes('Chrome')) browserName = 'Chrome';
    else if (navigator.userAgent.includes('Firefox')) browserName = 'Firefox';
    else if (navigator.userAgent.includes('Safari')) browserName = 'Safari';
    else if (navigator.userAgent.includes('Edge')) browserName = 'Edge';

    return {
      isSupported: hasWebkit || hasStandard,
      browserName,
      hasWebkitPrefix: hasWebkit
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.isListening) {
      this.stopListening();
    }
    
    this.callbacks = {};
    this.options = {};
  }
}

// Export singleton instance
export const nativeSTTService = new NativeSTTService();