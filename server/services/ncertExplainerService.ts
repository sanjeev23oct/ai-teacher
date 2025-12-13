import { PrismaClient } from '@prisma/client';
import { aiService } from './aiService';
import audioCacheService, { generateCacheKey } from './audioCacheService';
import chapterDataService, { ChapterInfo } from './chapterDataService';
import { textToSpeech } from './ttsService';
import ncertProgressService from './ncertProgressService';
import contentCacheService from './contentCacheService';
import {
  getEnglishProsePrompt,
  getEnglishPoetryPrompt,
  getSciencePrompt,
  getMathPrompt,
  getHistoryPrompt,
  getGeographyPrompt,
  getCivicsPrompt,
  getFollowUpPrompt,
  getExamTipPrompt,
  getPracticeQuestionPrompt,
} from '../prompts/ncertExplainerPrompts';
import { AUDIO_DURATION_ESTIMATES } from '../config/audioCacheConfig';

const prisma = new PrismaClient();

// ===========================
// TypeScript Interfaces
// ===========================

export interface ChapterRequest {
  class: string;
  subject: string;
  chapterId: string;
  userId: string;
  languageCode?: string;
}

export interface ChapterResponse {
  chapterId: string;
  chapterName: string;
  subject: string;
  class: string;
  summary: string;
  source: 'cache' | 'generated';  // New field to indicate summary source
  audioUrl: string;
  audioMetadata: {
    source: 'cache' | 'elevenlabs';
    cacheKey: string;
    timestamp: string;
    fileSize?: number;
    characterCount?: number;
  };
  duration: number;
  ncertPages?: string;
  bookName?: string;
}

export interface FollowUpRequest {
  chapterId: string;
  question: string;
  userId: string;
  languageCode?: string;
}

export interface FollowUpResponse {
  answer: string;
  audioUrl?: string;
  audioMetadata?: {
    source: 'cache' | 'elevenlabs';
    cacheKey: string;
    timestamp: string;
  };
  relatedTopics?: string[];
}

export interface ProgressStats {
  totalChapters: number;
  bySubject: {
    english: number;
    science: number;
    math: number;
    sst: number;
  };
  completionBadges: string[];
  lastStudied?: Date;
}

export interface ChapterHistory {
  chapterId: string;
  chapterName: string;
  subject: string;
  class: string;
  studiedAt: Date;
  revised: boolean;
}

// ===========================
// Helper: TTS Wrapper
// ===========================

async function generateAudio(text: string): Promise<Buffer> {
  const result = await textToSpeech(text);
  if (!result) {
    throw new Error('TTS generation failed');
  }
  return result;
}

// ===========================
// Chapter Summary Generation
// ===========================

/**
 * Get chapter summary with cache-first approach
 */
export async function getChapterSummary(request: ChapterRequest): Promise<ChapterResponse> {
  const { class: className, subject, chapterId, userId, languageCode = 'en' } = request;

  // Get chapter info
  const chapterInfo = await chapterDataService.getChapterInfo(chapterId);
  if (!chapterInfo) {
    throw new Error(`Chapter not found: ${chapterId}`);
  }

  let summary: string;
  let summarySource: 'cache' | 'generated';

  // Check ContentCache first
  const cacheKey = {
    module: 'ncert',
    contentType: 'summary',
    identifier: chapterId,
    language: languageCode,
  };

  const cachedSummary = await contentCacheService.get(cacheKey);
  
  if (cachedSummary) {
    // Cache hit - use cached summary
    summary = cachedSummary.content;
    summarySource = 'cache';
    console.log(`[NCERT] Cache hit for chapter ${chapterId}`);
  } else {
    // Cache miss - generate via LLM
    console.log(`[NCERT] Cache miss for chapter ${chapterId}, generating via LLM`);
    
    // Select appropriate prompt based on subject
    let prompt: string;
    const promptParams = {
      chapterName: chapterInfo.name,
      chapterNumber: chapterInfo.chapterNumber,
      bookName: chapterInfo.bookName,
      class: className,
      subject,
      ncertPages: chapterInfo.ncertPages,
      languageCode,
    };

    if (subject === 'English') {
      if (chapterInfo.type === 'poetry') {
        prompt = getEnglishPoetryPrompt(promptParams);
      } else {
        prompt = getEnglishProsePrompt(promptParams);
      }
    } else if (subject === 'Science') {
      prompt = getSciencePrompt(promptParams);
    } else if (subject === 'Math') {
      prompt = getMathPrompt(promptParams);
    } else if (subject === 'SST') {
      // Determine History/Geography/Civics from chapterInfo
      if (chapterInfo.subSubject === 'History') {
        prompt = getHistoryPrompt(promptParams);
      } else if (chapterInfo.subSubject === 'Geography') {
        prompt = getGeographyPrompt(promptParams);
      } else {
        prompt = getCivicsPrompt(promptParams);
      }
    } else {
      throw new Error(`Unsupported subject: ${subject}`);
    }

    // Generate AI content
    const aiResponse = await aiService.generateContent({ prompt });
    summary = aiResponse.text;
    summarySource = 'generated';

    // Store generated summary in cache for future requests
    await contentCacheService.set(
      cacheKey,
      summary,
      'llm',
      {
        title: chapterInfo.name,
        subject,
        class: className,
      }
    );
  }

  // Generate cache key for audio
  const audioCacheKey = generateCacheKey({
    module: 'ncert',
    subject: subject.toLowerCase(),
    class: className,
    identifier: chapterId,
    language: languageCode,
    version: 'v1',
  });

  // Get or generate audio with caching
  const audioResult = await audioCacheService.getOrGenerate(
    audioCacheKey,
    summary,
    {
      module: 'ncert',
      subject,
      class: className,
      identifier: chapterId,
      languageCode,
      version: 'v1',
    },
    (text) => generateAudio(text)
  );

  // Save study record and update progress
  await ncertProgressService.recordChapterStudy(
    userId,
    chapterId,
    chapterInfo.name,
    className,
    subject
  );
  await ncertProgressService.updateProgress(userId, subject);

  // Calculate estimated duration
  const wordCount = summary.split(/\s+/).length;
  const duration = Math.ceil((wordCount / AUDIO_DURATION_ESTIMATES.WORDS_PER_MINUTE) * 60);

  return {
    chapterId,
    chapterName: chapterInfo.name,
    subject,
    class: className,
    summary,
    source: summarySource,
    audioUrl: audioResult.audioUrl,
    audioMetadata: {
      source: audioResult.source,
      cacheKey: audioResult.cacheKey,
      timestamp: audioResult.metadata.generatedAt,
      fileSize: audioResult.metadata.fileSize,
      characterCount: audioResult.metadata.characterCount,
    },
    duration,
    ncertPages: chapterInfo.ncertPages,
    bookName: chapterInfo.bookName,
  };
}

