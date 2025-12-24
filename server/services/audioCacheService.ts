import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { AUDIO_CACHE_CONFIG } from '../config/audioCacheConfig';

const prisma = new PrismaClient();

// ===========================
// TypeScript Interfaces
// ===========================

export interface CacheOptions {
  module: string; // 'ncert', 'revision', 'doubts', 'worksheets'
  subject?: string;
  class?: string;
  identifier: string;
  voiceId?: string;
  languageCode?: string;
  version?: string;
  // Enhanced for dual providers
  provider?: 'google' | 'elevenlabs' | 'browser';
  modelId?: string;
}

export interface AudioCacheResult {
  audioUrl: string;
  source: 'cache' | 'google' | 'elevenlabs' | 'browser';
  cacheKey: string;
  metadata: CacheMetadata;
}

export interface CacheMetadata {
  generatedAt: string;
  fileSize: number;
  characterCount: number;
  voiceId: string;
  languageCode: string;
  version: string;
  // Enhanced for dual providers
  provider: 'google' | 'elevenlabs' | 'browser';
  modelId?: string;
  estimatedCost?: number;
}

export interface CacheStats {
  totalFiles: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRatio: number;
  costSaved: number; // in USD
  // Enhanced for dual providers
  providerBreakdown: {
    google: { files: number; size: number; cost: number };
    elevenlabs: { files: number; size: number; cost: number };
    browser: { files: number; size: number; cost: number };
  };
  totalEstimatedCost: number;
}

interface CacheKeyParams {
  module: string;
  subject?: string;
  class?: string;
  identifier: string;
  language?: string;
  version?: string;
  // Enhanced for dual providers
  provider?: string;
  voiceId?: string;
}

// ===========================
// In-Memory Stats Tracking
// ===========================

let cacheStats = {
  hitCount: 0,
  missCount: 0,
};

// ===========================
// Cache Key Generation
// ===========================

/**
 * Generates a deterministic cache key based on content parameters
 * Format: {module}_{subject}_{class}_{identifier}_{language}_{version}.mp3
 * Note: Provider-agnostic to allow reuse across providers
 */
export function generateCacheKey(params: CacheKeyParams): string {
  const {
    module,
    subject,
    class: className,
    identifier,
    language = 'en',
    version = 'v1'
    // Note: We don't include provider/voiceId in cache key to allow reuse
  } = params;

  // Sanitize identifier: lowercase, remove special chars, normalize
  const sanitized = identifier
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

  // Build key components
  const parts = [module];
  if (subject) parts.push(subject.toLowerCase());
  if (className) parts.push(className);
  parts.push(sanitized, language, version);

  return `${parts.join('_')}.mp3`;
}

/**
 * Generates a provider-specific cache key for debugging/analytics
 * This is used for logging but not for actual file storage
 */
export function generateProviderSpecificKey(params: CacheKeyParams): string {
  const baseKey = generateCacheKey(params);
  const { provider, voiceId } = params;
  
  if (provider && voiceId) {
    return `${baseKey.replace('.mp3', '')}_${provider}_${voiceId}.mp3`;
  }
  
  return baseKey;
}

/**
 * Gets the file path for a cache key
 */
function getCacheFilePath(cacheKey: string, module: string): string {
  const cacheDir = AUDIO_CACHE_CONFIG.DEFAULT_CACHE_PATH;
  return path.join(__dirname, '..', cacheDir, module, cacheKey);
}

/**
 * Ensures cache directory exists
 */
async function ensureCacheDir(module: string): Promise<void> {
  const cacheDir = AUDIO_CACHE_CONFIG.DEFAULT_CACHE_PATH;
  const moduleDir = path.join(__dirname, '..', cacheDir, module);
  
  try {
    await fs.access(moduleDir);
  } catch {
    await fs.mkdir(moduleDir, { recursive: true });
  }
}

// ===========================
// Cache Operations
// ===========================

/**
 * Checks if a cached file exists and is valid
 */
