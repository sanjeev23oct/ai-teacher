/**
 * TTS Provider Performance Monitoring Service
 * Monitors health, availability, and performance metrics for TTS providers
 */

import { TTSProviderName } from './types/ttsTypes';
import { GoogleTTSProvider } from './providers/googleTTSProvider';
import { ElevenLabsTTSProvider } from './providers/elevenLabsTTSProvider';

export interface ProviderHealthCheck {
  provider: TTSProviderName;
  isAvailable: boolean;
  responseTime: number;
  timestamp: Date;
  error?: string;
}

export interface ProviderPerformanceMetrics {
  provider: TTSProviderName;
  averageResponseTime: number;
  successRate: number;
  totalRequests: number;
  uptime: number; // percentage
  lastHealthCheck: Date;
  status: 'healthy' | 'degraded' | 'unavailable';
}

export interface SystemHealthReport {
  overall: {
    status: 'healthy' | 'degraded' | 'critical';
    availableProviders: number;
    totalProviders: number;
    primaryProviderStatus: 'healthy' | 'degraded' | 'unavailable';
  };
  providers: ProviderPerformanceMetrics[];
  recommendations: string[];
  lastUpdated: Date;
}

export class TTSPerformanceMonitor {
  private healthChecks: Map<TTSProviderName, ProviderHealthCheck[]> = new Map();
  private providers: Map<TTSProviderName, any> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MAX_HEALTH_CHECKS = 100; // Keep last 100 health checks per provider
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeProviders();
    this.startMonitoring();
  }

  /**
   * Initialize TTS providers for monitoring
   */
  private initializeProviders(): void {
    this.providers.set('google', new GoogleTTSProvider());
    this.providers.set('elevenlabs', new ElevenLabsTTSProvider());
    
    // Initialize health check arrays
    this.healthChecks.set('google', []);
    this.healthChecks.set('elevenlabs', []);
    
    console.log('✓ TTS Performance Monitor initialized');
  }

  /**
   * Start automatic health monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Perform initial health check
    this.performHealthChecks();

    // Schedule regular health checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);

    console.log(`✓ TTS health monitoring started (${this.HEALTH_CHECK_INTERVAL / 1000}s interval)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('✓ TTS health monitoring stopped');
    }
  }

  /**
   * Perform health checks on all providers
   */
  async performHealthChecks(): Promise<void> {
    console.log('🔍 Performing TTS provider health checks...');
    
    const healthCheckPromises = Array.from(this.providers.entries()).map(
      ([providerName, provider]) => this.checkProviderHealth(providerName, provider)
    );

    await Promise.allSettled(healthCheckPromises);
    console.log('✅ Health checks completed');
  }

  /**
   * Check health of a specific provider
   */
  async checkProviderHealth(providerName: TTSProviderName, provider: any): Promise<ProviderHealthCheck> {
    const startTime = Date.now();
    
    try {
      const isAvailable = await provider.isAvailable();
      const responseTime = Date.now() - startTime;
      
      const healthCheck: ProviderHealthCheck = {
        provider: providerName,
        isAvailable,
        responseTime,
        timestamp: new Date()
      };

      this.recordHealthCheck(providerName, healthCheck);
      
      console.log(`[Health] ${providerName}: ${isAvailable ? '✅' : '❌'} (${responseTime}ms)`);
      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheck: ProviderHealthCheck = {
        provider: providerName,
        isAvailable: false,
        responseTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error)
      };

      this.recordHealthCheck(providerName, healthCheck);
      
      console.log(`[Health] ${providerName}: ❌ Error (${responseTime}ms) - ${healthCheck.error}`);
      return healthCheck;
    }
  }

  /**
   * Record health check result
   */
  private recordHealthCheck(providerName: TTSProviderName, healthCheck: ProviderHealthCheck): void {
    const checks = this.healthChecks.get(providerName) || [];
    checks.push(healthCheck);
    
    // Keep only the last MAX_HEALTH_CHECKS
    if (checks.length > this.MAX_HEALTH_CHECKS) {
      checks.splice(0, checks.length - this.MAX_HEALTH_CHECKS);
    }
    
    this.healthChecks.set(providerName, checks);
  }

  /**
   * Get performance metrics for a specific provider
   */
  getProviderMetrics(providerName: TTSProviderName): ProviderPerformanceMetrics | null {
    const checks = this.healthChecks.get(providerName);
    if (!checks || checks.length === 0) {
      return null;
    }

    const totalRequests = checks.length;
    const successfulChecks = checks.filter(check => check.isAvailable);
    const successRate = (successfulChecks.length / totalRequests) * 100;
    const averageResponseTime = checks.reduce((sum, check) => sum + check.responseTime, 0) / totalRequests;
    const uptime = successRate; // For simplicity, uptime = success rate
    const lastHealthCheck = checks[checks.length - 1].timestamp;
    
    // Determine status
    let status: 'healthy' | 'degraded' | 'unavailable';
    if (successRate >= 95) {
      status = 'healthy';
    } else if (successRate >= 70) {
      status = 'degraded';
    } else {
      status = 'unavailable';
    }

    return {
      provider: providerName,
      averageResponseTime,
      successRate,
      totalRequests,
      uptime,
      lastHealthCheck,
      status
    };
  }

  /**
   * Get comprehensive system health report
   */
  getSystemHealthReport(): SystemHealthReport {
    const providers: ProviderPerformanceMetrics[] = [];
    const recommendations: string[] = [];
    
    // Get metrics for each provider
    for (const providerName of this.providers.keys()) {
      const metrics = this.getProviderMetrics(providerName);
      if (metrics) {
        providers.push(metrics);
      }
    }

    // Calculate overall system status
    const availableProviders = providers.filter(p => p.status !== 'unavailable').length;
    const totalProviders = providers.length;
    const primaryProvider = this.getPrimaryProvider();
    const primaryProviderMetrics = providers.find(p => p.provider === primaryProvider);
    const primaryProviderStatus = primaryProviderMetrics?.status || 'unavailable';

    let overallStatus: 'healthy' | 'degraded' | 'critical';
    if (primaryProviderStatus === 'healthy' && availableProviders >= totalProviders * 0.8) {
      overallStatus = 'healthy';
    } else if (availableProviders > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'critical';
    }

    // Generate recommendations
    if (primaryProviderStatus === 'unavailable') {
      recommendations.push(`Primary provider (${primaryProvider}) is unavailable. Consider switching providers.`);
    }
    
    if (primaryProviderStatus === 'degraded') {
      recommendations.push(`Primary provider (${primaryProvider}) is experiencing issues. Monitor closely.`);
    }

    const degradedProviders = providers.filter(p => p.status === 'degraded');
    if (degradedProviders.length > 0) {
      recommendations.push(`Providers with degraded performance: ${degradedProviders.map(p => p.provider).join(', ')}`);
    }

    const unavailableProviders = providers.filter(p => p.status === 'unavailable');
    if (unavailableProviders.length > 0) {
      recommendations.push(`Unavailable providers: ${unavailableProviders.map(p => p.provider).join(', ')}`);
    }

    if (availableProviders === 0) {
      recommendations.push('CRITICAL: All TTS providers are unavailable. Check API keys and network connectivity.');
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems operating normally.');
    }

    return {
      overall: {
        status: overallStatus,
        availableProviders,
        totalProviders,
        primaryProviderStatus
      },
      providers,
      recommendations,
      lastUpdated: new Date()
    };
  }

  /**
   * Get recent health check history for a provider
   */
  getHealthHistory(providerName: TTSProviderName, limit: number = 20): ProviderHealthCheck[] {
    const checks = this.healthChecks.get(providerName) || [];
    return checks.slice(-limit);
  }

  /**
   * Check if automatic failover should be triggered
   */
  shouldTriggerFailover(): {
    shouldFailover: boolean;
    reason?: string;
    recommendedProvider?: TTSProviderName;
  } {
    const primaryProvider = this.getPrimaryProvider();
    const primaryMetrics = this.getProviderMetrics(primaryProvider);
    
    if (!primaryMetrics) {
      return {
        shouldFailover: true,
        reason: 'No metrics available for primary provider',
        recommendedProvider: this.getAlternativeProvider(primaryProvider)
      };
    }

    // Trigger failover if primary provider success rate is below 50%
    if (primaryMetrics.successRate < 50) {
      return {
        shouldFailover: true,
        reason: `Primary provider success rate too low: ${primaryMetrics.successRate.toFixed(1)}%`,
        recommendedProvider: this.getAlternativeProvider(primaryProvider)
      };
    }

    // Trigger failover if primary provider average response time is too high (>10 seconds)
    if (primaryMetrics.averageResponseTime > 10000) {
      return {
        shouldFailover: true,
        reason: `Primary provider response time too high: ${primaryMetrics.averageResponseTime.toFixed(0)}ms`,
        recommendedProvider: this.getAlternativeProvider(primaryProvider)
      };
    }

    return { shouldFailover: false };
  }

  /**
   * Get alternative provider for failover
   */
  private getAlternativeProvider(currentProvider: TTSProviderName): TTSProviderName {
    const alternatives: TTSProviderName[] = currentProvider === 'google' ? ['elevenlabs'] : ['google'];
    
    // Return the first available alternative
    for (const alternative of alternatives) {
      const metrics = this.getProviderMetrics(alternative);
      if (metrics && metrics.status !== 'unavailable') {
        return alternative;
      }
    }
    
    // If no alternatives are available, return the first one anyway
    return alternatives[0];
  }

  /**
   * Get primary provider from environment
   */
  private getPrimaryProvider(): TTSProviderName {
    const provider = process.env.TTS_PROVIDER?.toLowerCase();
    return (provider === 'elevenlabs') ? 'elevenlabs' : 'google';
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    checkInterval: number;
    totalHealthChecks: number;
    providersMonitored: number;
    lastCheckTime?: Date;
  } {
    const totalHealthChecks = Array.from(this.healthChecks.values())
      .reduce((sum, checks) => sum + checks.length, 0);
    
    const lastCheckTimes = Array.from(this.healthChecks.values())
      .map(checks => checks.length > 0 ? checks[checks.length - 1].timestamp : null)
      .filter(time => time !== null) as Date[];
    
    const lastCheckTime = lastCheckTimes.length > 0 
      ? new Date(Math.max(...lastCheckTimes.map(t => t.getTime())))
      : undefined;

    return {
      isMonitoring: this.monitoringInterval !== null,
      checkInterval: this.HEALTH_CHECK_INTERVAL,
      totalHealthChecks,
      providersMonitored: this.providers.size,
      lastCheckTime
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
    this.healthChecks.clear();
    this.providers.clear();
  }
}

// Export singleton instance
export const ttsPerformanceMonitor = new TTSPerformanceMonitor();