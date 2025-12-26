// ===========================
// Smart Notes Service
// Main service for note processing with caching
// ===========================

import { aiService } from './aiService';
// import noteCacheService from './noteCacheService'; // Temporarily disabled for Railway
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
  // Cache disabled for Railway compatibility
  const imageHash = 'no-cache';
  const cacheKey = `ocr_${Date.now()}`;

  // Skip cache check
  const cachedText = null;
  
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

  // Cache save disabled for Railway compatibility
  // await noteCacheService.saveOCRToCache(imageHash, extractedText);

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
  // Cache disabled for Railway compatibility
  const textHash = 'no-cache';

  // Skip cache check
  const cached = null;
  
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

IMPORTANT: You MUST return valid JSON only. Use \\n for line breaks within the enhancedNote string. Do NOT use actual newlines.

Example of correct JSON format:
${JSON.stringify({
  title: "Example Title",
  summary: "Example summary text",
  subject: "Math",
  tags: ["example", "formula"],
  enhancedNote: "# Main Heading\n\n## Subheading\n- Point 1\n- Point 2\n\n**Key term**: definition"
}, null, 2)}

Now generate the enhanced note in this exact JSON format:`;

  const result = await aiService.generateContent({ prompt });
  
  // Parse JSON response with more robust handling
  let jsonStr = result.text.trim();
  
  // First, try to find JSON within markdown code blocks
  if (jsonStr.includes('```json')) {
    const match = jsonStr.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
  } else if (jsonStr.includes('```')) {
    const match = jsonStr.match(/```\s*\n([\s\S]*?)\n\s*```/);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
  }
  
  // If still not valid JSON, try to extract JSON object from the response
  if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
    // Look for JSON object pattern in the text
    const jsonMatch = jsonStr.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
  }
  
  let enhanced;
  try {
    enhanced = JSON.parse(jsonStr);
  } catch (parseError: any) {
    console.error('JSON parse error:', parseError.message);
    console.error('Problematic response:', result.text.substring(0, 500));
    console.error('Attempted to parse:', jsonStr.substring(0, 500));
    
    // Additional fallback: try to find JSON even within plain text
    try {
      // Try to extract any possible JSON object from the response
      const text = result.text;
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1 && start < end) {
        const potentialJson = text.substring(start, end + 1);
        enhanced = JSON.parse(potentialJson);
        console.log('Successfully extracted JSON from within text');
      } else {
        // Fallback: create a basic response structure if JSON parsing fails
        console.warn('Falling back to basic response structure');
        enhanced = {
          title: 'Enhanced Notes',
          summary: 'Auto-generated summary',
          subject: context?.subject || 'Other',
          tags: ['auto-generated'],
          enhancedNote: result.text, // Use the raw response as the enhanced note
        };
      }
    } catch (secondParseError: any) {
      // Final fallback
      console.warn('Final fallback to basic response structure');
      enhanced = {
        title: 'Enhanced Notes',
        summary: 'Auto-generated summary',
        subject: context?.subject || 'Other',
        tags: ['auto-generated'],
        enhancedNote: result.text, // Use the raw response as the enhanced note
      };
    }
  }

  const enhancementData = {
    enhancedNote: enhanced.enhancedNote,
    title: enhanced.title,
    summary: enhanced.summary,
    tags: enhanced.tags || [],
    subject: enhanced.subject,
  };

  // Validate required fields
  if (!enhancementData.enhancedNote || !enhancementData.title) {
    console.error('Invalid enhancement data:', enhancementData);
    throw new Error('AI response missing required fields (enhancedNote or title)');
  }

  // Cache save disabled for Railway compatibility
  // await noteCacheService.saveEnhancementToCache(textHash, enhancementData);

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
    sourceType: 'text' | 'image' | 'mixed';
    originalText?: string;
    imageBuffer?: Buffer;
    imageMimeType?: string;
    imageUrl?: string;
    context?: {
      subject?: string;
      class?: string;
      chapter?: string;
      visibility?: string; // 'private', 'friends', 'class', 'public'
    };
  }
): Promise<any> {
  // Get user to fetch school and defaults
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { school: true, grade: true, preferredSubject: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Subject and class are required for social features
  const subject = data.context?.subject || user.preferredSubject || 'Other';
  const classGrade = data.context?.class || user.grade || '10';
  const school = user.school;
  const visibility = data.context?.visibility || 'private';

  let extractedText = data.originalText || '';
  let imageHash: string | undefined;
  let cacheKey: string | undefined;

  // If image provided (image-only or mixed mode), extract text from image
  if ((data.sourceType === 'image' || data.sourceType === 'mixed') && data.imageBuffer) {
    const ocrResult = await extractTextFromImage(data.imageBuffer, data.imageMimeType);
    const imageText = ocrResult.text;
    imageHash = 'no-cache'; // Cache disabled for Railway
    cacheKey = ocrResult.cacheKey;
    
    // For mixed mode, combine user text + extracted text
    if (data.sourceType === 'mixed') {
      extractedText = `${data.originalText}\n\n--- Extracted from attached image ---\n${imageText}`;
    } else {
      extractedText = imageText;
    }
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
      subject,
      class: classGrade,
      school,
      chapter: data.context?.chapter,
      tags: enhancement.tags,
      visibility,
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

  console.log('[getUserNotes] Building query for userId:', userId);

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

  console.log('[getUserNotes] Query where clause:', JSON.stringify(where, null, 2));

  const notes = await prisma.smartNote.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  console.log(`[getUserNotes] Found ${notes.length} notes`);

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
