/**
 * TTS Cost Estimation Service
 * Calculates estimated costs for different TTS providers
 */

export interface CostEstimate {
  provider: 'google' | 'elevenlabs';
  characterCount: number;
  estimatedCost: number;
  currency: string;
  rateType: string;
}

export class TTSCostEstimator {
  // Google Cloud TTS Pricing (as of 2024)
  // Standard voices: $4.00 per 1 million characters
  // WaveNet voices: $16.00 per 1 million characters
  private static readonly GOOGLE_STANDARD_RATE = 4.00 / 1_000_000; // $0.000004 per character
  private static readonly GOOGLE_WAVENET_RATE = 16.00 / 1_000_000; // $0.000016 per character

  // ElevenLabs Pricing (as of 2024)
  // Starter: $5/month for 30,000 characters
  // Creator: $22/month for 100,000 characters
  // Pro: $99/month for 500,000 characters
  // Scale: $330/month for 2,000,000 characters
  private static readonly ELEVENLABS_RATE = 22.00 / 100_000; // $0.00022 per character (Creator plan)

  /**
   * Estimate cost for Google TTS
   */
  static estimateGoogleCost(characterCount: number, voiceId?: string): CostEstimate {
    // Determine if it's a WaveNet voice
    const isWaveNet = voiceId?.includes('Wavenet') || voiceId?.includes('Neural2') || voiceId?.includes('Studio');
    const rate = isWaveNet ? this.GOOGLE_WAVENET_RATE : this.GOOGLE_STANDARD_RATE;
    const rateType = isWaveNet ? 'WaveNet/Neural2' : 'Standard';

    return {
      provider: 'google',
      characterCount,
      estimatedCost: characterCount * rate,
      currency: 'USD',
      rateType
    };
  }

  /**
   * Estimate cost for ElevenLabs TTS
   */
  static estimateElevenLabsCost(characterCount: number): CostEstimate {
    return {
      provider: 'elevenlabs',
      characterCount,
      estimatedCost: characterCount * this.ELEVENLABS_RATE,
      currency: 'USD',
      rateType: 'Creator Plan'
    };
  }

  /**
   * Get cost estimate for any provider
   */
  static getCostEstimate(
    provider: 'google' | 'elevenlabs',
    characterCount: number,
    voiceId?: string
  ): CostEstimate {
    switch (provider) {
      case 'google':
        return this.estimateGoogleCost(characterCount, voiceId);
      case 'elevenlabs':
        return this.estimateElevenLabsCost(characterCount);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Compare costs between providers
   */
  static compareCosts(characterCount: number, googleVoiceId?: string): {
    google: CostEstimate;
    elevenlabs: CostEstimate;
    savings: {
      amount: number;
      percentage: number;
      cheaperProvider: 'google' | 'elevenlabs';
    };
  } {
    const googleCost = this.estimateGoogleCost(characterCount, googleVoiceId);
    const elevenLabsCost = this.estimateElevenLabsCost(characterCount);

    const googleTotal = googleCost.estimatedCost;
    const elevenLabsTotal = elevenLabsCost.estimatedCost;

    const cheaperProvider = googleTotal < elevenLabsTotal ? 'google' : 'elevenlabs';
    const savings = Math.abs(googleTotal - elevenLabsTotal);
    const percentage = savings / Math.max(googleTotal, elevenLabsTotal) * 100;

    return {
      google: googleCost,
      elevenlabs: elevenLabsCost,
      savings: {
        amount: savings,
        percentage,
        cheaperProvider
      }
    };
  }

  /**
   * Calculate monthly cost projection based on usage
   */
  static calculateMonthlyProjection(
    dailyCharacterCount: number,
    provider: 'google' | 'elevenlabs',
    voiceId?: string
  ): {
    dailyCost: number;
    weeklyCost: number;
    monthlyCost: number;
    yearlyCost: number;
  } {
    const dailyEstimate = this.getCostEstimate(provider, dailyCharacterCount, voiceId);
    const dailyCost = dailyEstimate.estimatedCost;

    return {
      dailyCost,
      weeklyCost: dailyCost * 7,
      monthlyCost: dailyCost * 30,
      yearlyCost: dailyCost * 365
    };
  }

  /**
   * Get cost breakdown by voice type for Google TTS
   */
  static getGoogleVoiceCostBreakdown(characterCount: number): {
    standard: CostEstimate;
    wavenet: CostEstimate;
    savings: number;
    savingsPercentage: number;
  } {
    const standard = this.estimateGoogleCost(characterCount, 'en-US-Standard-A');
    const wavenet = this.estimateGoogleCost(characterCount, 'en-US-Wavenet-A');
    
    const savings = wavenet.estimatedCost - standard.estimatedCost;
    const savingsPercentage = (savings / wavenet.estimatedCost) * 100;

    return {
      standard,
      wavenet,
      savings,
      savingsPercentage
    };
  }
}