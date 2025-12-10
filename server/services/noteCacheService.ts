// ===========================
// Note Cache Service
// Handles caching for OCR and note enhancement
// ===========================

import crypto from 'crypto';
import prisma from '../lib/prisma';

export interface NoteCacheResult {
  content: string;
  source: 'cache' | 'generated';
  cacheKey: string;
  timestamp: string;
}

/**
 * Generate SHA256 hash from image buffer for cache key
 */
export function generateImageHash(imageBuffer: Buffer): string {
  return crypto.createHash('sha256').update(imageBuffer).digest('hex');
}

/**
 * Generate hash from text content
 */
export function generateTextHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Check if OCR result exists in cache
 */
export async function getOCRFromCache(imageHash: string): Promise<string | null> {
  const cacheKey = `ocr_${imageHash}`;
  
  const cached = await prisma.noteCacheRegistry.findUnique({
    where: { cacheKey },
  });

  if (cached) {
    // Update access tracking
    await prisma.noteCacheRegistry.update({
      where: { cacheKey },
      data: {
        lastAccessed: new Date(),
        accessCount: { increment: 1 },
      },
    });

    console.log(`\x1b[34m[CACHE HIT] 📦 OCR result for image ${imageHash.substring(0, 8)}...\x1b[0m`);
    
    const result = JSON.parse(cached.cachedContent);
    return result.text;
  }

  console.log(`\x1b[33m[CACHE MISS] OCR for image ${imageHash.substring(0, 8)}... - will generate\x1b[0m`);
  return null;
}

/**
 * Save OCR result to cache
 */
export async function saveOCRToCache(imageHash: string, extractedText: string): Promise<void> {
  const cacheKey = `ocr_${imageHash}`;
  
  await prisma.noteCacheRegistry.upsert({
    where: { cacheKey },
    create: {
      cacheKey,
      contentType: 'ocr',
      cachedContent: JSON.stringify({ text: extractedText }),
      accessCount: 1,
    },
    update: {
      cachedContent: JSON.stringify({ text: extractedText }),
      lastAccessed: new Date(),
    },
  });

  console.log(`\x1b[32m[CACHED] ✓ OCR result for image ${imageHash.substring(0, 8)}...\x1b[0m`);
}

/**
 * Check if enhanced note exists in cache
 */
export async function getEnhancementFromCache(textHash: string): Promise<any | null> {
  const cacheKey = `enhance_${textHash}`;
  
  const cached = await prisma.noteCacheRegistry.findUnique({
    where: { cacheKey },
  });

  if (cached) {
    // Update access tracking
    await prisma.noteCacheRegistry.update({
      where: { cacheKey },
      data: {
        lastAccessed: new Date(),
        accessCount: { increment: 1 },
      },
    });

    console.log(`\x1b[34m[CACHE HIT] 📦 Enhancement for text ${textHash.substring(0, 8)}...\x1b[0m`);
    
    return JSON.parse(cached.cachedContent);
  }

  console.log(`\x1b[33m[CACHE MISS] Enhancement for text ${textHash.substring(0, 8)}... - will generate\x1b[0m`);
  return null;
}

/**
 * Save enhanced note to cache
 */
export async function saveEnhancementToCache(
  textHash: string,
  enhancedData: {
    enhancedNote: string;
    title: string;
    summary: string;
    tags: string[];
  }
): Promise<void> {
  const cacheKey = `enhance_${textHash}`;
  
  await prisma.noteCacheRegistry.upsert({
    where: { cacheKey },
    create: {
      cacheKey,
      contentType: 'enhancement',
      cachedContent: JSON.stringify(enhancedData),
      accessCount: 1,
    },
    update: {
      cachedContent: JSON.stringify(enhancedData),
      lastAccessed: new Date(),
    },
  });

  console.log(`\x1b[32m[CACHED] ✓ Enhancement for text ${textHash.substring(0, 8)}...\x1b[0m`);
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const ocrCacheCount = await prisma.noteCacheRegistry.count({
    where: { contentType: 'ocr' },
  });

  const enhancementCacheCount = await prisma.noteCacheRegistry.count({
    where: { contentType: 'enhancement' },
  });

  const totalAccess = await prisma.noteCacheRegistry.aggregate({
    _sum: { accessCount: true },
  });

  return {
    ocrCached: ocrCacheCount,
    enhancementCached: enhancementCacheCount,
    totalCacheEntries: ocrCacheCount + enhancementCacheCount,
    totalCacheHits: totalAccess._sum.accessCount || 0,
  };
}

export default {
  generateImageHash,
  generateTextHash,
  getOCRFromCache,
  saveOCRToCache,
  getEnhancementFromCache,
  saveEnhancementToCache,
  getCacheStats,
};
