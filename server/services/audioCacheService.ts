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
}

export interface AudioCacheResult {
  audioUrl: string;
  source: 'cache' | 'elevenlabs';
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
}

export interface CacheStats {
  totalFiles: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRatio: number;
  costSaved: number; // in USD
}

interface CacheKeyParams {
  module: string;
  subject?: string;
  class?: string;
  identifier: string;
  language?: string;
  version?: string;
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
 */
export function generateCacheKey(params: CacheKeyParams): string {
  const {
    module,
    subject,
    class: className,
    identifier,
    language = 'en',
    version = 'v1'
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
      voiceId: 'cached',
      languageCode: registry.language,
      version: registry.version,
    } : {
      generatedAt: stats.mtime.toISOString(),
      fileSize: stats.size,
      characterCount: 0,
      voiceId: 'cached',
      languageCode: 'en',
      version: 'v1',
    };

    // Calculate cost saved (ElevenLabs pricing from config)
    const costSaved = (metadata.characterCount / 1000) * AUDIO_CACHE_CONFIG.PRICE_PER_1000_CHARS;

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
  characterCount: number
): Promise<void> {
  try {
    await ensureCacheDir(options.module);
    const filePath = getCacheFilePath(cacheKey, options.module);

    // Write file
    await fs.writeFile(filePath, audioBuffer);

    const stats = await fs.stat(filePath);

    // Save to registry
    await prisma.audioCacheRegistry.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        module: options.module,
        subject: options.subject,
        class: options.class,
        identifier: options.identifier,
        language: options.languageCode || 'en',
        version: options.version || 'v1',
        filePath,
        fileSize: stats.size,
        characterCount,
      },
      update: {
        lastAccessed: new Date(),
        fileSize: stats.size,
        characterCount,
      },
    });

    console.log(`[CACHE SAVE] ✓ ${cacheKey} (${stats.size} bytes)`);
  } catch (error) {
    console.error(`[CACHE ERROR] Failed to save ${cacheKey}:`, error);
  }
}

/**
 * Main method: Get audio from cache or generate via TTS
 */
export async function getOrGenerate(
  cacheKey: string,
  textContent: string,
  options: CacheOptions,
  ttsGenerator: (text: string) => Promise<Buffer>
): Promise<AudioCacheResult> {
  // Check cache first
  const cached = await getCached(cacheKey, options.module);
  if (cached) {
    return cached;
  }

  // Cache miss - generate via TTS
  console.log(`\x1b[32m[ELEVENLABS] 🔊 Generating ${cacheKey} (${textContent.length} chars)\x1b[0m`);
  cacheStats.missCount++;

  const audioBuffer = await ttsGenerator(textContent);

  // Calculate cost from config
  const cost = (textContent.length / 1000) * AUDIO_CACHE_CONFIG.PRICE_PER_1000_CHARS;
  console.log(`\x1b[32m[ELEVENLABS] 🔊 Generated ${cacheKey} (${textContent.length} chars, $${cost.toFixed(3)}) - cached ✓\x1b[0m`);

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
    source: 'elevenlabs',
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
  
  // Cost saved from config
  const costSaved = (totalCharacters / 1000) * AUDIO_CACHE_CONFIG.PRICE_PER_1000_CHARS;

  const totalRequests = cacheStats.hitCount + cacheStats.missCount;
  const hitRatio = totalRequests > 0 ? cacheStats.hitCount / totalRequests : 0;

  return {
    totalFiles,
    totalSize,
    hitCount: cacheStats.hitCount,
    missCount: cacheStats.missCount,
    hitRatio: parseFloat((hitRatio * 100).toFixed(2)),
    costSaved: parseFloat(costSaved.toFixed(2)),
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
  getCached,
  saveToCache,
  getOrGenerate,
  invalidateCache,
  getCacheStats,
  warmCache,
  logSessionSummary,
};