// ===========================
// Follow-up Question Handling
// ===========================

/**
 * Answer follow-up question about a chapter
 */
export async function answerFollowUp(request: FollowUpRequest): Promise<FollowUpResponse> {
  const { chapterId, question, userId, languageCode = 'en' } = request;

  // Get chapter info
  const chapterInfo = await chapterDataService.getChapterInfo(chapterId);
  if (!chapterInfo) {
    throw new Error(`Chapter not found: ${chapterId}`);
  }

  // Get study record for context
  const study = await prisma.nCERTChapterStudy.findFirst({
    where: { userId, chapterId },
  });

  // Determine question type
  const questionLower = question.toLowerCase();
  let prompt: string;

  if (questionLower.includes('exam') || questionLower.includes('aayega')) {
    // Exam-focused question
    prompt = getExamTipPrompt({
      chapterName: chapterInfo.name,
      subject: study?.subject || 'General',
      class: study?.class || '9',
      question,
    });
  } else if (questionLower.includes('practice') || questionLower.includes('question')) {
    // Practice questions request
    prompt = getPracticeQuestionPrompt({
      chapterName: chapterInfo.name,
      subject: study?.subject || 'General',
      class: study?.class || '9',
      question,
    });
  } else {
    // General follow-up
    prompt = getFollowUpPrompt({
      chapterName: chapterInfo.name,
      subject: study?.subject || 'General',
      class: study?.class || '9',
      question,
    });
  }

  // Generate AI response
  const aiResponse = await aiService.generateContent({ prompt });
  const answer = aiResponse.text;

  // Update follow-up count
  await ncertProgressService.incrementFollowUpCount(userId, chapterId);

  // For unique questions, generate audio but DON'T cache
  // For common patterns, we could cache with question hash
  const isCommonQuestion =
    questionLower.includes('exam') ||
    questionLower.includes('kya aayega') ||
    questionLower.includes('important') ||
    questionLower.includes('practice');

  let audioUrl: string | undefined;
  let audioMetadata: FollowUpResponse['audioMetadata'];

  if (isCommonQuestion) {
    // Cache common follow-ups with question hash
    const crypto = require('crypto');
    const questionHash = crypto
      .createHash('md5')
      .update(questionLower)
      .digest('hex')
      .substring(0, 8);

    const cacheKey = generateCacheKey({
      module: 'ncert',
      subject: study?.subject.toLowerCase() || 'general',
      class: study?.class || '9',
      identifier: `${chapterId}_faq_${questionHash}`,
      language: languageCode,
      version: 'v1',
    });

    const audioResult = await audioCacheService.getOrGenerate(
      cacheKey,
      answer,
      {
        module: 'ncert',
        subject: study?.subject,
        class: study?.class,
        identifier: `${chapterId}_faq_${questionHash}`,
        languageCode,
      },
      (text) => generateAudio(text)
    );

    audioUrl = audioResult.audioUrl;
    audioMetadata = {
      source: audioResult.source,
      cacheKey: audioResult.cacheKey,
      timestamp: audioResult.metadata.generatedAt,
    };
  }

  return {
    answer,
    audioUrl,
    audioMetadata,
  };
}

// ===========================
// Progress and History (Delegated to ncertProgressService)
// ===========================

/**
 * Get user's study history
 */
export async function getStudyHistory(userId: string): Promise<ChapterHistory[]> {
  return ncertProgressService.getStudyHistory(userId, 50);
}

/**
 * Get user's progress statistics
 */
export async function getProgress(userId: string): Promise<ProgressStats> {
  return ncertProgressService.getProgress(userId);
}

// ===========================
// Exports
// ===========================

export default {
  getChapterSummary,
  answerFollowUp,
  getStudyHistory,
  getProgress,
};
