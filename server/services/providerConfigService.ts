import { TTSConfig, TTSProviderName } from './types/ttsTypes';

/**
 * Provider Configuration Service
 * Manages environment-based configuration for TTS providers
 */
export class ProviderConfigService {
  private config: TTSConfig;
  
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }
  
  /**
   * Load configuration from environment variables
   */
  private loadConfig(): TTSConfig {
    const primaryProvider = this.getPrimaryProviderFromEnv();
    const fallbackEnabled = process.env.TTS_FALLBACK_ENABLED !== 'false';
    
    return {
      primaryProvider,
      fallbackEnabled,
      providers: {
        google: {
          enabled: !!process.env.GOOGLE_API_KEY,
          apiKey: process.env.GOOGLE_API_KEY,
          projectId: process.env.GOOGLE_PROJECT_ID
        },
        elevenlabs: {
          enabled: !!process.env.ELEVENLABS_API_KEY,
          apiKey: process.env.ELEVENLABS_API_KEY
        }
      }
    };
  }
  
  /**
   * Get primary provider from environment
   */
  private getPrimaryProviderFromEnv(): TTSProviderName {
    const provider = process.env.TTS_PROVIDER?.toLowerCase();
    
    if (provider === 'elevenlabs') {
      return 'elevenlabs';
    } else if (provider === 'google') {
      return 'google';
    } else {
      // Default to Google if not specified
      return 'google';
    }
  }
  
  /**
   * Validate the loaded configuration
   */
  private validateConfig(): void {
    const errors: string[] = [];
    
    // Check if at least one provider is configured
    const hasGoogleConfig = this.config.providers.google.enabled;
    const hasElevenLabsConfig = this.config.providers.elevenlabs.enabled;
    
    if (!hasGoogleConfig && !hasElevenLabsConfig) {
      errors.push('No TTS providers are configured. Please set GOOGLE_API_KEY or ELEVENLABS_API_KEY.');
    }
    
    // Check if primary provider is available
    const primaryProvider = this.config.primaryProvider;
    const isPrimaryAvailable = this.config.providers[primaryProvider].enabled;
    
    if (!isPrimaryAvailable) {
      const providerName = primaryProvider === 'google' ? 'Google' : 'ElevenLabs';
      const envVar = primaryProvider === 'google' ? 'GOOGLE_API_KEY' : 'ELEVENLABS_API_KEY';
      
      console.warn(`⚠️ Primary TTS provider (${providerName}) is not configured. Please set ${envVar}.`);
      
      // If fallback is enabled and available, continue with warning
      const fallbackProvider = primaryProvider === 'google' ? 'elevenlabs' : 'google';
      const isFallbackAvailable = this.config.providers[fallbackProvider].enabled;
      
      if (this.config.fallbackEnabled && isFallbackAvailable) {
        console.log(`✓ Fallback provider (${fallbackProvider === 'google' ? 'Google' : 'ElevenLabs'}) is available.`);
      } else {
        errors.push(`Primary provider (${providerName}) is not configured and no fallback is available.`);
      }
    }
    
    if (errors.length > 0) {
      console.error('❌ TTS Configuration Errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error(`TTS Configuration validation failed: ${errors.join('; ')}`);
    }
    
    console.log('✓ TTS Configuration validated successfully');
    this.logConfiguration();
  }
  
  /**
   * Log current configuration for debugging
   */
  private logConfiguration(): void {
    console.log('📋 TTS Configuration:');
    console.log(`  Primary Provider: ${this.config.primaryProvider}`);
    console.log(`  Fallback Enabled: ${this.config.fallbackEnabled}`);
    console.log(`  Google TTS: ${this.config.providers.google.enabled ? '✓ Enabled' : '❌ Disabled'}`);
    console.log(`  ElevenLabs TTS: ${this.config.providers.elevenlabs.enabled ? '✓ Enabled' : '❌ Disabled'}`);
  }
  
  /**
   * Get current configuration
   */
  getConfig(): TTSConfig {
    return { ...this.config };
  }
  
  /**
   * Check if a provider is enabled
   */
  isProviderEnabled(provider: TTSProviderName): boolean {
    return this.config.providers[provider].enabled;
  }
  
  /**
   * Get provider priority order
   */
  getProviderPriority(): TTSProviderName[] {
    const primary = this.config.primaryProvider;
    const fallback = primary === 'google' ? 'elevenlabs' : 'google';
    
    if (this.config.fallbackEnabled && this.isProviderEnabled(fallback)) {
      return [primary, fallback];
    } else {
      return [primary];
    }
  }
  
  /**
   * Get primary provider
   */
  getPrimaryProvider(): TTSProviderName {
    return this.config.primaryProvider;
  }
  
  /**
   * Check if fallback is enabled
   */
  isFallbackEnabled(): boolean {
    return this.config.fallbackEnabled;
  }
  
  /**
   * Get provider configuration for a specific provider
   */
  getProviderConfig(provider: TTSProviderName): TTSConfig['providers'][TTSProviderName] {
    return this.config.providers[provider];
  }
  
  /**
   * Reload configuration from environment (useful for runtime changes)
   */
  reloadConfig(): void {
    console.log('🔄 Reloading TTS configuration...');
    this.config = this.loadConfig();
    this.validateConfig();
  }
  
  /**
   * Get configuration summary for monitoring/admin purposes
   */
  getConfigSummary(): {
    primaryProvider: TTSProviderName;
    fallbackEnabled: boolean;
    enabledProviders: TTSProviderName[];
    providerPriority: TTSProviderName[];
  } {
    const enabledProviders: TTSProviderName[] = [];
    
    if (this.config.providers.google.enabled) {
      enabledProviders.push('google');
    }
    if (this.config.providers.elevenlabs.enabled) {
      enabledProviders.push('elevenlabs');
    }
    
    return {
      primaryProvider: this.config.primaryProvider,
      fallbackEnabled: this.config.fallbackEnabled,
      enabledProviders,
      providerPriority: this.getProviderPriority()
    };
  }
}

// Export singleton instance
export const providerConfigService = new ProviderConfigService();