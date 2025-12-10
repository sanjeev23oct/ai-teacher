// ===========================
// Smart Notes Service
// Main service for note processing with caching
// ===========================

import { aiService } from './aiService';
import noteCacheService from './noteCacheService';
import prisma from '../lib/prisma';

export interface NoteEnhancementResult {
  enhancedNote: string;
  title: string;
  summary: string;
  tags: string[];
  subject?: string;
  source: 'cache' | 'generated';
}

/**
 * Extract text from image using existing aiService with OCR caching
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  imageMimeType: string = 'image/jpeg'
): Promise<{ text: string; source: 'cache' | 'generated'; cacheKey: string }> {
  // Generate hash for caching
  const imageHash = noteCacheService.generateImageHash(imageBuffer);
  const cacheKey = `ocr_${imageHash}`;

  // Check cache first
  const cachedText = await noteCacheService.getOCRFromCache(imageHash);
  
  if (cachedText) {
    return {
      text: cachedText,
      source: 'cache',
      cacheKey,
    };
  }

  // Cache miss - perform OCR using existing aiService
  const imageBase64 = imageBuffer.toString('base64');
  
  const prompt = `Extract ALL text from this image exactly as written.

INSTRUCTIONS:
1. Extract every word, number, and symbol visible
2. Maintain original formatting (line breaks, spacing, bullet points)
3. If handwritten and unclear, make your best interpretation
4. If there are diagrams/formulas, describe them in [DIAGRAM: ...] or [FORMULA: ...]
5. Preserve the original language (Hindi, English, or mixed)
6. Output the extracted text directly without any preamble

Extract now:`;

  const result = await aiService.generateContent({
    prompt,
    imageBase64,
    imageMimeType,
  });

  const extractedText = result.text.trim();

  // Save to cache
  await noteCacheService.saveOCRToCache(imageHash, extractedText);

  console.log(`\x1b[32m[OCR COMPLETE] ✓ Extracted ${extractedText.length} characters\x1b[0m`);

  return {
    text: extractedText,
    source: 'generated',
    cacheKey,
  };
}

/**
 * Enhance messy notes into clean, structured format with caching
 */
export async function enhanceNote(
  rawText: string,
  context?: {
    subject?: string;
    class?: string;
    chapter?: string;
  }
): Promise<NoteEnhancementResult> {
  // Generate hash for caching
  const textHash = noteCacheService.generateTextHash(rawText);

  // Check cache first
  const cached = await noteCacheService.getEnhancementFromCache(textHash);
  
  if (cached) {
    return {
      ...cached,
      source: 'cache' as const,
    };
  }

  // Cache miss - enhance using AI
  const contextInfo = context 
    ? `\nContext: Class ${context.class || 'unknown'}, Subject: ${context.subject || 'unknown'}, Chapter: ${context.chapter || 'unknown'}`
    : '';

  const prompt = `You are an expert teacher who helps students organize their notes beautifully. Transform these messy study notes into a clean, well-structured format that will help during revision.${contextInfo}

RAW NOTES:
${rawText}

TASK: Create a clean, organized note that is:
1. WELL-STRUCTURED: Use headings, bullet points, numbered lists
2. CLEAR & CONCISE: Remove unnecessary words, fix grammar
3. EXAM-FRIENDLY: Highlight key terms, formulas, important concepts
4. EASY TO SCAN: Use formatting for quick revision
5. ENHANCED: Add helpful mnemonics, memory tricks, or tips where useful

Also provide:
- A short, descriptive TITLE (max 60 chars)
- A brief SUMMARY (2-3 sentences)
- TAGS (3-5 keywords like "formula", "important", "definition", "exam")
- SUBJECT (Math/Science/English/SST/Other based on content)

OUTPUT FORMAT (JSON):
{
  "title": "short descriptive title",
  "summary": "brief 2-3 sentence summary",
  "subject": "detected subject",
  "tags": ["tag1", "tag2", "tag3"],
  "enhancedNote": "your beautifully formatted note using markdown:
  
## Main Heading
### Subheading
- Bullet point 1
- Bullet point 2
  
**Important term**: Definition

Formula: E = mc²

> Tip: Helpful memory trick
"
}

Generate the enhanced note now in JSON format:`;

  const result = await aiService.generateContent({ prompt });
  
  // Parse JSON response
  let jsonStr = result.text.trim();
  if (jsonStr.includes('```json')) {
    jsonStr = jsonStr.split('```json')[1].split('```')[0];
  } else if (jsonStr.includes('```')) {
    jsonStr = jsonStr.split('```')[1].split('```')[0];
  }

  const enhanced = JSON.parse(jsonStr);

  const enhancementData = {
    enhancedNote: enhanced.enhancedNote,
    title: enhanced.title,
    summary: enhanced.summary,
    tags: enhanced.tags || [],
    subject: enhanced.subject,
  };

  // Save to cache
  await noteCacheService.saveEnhancementToCache(textHash, enhancementData);

  console.log(`\x1b[32m[ENHANCE COMPLETE] ✓ Created structured note: "${enhanced.title}"\x1b[0m`);

  return {
    ...enhancementData,
    source: 'generated',
  };
}

/**
 * Create or update smart note
 */