export async function getCached(cacheKey: string, module: string): Promise<AudioCacheResult | null> {
  try {
    const filePath = getCacheFilePath(cacheKey, module);
    
    // Check if file exists and is readable
    const stats = await fs.stat(filePath);
    
    if (stats.size === 0) {
      console.warn(`[CACHE WARNING] Corrupted file (0 bytes): ${cacheKey}`);
      return null;
    }

    // Update access tracking in database
    await prisma.audioCacheRegistry.update({
      where: { cacheKey },
      data: {
        lastAccessed: new Date(),
        accessCount: { increment: 1 },
      },
    }).catch(() => {
      // Registry entry might not exist, that's okay
    });

    // Get metadata from registry
    const registry = await prisma.audioCacheRegistry.findUnique({
      where: { cacheKey },
    });

    const metadata: CacheMetadata = registry ? {
      generatedAt: registry.generatedAt.toISOString(),
      fileSize: registry.fileSize,
      characterCount: registry.characterCount,
      voiceId: registry.voiceId || 'cached',
      languageCode: registry.language,
      version: registry.version,
      provider: (registry.provider as 'google' | 'elevenlabs' | 'browser') || 'google', // Default for backward compatibility
      modelId: registry.modelId || undefined,
      estimatedCost: registry.estimatedCost || undefined,
    } : {
      generatedAt: stats.mtime.toISOString(),
      fileSize: stats.size,
      characterCount: 0,
      voiceId: 'cached',
      languageCode: 'en',
      version: 'v1',
      provider: 'google', // Default for backward compatibility
      estimatedCost: 0,
    };

    // Log cache hit with provider info
    const providerInfo = metadata.provider ? ` [${metadata.provider}]` : '';
    const costInfo = metadata.estimatedCost ? ` (saved $${metadata.estimatedCost.toFixed(6)})` : '';
    console.log(`\x1b[34m[CACHE HIT] 📦 ${cacheKey}${providerInfo}${costInfo}\x1b[0m`);

    // Log cache hit
    console.log(`\x1b[34m[CACHE HIT] 📦 ${cacheKey} (saved $${costSaved.toFixed(3)})\x1b[0m`);
    cacheStats.hitCount++;

    return {
      audioUrl: `/audio-cache/${module}/${cacheKey}`,
      source: 'cache',
      cacheKey,
      metadata,
    };
  } catch (error) {
    // File doesn't exist or error reading
    return null;
  }
}

/**
 * Saves audio to cache
 */
export async function saveToCache(
  cacheKey: string,
  audioBuffer: Buffer,
  options: CacheOptions,
  characterCount: number,
  estimatedCost?: number
): Promise<void> {
  try {
    await ensureCacheDir(options.module);
    const filePath = getCacheFilePath(cacheKey, options.module);

    // Write file
    await fs.writeFile(filePath, audioBuffer);

    const stats = await fs.stat(filePath);

    // Save to registry with provider information
    await prisma.audioCacheRegistry.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        module: options.module,
        subject: options.subject || null,
        class: options.class || null,
        identifier: options.identifier,
        language: options.languageCode || 'en',
        version: options.version || 'v1',
        filePath,
        fileSize: stats.size,
        characterCount,
        // Enhanced provider fields - ensure no undefined values
        provider: options.provider || 'google',
        voiceId: options.voiceId || null,
        modelId: options.modelId || null,
        estimatedCost: estimatedCost || null,
      },
      update: {
        lastAccessed: new Date(),
        fileSize: stats.size,
        characterCount,
        // Update provider info on cache refresh - ensure no undefined values
        provider: options.provider || 'google',
        voiceId: options.voiceId || null,
        modelId: options.modelId || null,
        estimatedCost: estimatedCost || null,
      },
    });

    const providerInfo = options.provider ? ` [${options.provider}]` : '';
    const costInfo = estimatedCost ? ` ($${estimatedCost.toFixed(6)})` : '';
    console.log(`[CACHE SAVE] ✓ ${cacheKey}${providerInfo} (${stats.size} bytes)${costInfo}`);
  } catch (error) {
    console.error(`[CACHE ERROR] Failed to save ${cacheKey}:`, error);
  }
}

/**
 * Main method: Get audio from cache or generate via TTS
 * Enhanced for dual-provider support
 */
export async function getOrGenerate(
  cacheKey: string,
  textContent: string,
  options: CacheOptions,
  ttsGenerator: (text: string) => Promise<Buffer>,
  estimatedCost?: number
): Promise<AudioCacheResult> {
  // Check cache first
  const cached = await getCached(cacheKey, options.module);
  if (cached) {
    return cached;
  }

  // Cache miss - generate via TTS
  const providerName = options.provider || 'google';
  console.log(`\x1b[32m[${providerName.toUpperCase()}] 🔊 Generating ${cacheKey} (${textContent.length} chars)\x1b[0m`);
  cacheStats.missCount++;

  const audioBuffer = await ttsGenerator(textContent);

  // Calculate cost from config
  const cost = (textContent.length / 1000) * AUDIO_CACHE_CONFIG.PRICE_PER_1000_CHARS;
  console.log(`\x1b[32m[GOOGLE] 🔊 Generated ${cacheKey} (${textContent.length} chars, $${cost.toFixed(3)}) - cached ✓\x1b[0m`);

  // Save to cache
  await saveToCache(cacheKey, audioBuffer, options, textContent.length);

  const metadata: CacheMetadata = {
    generatedAt: new Date().toISOString(),
    fileSize: audioBuffer.length,
    characterCount: textContent.length,
    voiceId: options.voiceId || 'default',
    languageCode: options.languageCode || 'en',
    version: options.version || 'v1',
  };

  return {
    audioUrl: `/audio-cache/${options.module}/${cacheKey}`,
    source: 'google',
    cacheKey,
    metadata,
  };
}

