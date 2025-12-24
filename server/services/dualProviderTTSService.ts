import { TTSProvider, TTSOptions, TTSUsageLog, TTSProviderName } from './types/ttsTypes';
import { GoogleTTSProvider } from './providers/googleTTSProvider';
import { ElevenLabsTTSProvider } from './providers/elevenLabsTTSProvider';
import { TTSCostEstimator } from './ttsCostEstimator';
import { ttsPerformanceMonitor } from './ttsPerformanceMonitor';
import { v4 as uuidv4 } from 'uuid';

/**
 * Dual Provider TTS Service
 * Orchestrates between Google TTS (primary) and ElevenLabs (fallback)
 * with automatic failover and comprehensive logging
 */
export class DualProviderTTSService {
  private providers: Map<TTSProviderName, TTSProvider>;
  private usageLogs: TTSUsageLog[] = [];
  
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }
  
  private initializeProviders(): void {
    // Initialize Google TTS Provider
    const googleProvider = new GoogleTTSProvider();
    this.providers.set('google', googleProvider);
    
    // Initialize ElevenLabs Provider
    const elevenLabsProvider = new ElevenLabsTTSProvider();
    this.providers.set('elevenlabs', elevenLabsProvider);
    
    console.log('✓ Dual Provider TTS Service initialized');
  }
  
  /**
   * Generate speech audio with automatic provider fallback
   */
  async textToSpeech(text: string, options?: TTSOptions, requestContext?: { userAgent?: string; ipAddress?: string }): Promise<Buffer | null> {
    const startTime = Date.now();
    const requestId = uuidv4();
    const providerOrder = this.getProviderOrder();
    
    console.log(`[TTS-${requestId}] Starting TTS request: ${text.length} characters`);
    
    for (const providerName of providerOrder) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;
      
      try {
        // Check if provider is available
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.log(`[TTS-${requestId}] ${providerName} TTS provider not available, trying next...`);
          continue;
        }
        
        console.log(`[TTS-${requestId}] 🎤 Attempting TTS with ${providerName} provider...`);
        const result = await provider.textToSpeech(text, options);
        
        if (result) {
          const responseTime = Date.now() - startTime;
          const costEstimate = TTSCostEstimator.getCostEstimate(providerName, text.length, options?.voiceId);
          
          this.logUsage({
            timestamp: new Date(),
            provider: providerName,
            success: true,
            responseTime,
            characterCount: text.length,
            languageCode: options?.languageCode,
            voiceId: options?.voiceId,
            modelId: options?.modelId,
            fallbackUsed: providerName !== this.getPrimaryProvider(),
            audioSizeBytes: result.length,
            estimatedCost: costEstimate.estimatedCost,
            requestId,
            userAgent: requestContext?.userAgent,
            ipAddress: requestContext?.ipAddress
          });
          
          console.log(`[TTS-${requestId}] ✅ ${providerName} TTS success (${responseTime}ms, ${result.length} bytes, ~$${costEstimate.estimatedCost.toFixed(6)})`);
          return result;
        }
      } catch (error) {
        console.error(`[TTS-${requestId}] ❌ ${providerName} TTS failed:`, error);
        
        const responseTime = Date.now() - startTime;
        const costEstimate = TTSCostEstimator.getCostEstimate(providerName, text.length, options?.voiceId);
        
        this.logUsage({
          timestamp: new Date(),
          provider: providerName,
          success: false,
          responseTime,
          characterCount: text.length,
          languageCode: options?.languageCode,
          voiceId: options?.voiceId,
          modelId: options?.modelId,
          errorMessage: error instanceof Error ? error.message : String(error),
          fallbackUsed: providerName !== this.getPrimaryProvider(),
          estimatedCost: costEstimate.estimatedCost,
          requestId,
          userAgent: requestContext?.userAgent,
          ipAddress: requestContext?.ipAddress
        });
      }
    }
    
    // All providers failed, try browser TTS as final fallback
    console.log(`[TTS-${requestId}] ⚠️ All TTS providers failed, browser TTS will be used as fallback`);
    
    const responseTime = Date.now() - startTime;
    this.logUsage({
      timestamp: new Date(),
      provider: 'browser',
      success: false, // We don't generate browser TTS here, just log the fallback
      responseTime,
      characterCount: text.length,
      languageCode: options?.languageCode,
      errorMessage: 'All API providers failed, falling back to browser TTS',
      fallbackUsed: true,
      requestId,
      userAgent: requestContext?.userAgent,
      ipAddress: requestContext?.ipAddress
    });
    
    return null;
  }
  
  /**
   * Generate streaming speech audio with automatic provider fallback
   */
  async textToSpeechStream(text: string, options?: TTSOptions, requestContext?: { userAgent?: string; ipAddress?: string }): Promise<AsyncIterable<Buffer> | null> {
    const startTime = Date.now();
    const requestId = uuidv4();
    const providerOrder = this.getProviderOrder();
    
    console.log(`[TTS-STREAM-${requestId}] Starting streaming TTS request: ${text.length} characters`);
    
    for (const providerName of providerOrder) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;
      
      try {
        // Check if provider is available
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.log(`[TTS-STREAM-${requestId}] ${providerName} TTS provider not available for streaming, trying next...`);
          continue;
        }
        
        console.log(`[TTS-STREAM-${requestId}] 🎤 Attempting streaming TTS with ${providerName} provider...`);
        const result = await provider.textToSpeechStream(text, options);
        
        if (result) {
          const responseTime = Date.now() - startTime;
          const costEstimate = TTSCostEstimator.getCostEstimate(providerName, text.length, options?.voiceId);
          
          this.logUsage({
            timestamp: new Date(),
            provider: providerName,
            success: true,
            responseTime,
            characterCount: text.length,
            languageCode: options?.languageCode,
            voiceId: options?.voiceId,
            modelId: options?.modelId,
            fallbackUsed: providerName !== this.getPrimaryProvider(),
            estimatedCost: costEstimate.estimatedCost,
            requestId,
            userAgent: requestContext?.userAgent,
            ipAddress: requestContext?.ipAddress
          });
          
          console.log(`[TTS-STREAM-${requestId}] ✅ ${providerName} streaming TTS success (${responseTime}ms, ~$${costEstimate.estimatedCost.toFixed(6)})`);
          return result;
        }
      } catch (error) {
        console.error(`[TTS-STREAM-${requestId}] ❌ ${providerName} streaming TTS failed:`, error);
        
        const responseTime = Date.now() - startTime;
        const costEstimate = TTSCostEstimator.getCostEstimate(providerName, text.length, options?.voiceId);
        
        this.logUsage({
          timestamp: new Date(),
          provider: providerName,
          success: false,
          responseTime,
          characterCount: text.length,
          languageCode: options?.languageCode,
          voiceId: options?.voiceId,
          modelId: options?.modelId,
          errorMessage: error instanceof Error ? error.message : String(error),
          fallbackUsed: providerName !== this.getPrimaryProvider(),
          estimatedCost: costEstimate.estimatedCost,
          requestId,
          userAgent: requestContext?.userAgent,
          ipAddress: requestContext?.ipAddress
        });
      }
    }
    
    // All providers failed
    console.log(`[TTS-STREAM-${requestId}] ⚠️ All streaming TTS providers failed`);
    return null;
  }
  
  /**
   * Get provider order based on configuration
   */
  private getProviderOrder(): TTSProviderName[] {
    const primaryProvider = this.getPrimaryProvider();
    const fallbackEnabled = process.env.TTS_FALLBACK_ENABLED !== 'false';
    
    if (primaryProvider === 'elevenlabs') {
      return fallbackEnabled ? ['elevenlabs', 'google'] : ['elevenlabs'];
    } else {
      return fallbackEnabled ? ['google', 'elevenlabs'] : ['google'];
    }
  }
  
  /**
   * Get primary provider from environment configuration
   */
  private getPrimaryProvider(): TTSProviderName {
    const provider = process.env.TTS_PROVIDER?.toLowerCase();
    return (provider === 'elevenlabs') ? 'elevenlabs' : 'google';
  }
  
  /**
   * Log TTS usage for monitoring and analytics
   */
  private logUsage(log: TTSUsageLog): void {
    this.usageLogs.push(log);
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.usageLogs.length > 1000) {
      this.usageLogs = this.usageLogs.slice(-1000);
    }
    
    // Log to console for monitoring
    const fallbackText = log.fallbackUsed ? ' (fallback)' : '';
    const statusText = log.success ? '✅' : '❌';
    console.log(
      `[TTS] ${statusText} ${log.provider}${fallbackText} - ${log.characterCount} chars - ${log.responseTime}ms`
    );
  }
  
  /**
   * Get usage statistics for monitoring
   */
  getUsageStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    averageResponseTime: number;
    totalCharacters: number;
    totalEstimatedCost: number;
    providerStats: { [key: string]: { requests: number; successRate: number; avgResponseTime: number; totalCost: number } };
    fallbackUsage: number;
    costSavings: {
      totalSavings: number;
      percentageSaved: number;
    };
    recentErrors: string[];
  } {
    if (this.usageLogs.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        totalCharacters: 0,
        totalEstimatedCost: 0,
        providerStats: {},
        fallbackUsage: 0,
        costSavings: {
          totalSavings: 0,
          percentageSaved: 0
        },
        recentErrors: []
      };
    }
    
    const totalRequests = this.usageLogs.length;
    const successfulRequests = this.usageLogs.filter(log => log.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const successRate = (successfulRequests / totalRequests) * 100;
    const averageResponseTime = this.usageLogs.reduce((sum, log) => sum + log.responseTime, 0) / totalRequests;
    const totalCharacters = this.usageLogs.reduce((sum, log) => sum + log.characterCount, 0);
    const totalEstimatedCost = this.usageLogs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);
    const fallbackUsage = this.usageLogs.filter(log => log.fallbackUsed).length;
    
    // Provider-specific stats
    const providerStats: { [key: string]: { requests: number; successRate: number; avgResponseTime: number; totalCost: number } } = {};
    
    for (const provider of ['google', 'elevenlabs', 'browser']) {
      const providerLogs = this.usageLogs.filter(log => log.provider === provider);
      if (providerLogs.length > 0) {
        const providerSuccesses = providerLogs.filter(log => log.success).length;
        const providerCost = providerLogs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);
        providerStats[provider] = {
          requests: providerLogs.length,
          successRate: (providerSuccesses / providerLogs.length) * 100,
          avgResponseTime: providerLogs.reduce((sum, log) => sum + log.responseTime, 0) / providerLogs.length,
          totalCost: providerCost
        };
      }
    }
    
    // Calculate cost savings (comparing primary vs fallback usage)
    const primaryProvider = this.getPrimaryProvider();
    const primaryLogs = this.usageLogs.filter(log => log.provider === primaryProvider && log.success);
    const fallbackLogs = this.usageLogs.filter(log => log.provider !== primaryProvider && log.success && log.fallbackUsed);
    
    let costSavings = { totalSavings: 0, percentageSaved: 0 };
    if (primaryLogs.length > 0 && fallbackLogs.length > 0) {
      const primaryCost = primaryLogs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);
      const fallbackCost = fallbackLogs.reduce((sum, log) => sum + (log.estimatedCost || 0), 0);
      
      // Estimate what fallback requests would have cost with primary provider
      const fallbackCharacters = fallbackLogs.reduce((sum, log) => sum + log.characterCount, 0);
      const estimatedPrimaryCostForFallback = fallbackCharacters * (primaryCost / primaryLogs.reduce((sum, log) => sum + log.characterCount, 0));
      
      costSavings.totalSavings = Math.abs(estimatedPrimaryCostForFallback - fallbackCost);
      costSavings.percentageSaved = (costSavings.totalSavings / (estimatedPrimaryCostForFallback + fallbackCost)) * 100;
    }
    
    // Recent errors (last 10)
    const recentErrors = this.usageLogs
      .filter(log => !log.success && log.errorMessage)
      .slice(-10)
      .map(log => log.errorMessage!)
      .filter((error, index, arr) => arr.indexOf(error) === index); // Remove duplicates
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate,
      averageResponseTime,
      totalCharacters,
      totalEstimatedCost,
      providerStats,
      fallbackUsage,
      costSavings,
      recentErrors
    };
  }
  
  /**
   * Check if a specific provider is available
   */
  async isProviderAvailable(providerName: TTSProviderName): Promise<boolean> {
    const provider = this.providers.get(providerName);
    return provider ? await provider.isAvailable() : false;
  }
  
  /**
   * Get current configuration
   */
  getConfiguration(): {
    primaryProvider: TTSProviderName;
    fallbackEnabled: boolean;
    availableProviders: TTSProviderName[];
    performanceMonitoring: boolean;
  } {
    return {
      primaryProvider: this.getPrimaryProvider(),
      fallbackEnabled: process.env.TTS_FALLBACK_ENABLED !== 'false',
      availableProviders: Array.from(this.providers.keys()),
      performanceMonitoring: true
    };
  }

  /**
   * Get performance monitoring data
   */
  getPerformanceReport() {
    return ttsPerformanceMonitor.getSystemHealthReport();
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats() {
    return ttsPerformanceMonitor.getMonitoringStats();
  }

  /**
   * Check if automatic failover should be triggered
   */
  checkFailoverRecommendation() {
    return ttsPerformanceMonitor.shouldTriggerFailover();
  }

  /**
   * Get provider health history
   */
  getProviderHealthHistory(providerName: TTSProviderName, limit?: number) {
    return ttsPerformanceMonitor.getHealthHistory(providerName, limit);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Performance monitor cleanup is handled by the singleton
    this.usageLogs = [];
  }
}