export async function createSmartNote(
  userId: string,
  data: {
    sourceType: 'text' | 'image';
    originalText?: string;
    imageBuffer?: Buffer;
    imageMimeType?: string;
    imageUrl?: string;
    context?: {
      subject?: string;
      class?: string;
      chapter?: string;
    };
  }
): Promise<any> {
  let extractedText = data.originalText || '';
  let imageHash: string | undefined;
  let cacheKey: string | undefined;

  // If image source, extract text first
  if (data.sourceType === 'image' && data.imageBuffer) {
    const ocrResult = await extractTextFromImage(data.imageBuffer, data.imageMimeType);
    extractedText = ocrResult.text;
    imageHash = noteCacheService.generateImageHash(data.imageBuffer);
    cacheKey = ocrResult.cacheKey;
  }

  // Enhance the extracted/provided text
  const enhancement = await enhanceNote(extractedText, data.context);

  // Create note in database
  const note = await prisma.smartNote.create({
    data: {
      userId,
      sourceType: data.sourceType,
      originalText: data.originalText,
      imageUrl: data.imageUrl,
      imageHash,
      extractedText: data.sourceType === 'image' ? extractedText : undefined,
      enhancedNote: enhancement.enhancedNote,
      title: enhancement.title,
      summary: enhancement.summary,
      subject: enhancement.subject || data.context?.subject,
      class: data.context?.class,
      chapter: data.context?.chapter,
      tags: enhancement.tags,
      cacheKey,
    },
  });

  // Update progress
  await updateNoteProgress(userId, enhancement.subject || 'other');

  return {
    ...note,
    cacheHit: enhancement.source === 'cache',
  };
}

/**
 * Update note progress and badges
 */
async function updateNoteProgress(userId: string, subject: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const progress = await prisma.noteProgress.findUnique({
    where: { userId },
  });

  const subjectField = `${subject.toLowerCase()}Notes` as any;
  const isValidSubject = ['math', 'science', 'english', 'sst'].includes(subject.toLowerCase());

  if (progress) {
    const lastNoteDate = progress.lastNoteDate ? new Date(progress.lastNoteDate) : null;
    const isConsecutiveDay = lastNoteDate && 
      today.getTime() - lastNoteDate.getTime() === 24 * 60 * 60 * 1000;

    await prisma.noteProgress.update({
      where: { userId },
      data: {
        totalNotes: { increment: 1 },
        [subjectField]: isValidSubject ? { increment: 1 } : undefined,
        otherNotes: !isValidSubject ? { increment: 1 } : undefined,
        currentStreak: isConsecutiveDay ? { increment: 1 } : 1,
        longestStreak: isConsecutiveDay && progress.currentStreak + 1 > progress.longestStreak
          ? progress.currentStreak + 1
          : progress.longestStreak,
        lastNoteDate: today,
      },
    });
  } else {
    await prisma.noteProgress.create({
      data: {
        userId,
        totalNotes: 1,
        [subjectField]: isValidSubject ? 1 : 0,
        otherNotes: !isValidSubject ? 1 : 0,
        currentStreak: 1,
        longestStreak: 1,
        lastNoteDate: today,
      },
    });
  }
}

/**
 * Get user's notes with filters
 */
export async function getUserNotes(
  userId: string,
  filters?: {
    subject?: string;
    class?: string;
    tags?: string[];
    search?: string;
    isFavorite?: boolean;
  }
) {
  const where: any = { userId };

  if (filters?.subject) where.subject = filters.subject;
  if (filters?.class) where.class = filters.class;
  if (filters?.isFavorite !== undefined) where.isFavorite = filters.isFavorite;
  if (filters?.tags && filters.tags.length > 0) {
    where.tags = { hasSome: filters.tags };
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { enhancedNote: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const notes = await prisma.smartNote.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return notes;
}

/**
 * Get note by ID and increment view count
 */
export async function getNoteById(noteId: string, userId: string) {
  const note = await prisma.smartNote.findFirst({
    where: { id: noteId, userId },
  });

  if (note) {
    await prisma.smartNote.update({
      where: { id: noteId },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });
  }

  return note;
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(noteId: string, userId: string) {
  const note = await prisma.smartNote.findFirst({
    where: { id: noteId, userId },
  });

  if (!note) throw new Error('Note not found');

  return await prisma.smartNote.update({
    where: { id: noteId },
    data: { isFavorite: !note.isFavorite },
  });
}

/**
 * Delete note
 */
export async function deleteNote(noteId: string, userId: string) {
  return await prisma.smartNote.deleteMany({
    where: { id: noteId, userId },
  });
}

/**
 * Get note progress
 */
export async function getNoteProgress(userId: string) {
  const progress = await prisma.noteProgress.findUnique({
    where: { userId },
  });

  return progress || {
    totalNotes: 0,
    textNotes: 0,
    imageNotes: 0,
    mathNotes: 0,
    scienceNotes: 0,
    englishNotes: 0,
    sstNotes: 0,
    otherNotes: 0,
    currentStreak: 0,
    longestStreak: 0,
  };
}

export default {
  extractTextFromImage,
  enhanceNote,
  createSmartNote,
  getUserNotes,
  getNoteById,
  toggleFavorite,
  deleteNote,
  getNoteProgress,
};