/**
 * Invalidate a cache entry
 */
export async function invalidateCache(cacheKey: string, module: string): Promise<void> {
  try {
    const filePath = getCacheFilePath(cacheKey, module);
    await fs.unlink(filePath);

    await prisma.audioCacheRegistry.delete({
      where: { cacheKey },
    }).catch(() => {
      // Entry might not exist
    });

    console.log(`[CACHE INVALIDATE] ✓ ${cacheKey}`);
  } catch (error) {
    console.error(`[CACHE ERROR] Failed to invalidate ${cacheKey}:`, error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  const registryEntries = await prisma.audioCacheRegistry.findMany();

  const totalFiles = registryEntries.length;
  const totalSize = registryEntries.reduce((sum: number, entry) => sum + entry.fileSize, 0);
  const totalCharacters = registryEntries.reduce((sum: number, entry) => sum + entry.characterCount, 0);
  
  // Calculate provider breakdown
  const providerBreakdown = {
    google: { files: 0, size: 0, cost: 0 },
    elevenlabs: { files: 0, size: 0, cost: 0 },
    browser: { files: 0, size: 0, cost: 0 }
  };

  let totalEstimatedCost = 0;

  for (const entry of registryEntries) {
    const provider = (entry.provider as 'google' | 'elevenlabs' | 'browser') || 'google';
    const cost = entry.estimatedCost || 0;
    
    providerBreakdown[provider].files++;
    providerBreakdown[provider].size += entry.fileSize;
    providerBreakdown[provider].cost += cost;
    totalEstimatedCost += cost;
  }
  
  // Fallback cost calculation for backward compatibility
  const fallbackCostSaved = (totalCharacters / 1000) * AUDIO_CACHE_CONFIG.PRICE_PER_1000_CHARS;
  const costSaved = totalEstimatedCost > 0 ? totalEstimatedCost : fallbackCostSaved;

  const totalRequests = cacheStats.hitCount + cacheStats.missCount;
  const hitRatio = totalRequests > 0 ? cacheStats.hitCount / totalRequests : 0;

  return {
    totalFiles,
    totalSize,
    hitCount: cacheStats.hitCount,
    missCount: cacheStats.missCount,
    hitRatio: parseFloat((hitRatio * 100).toFixed(2)),
    costSaved: parseFloat(costSaved.toFixed(6)),
    providerBreakdown,
    totalEstimatedCost: parseFloat(totalEstimatedCost.toFixed(6)),
  };
}

/**
 * Warm cache by pre-generating audio for given keys
 */
export async function warmCache(
  keys: Array<{ cacheKey: string; text: string; options: CacheOptions }>,
  ttsGenerator: (text: string) => Promise<Buffer>
): Promise<{ warmed: number; failed: number }> {
  let warmed = 0;
  let failed = 0;

  console.log(`[CACHE WARM] Starting pre-warming for ${keys.length} entries...`);

  for (const { cacheKey, text, options } of keys) {
    try {
      // Check if already cached
      const cached = await getCached(cacheKey, options.module);
      if (cached) {
        console.log(`[CACHE WARM] ⏭️  Skipping ${cacheKey} (already cached)`);
        continue;
      }

      // Generate and cache
      await getOrGenerate(cacheKey, text, options, ttsGenerator);
      warmed++;

      // Small delay to avoid overwhelming TTS service
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[CACHE WARM] ❌ Failed ${cacheKey}:`, error);
      failed++;
    }
  }

  console.log(`[CACHE WARM] Complete: ${warmed} warmed, ${failed} failed`);

  return { warmed, failed };
}

/**
 * Print session summary (call on process exit or periodically)
 */
export function logSessionSummary(): void {
  const totalRequests = cacheStats.hitCount + cacheStats.missCount;
  const hitRatio = totalRequests > 0 ? ((cacheStats.hitCount / totalRequests) * 100).toFixed(1) : '0.0';

  console.log(`\n[CACHE SESSION SUMMARY] ${cacheStats.hitCount} hits, ${cacheStats.missCount} misses (${hitRatio}% hit ratio)`);
}

// ===========================
// Exports
// ===========================

export default {
  generateCacheKey,
  generateProviderSpecificKey,
  getCached,
  saveToCache,
  getOrGenerate,
  invalidateCache,
  getCacheStats,
  warmCache,
  logSessionSummary,
};
