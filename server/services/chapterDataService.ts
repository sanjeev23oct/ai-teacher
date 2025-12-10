import fs from 'fs/promises';
import path from 'path';

// ===========================
// Chapter Data Interfaces
// ===========================

export interface ChapterInfo {
  id: string;
  name: string;
  bookName?: string;
  chapterNumber: number;
  type?: 'prose' | 'poetry' | 'theory' | 'exercise';
  ncertPages?: string;
  subSubject?: string; // For SST: 'History', 'Geography', 'Civics'
}

interface ChapterData {
  [subject: string]: {
    [classLevel: string]: ChapterInfo[];
  };
}

// ===========================
// In-Memory Cache
// ===========================

let chapterDataCache: ChapterData | null = null;

/**
 * Load chapter data from JSON file
 */
async function loadChapterData(): Promise<ChapterData> {
  if (chapterDataCache) {
    return chapterDataCache;
  }

  try {
    const dataPath = path.join(__dirname, '../data/ncert-chapters.json');
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    chapterDataCache = JSON.parse(fileContent);
    console.log('[CHAPTER DATA] Loaded NCERT chapter data successfully');
    return chapterDataCache!;
  } catch (error) {
    console.error('[CHAPTER DATA] Error loading chapter data:', error);
    throw new Error('Failed to load NCERT chapter data');
  }
}

// ===========================
// Chapter Retrieval Functions
// ===========================

/**
 * Get list of chapters for a given class and subject
 */
export async function getChapterList(
  classLevel: string,
  subject: string
): Promise<ChapterInfo[]> {
  const data = await loadChapterData();
  
  // Validate subject
  const validSubjects = ['English', 'Science', 'Math', 'SST'];
  if (!validSubjects.includes(subject)) {
    throw new Error(`Invalid subject: ${subject}. Must be one of: ${validSubjects.join(', ')}`);
  }

  // Validate class
  const classNum = parseInt(classLevel);
  if (isNaN(classNum) || classNum < 6 || classNum > 10) {
    throw new Error('Invalid class: must be between 6 and 10');
  }

  const chapters = data[subject]?.[classLevel];
  if (!chapters) {
    return [];
  }

  return chapters;
}

/**
 * Get detailed info for a specific chapter by ID
 */
export async function getChapterInfo(chapterId: string): Promise<ChapterInfo | null> {
  const data = await loadChapterData();
  
  // Search through all subjects and classes
  for (const subject of Object.keys(data)) {
    for (const classLevel of Object.keys(data[subject])) {
      const chapters = data[subject][classLevel];
      const chapter = chapters.find(ch => ch.id === chapterId);
      if (chapter) {
        return chapter;
      }
    }
  }
  
  return null;
}

/**
 * Search chapters by name or number
 */
export async function searchChapters(
  query: string,
  classLevel?: string,
  subject?: string
): Promise<Array<ChapterInfo & { subject: string; class: string }>> {
  const data = await loadChapterData();
  const results: Array<ChapterInfo & { subject: string; class: string }> = [];
  
  const queryLower = query.toLowerCase().trim();
  
  // Determine search scope
  const subjects = subject ? [subject] : Object.keys(data);
  
  for (const subj of subjects) {
    const classes = classLevel ? [classLevel] : Object.keys(data[subj] || {});
    
    for (const cls of classes) {
      const chapters = data[subj]?.[cls] || [];
      
      for (const chapter of chapters) {
        // Match by chapter number (e.g., "Ch5", "Chapter 5", "5")
        const chapterNumMatch = queryLower.match(/^(?:ch|chapter)?\s*(\d+)$/i);
        if (chapterNumMatch) {
          const num = parseInt(chapterNumMatch[1]);
          if (chapter.chapterNumber === num) {
            results.push({ ...chapter, subject: subj, class: cls });
            continue;
          }
        }
        
        // Match by chapter name (partial or full)
        if (chapter.name.toLowerCase().includes(queryLower)) {
          results.push({ ...chapter, subject: subj, class: cls });
          continue;
        }
        
        // Match by chapter ID
        if (chapter.id.toLowerCase().includes(queryLower)) {
          results.push({ ...chapter, subject: subj, class: cls });
        }
      }
    }
  }
  
  return results;
}

/**
 * Get chapter by name for a specific class and subject
 */
export async function getChapterByName(
  chapterName: string,
  classLevel: string,
  subject: string
): Promise<ChapterInfo | null> {
  const chapters = await getChapterList(classLevel, subject);
  const nameLower = chapterName.toLowerCase();
  
  return chapters.find(ch => ch.name.toLowerCase() === nameLower) || null;
}

/**
 * Get chapter by number for a specific class and subject
 */
export async function getChapterByNumber(
  chapterNumber: number,
  classLevel: string,
  subject: string
): Promise<ChapterInfo | null> {
  const chapters = await getChapterList(classLevel, subject);
  
  return chapters.find(ch => ch.chapterNumber === chapterNumber) || null;
}

/**
 * Get all subjects
 */
export async function getAllSubjects(): Promise<string[]> {
  const data = await loadChapterData();
  return Object.keys(data);
}

/**
 * Get available classes for a subject
 */
export async function getAvailableClasses(subject: string): Promise<string[]> {
  const data = await loadChapterData();
  const subjectData = data[subject];
  
  if (!subjectData) {
    return [];
  }
  
  return Object.keys(subjectData).sort();
}

/**
 * Get statistics about chapter data
 */
export async function getChapterStats(): Promise<{
  totalChapters: number;
  bySubject: Record<string, number>;
  byClass: Record<string, number>;
}> {
  const data = await loadChapterData();
  
  let totalChapters = 0;
  const bySubject: Record<string, number> = {};
  const byClass: Record<string, number> = {};
  
  for (const subject of Object.keys(data)) {
    bySubject[subject] = 0;
    
    for (const classLevel of Object.keys(data[subject])) {
      const chapters = data[subject][classLevel];
      const count = chapters.length;
      
      totalChapters += count;
      bySubject[subject] += count;
      byClass[classLevel] = (byClass[classLevel] || 0) + count;
    }
  }
  
  return {
    totalChapters,
    bySubject,
    byClass,
  };
}

// ===========================
// Exports
// ===========================

export default {
  getChapterList,
  getChapterInfo,
  searchChapters,
  getChapterByName,
  getChapterByNumber,
  getAllSubjects,
  getAvailableClasses,
  getChapterStats,
};
