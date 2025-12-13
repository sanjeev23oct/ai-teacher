import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===========================
// TypeScript Interfaces
// ===========================

export interface CacheKey {
  module: string;
  contentType: string;
  identifier: string;
  language?: string;
}

export interface CachedContent {
  id: string;
  content: string;
  title?: string;
  source: 'manual' | 'llm' | 'import';
  accessCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

export interface CacheFilters {
  subject?: string;
  class?: string;
  source?: 'manual' | 'llm' | 'import';
}

export interface CacheStats {
  totalCached: number;
  manualEntries: number;
  llmGenerated: number;
  totalAccesses: number;
}

export interface ChapterCacheStatus {
  chapterId: string;
  chapterName: string;
  subject: string;
  class: string;
  cached: boolean;
  cacheId?: string;
  source?: 'manual' | 'llm' | 'import';
  lastUpdated?: Date;
}

// ===========================
// Core CRUD Operations
// ===========================

/**
 * Get cached content by key
 */
export async function get(key: CacheKey): Promise<CachedContent | null> {
  const { module, contentType, identifier, language = 'en' } = key;

  const cached = await prisma.contentCache.findUnique({
    where: {
      module_contentType_identifier_language: {
        module,
        contentType,
        identifier,
        language,
      },
    },
  });

  if (!cached) {
    return null;
  }

  // Update access stats
  await updateAccessStats(cached.id);

  return {
    id: cached.id,
    content: cached.content,
    title: cached.title || undefined,
    source: cached.source as 'manual' | 'llm' | 'import',
    accessCount: cached.accessCount + 1, // Return incremented count
    createdAt: cached.createdAt,
    updatedAt: cached.updatedAt,
    lastAccessedAt: new Date(),
  };
}

/**
 * Store content in cache
 */
export async function set(
  key: CacheKey,
  content: string,
  source: 'manual' | 'llm' | 'import',
  options?: {
    title?: string;
    subject?: string;
    class?: string;
    createdBy?: string;
  }
): Promise<void> {
  const { module, contentType, identifier, language = 'en' } = key;

  await prisma.contentCache.upsert({
    where: {
      module_contentType_identifier_language: {
        module,
        contentType,
        identifier,
        language,
      },
    },
    update: {
      content,
      title: options?.title,
      source,
      updatedAt: new Date(),
      createdBy: options?.createdBy,
    },
    create: {
      module,
      contentType,
      identifier,
      language,
      content,
      title: options?.title,
      source,
      subject: options?.subject,
      class: options?.class,
      createdBy: options?.createdBy,
    },
  });
}

/**
 * Delete cached content by key
 */
export async function deleteByKey(key: CacheKey): Promise<boolean> {
  const { module, contentType, identifier, language = 'en' } = key;

  try {
    await prisma.contentCache.delete({
      where: {
        module_contentType_identifier_language: {
          module,
          contentType,
          identifier,
          language,
        },
      },
    });
    return true;
  } catch (error) {
    // Record not found
    return false;
  }
}

/**
 * Delete cached content by ID
 */
export async function deleteById(id: string): Promise<boolean> {
  try {
    await prisma.contentCache.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Update access statistics
 */
export async function updateAccessStats(id: string): Promise<void> {
  await prisma.contentCache.update({
    where: { id },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
    },
  });
}

// ===========================
// Query and Filter Operations
// ===========================

/**
 * Get cached content by module with filters
 */
export async function getByModule(
  module: string,
  filters?: CacheFilters
): Promise<CachedContent[]> {
  const where: any = { module };

  if (filters?.subject) {
    where.subject = filters.subject;
  }
  if (filters?.class) {
    where.class = filters.class;
  }
  if (filters?.source) {
    where.source = filters.source;
  }

  const cached = await prisma.contentCache.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  return cached.map(item => ({
    id: item.id,
    content: item.content,
    title: item.title || undefined,
    source: item.source as 'manual' | 'llm' | 'import',
    accessCount: item.accessCount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    lastAccessedAt: item.lastAccessedAt,
  }));
}

/**
 * Get cache statistics
 */
export async function getStats(module?: string): Promise<CacheStats> {
  const where = module ? { module } : {};

  const [total, manual, llm, accessSum] = await Promise.all([
    prisma.contentCache.count({ where }),
    prisma.contentCache.count({ where: { ...where, source: 'manual' } }),
    prisma.contentCache.count({ where: { ...where, source: 'llm' } }),
    prisma.contentCache.aggregate({
      where,
      _sum: { accessCount: true },
    }),
  ]);

  return {
    totalCached: total,
    manualEntries: manual,
    llmGenerated: llm,
    totalAccesses: accessSum._sum.accessCount || 0,
  };
}

// ===========================
// Chapter-specific Operations
// ===========================

/**
 * List chapters with cache status for NCERT module
 */
export async function listChaptersWithStatus(
  subject?: string,
  classLevel?: string
): Promise<ChapterCacheStatus[]> {
  // Import chapter data service
  const chapterDataService = require('./chapterDataService').default;
  
  // Get all chapters
  const allChapters: any[] = [];
  
  if (subject && classLevel) {
    const chapters = await chapterDataService.getChapterList(classLevel, subject);
    allChapters.push(...chapters.map((ch: any) => ({ ...ch, subject, class: classLevel })));
  } else {
    // Get all subjects and classes
    const subjects = subject ? [subject] : ['English', 'Science', 'Math', 'SST'];
    const classes = classLevel ? [classLevel] : ['6', '7', '8', '9', '10'];
    
    for (const subj of subjects) {
      for (const cls of classes) {
        try {
          const chapters = await chapterDataService.getChapterList(cls, subj);
          allChapters.push(...chapters.map((ch: any) => ({ ...ch, subject: subj, class: cls })));
        } catch (error) {
          // Skip if no chapters for this combination
          continue;
        }
      }
    }
  }

  // Get cached summaries for NCERT module
  const cachedSummaries = await prisma.contentCache.findMany({
    where: {
      module: 'ncert',
      contentType: 'summary',
      ...(subject && { subject }),
      ...(classLevel && { class: classLevel }),
    },
  });

  // Create lookup map
  const cacheMap = new Map(
    cachedSummaries.map(cache => [cache.identifier, cache])
  );

  // Combine chapter data with cache status
  return allChapters.map(chapter => {
    const cached = cacheMap.get(chapter.id);
    return {
      chapterId: chapter.id,
      chapterName: chapter.name,
      subject: chapter.subject,
      class: chapter.class,
      cached: !!cached,
      cacheId: cached?.id,
      source: cached?.source as 'manual' | 'llm' | 'import' | undefined,
      lastUpdated: cached?.updatedAt,
    };
  });
}

// ===========================
// Exports
// ===========================

export default {
  get,
  set,
  deleteByKey,
  deleteById,
  updateAccessStats,
  getByModule,
  getStats,
  listChaptersWithStatus,
};