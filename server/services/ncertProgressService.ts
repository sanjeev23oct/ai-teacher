// ===========================
// NCERT Progress & Badge Service
// Handles user progress tracking and badge awards
// ===========================

import { PrismaClient } from '@prisma/client';
import { BADGE_CONFIG } from '../config/audioCacheConfig';

const prisma = new PrismaClient();

// ===========================
// TypeScript Interfaces
// ===========================

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
// Progress Tracking
// ===========================

/**
 * Update user progress after studying a chapter
 */
export async function updateProgress(userId: string, subject: string): Promise<void> {
  const progress = await prisma.nCERTProgress.findUnique({
    where: { userId },
  });

  const subjectField = `${subject.toLowerCase()}Count` as 'englishCount' | 'scienceCount' | 'mathCount' | 'sstCount';
  
  if (progress) {
    await prisma.nCERTProgress.update({
      where: { userId },
      data: {
        totalChapters: { increment: 1 },
        [subjectField]: { increment: 1 },
        lastStudied: new Date(),
      },
    });
  } else {
    await prisma.nCERTProgress.create({
      data: {
        userId,
        totalChapters: 1,
        englishCount: subject === 'English' ? 1 : 0,
        scienceCount: subject === 'Science' ? 1 : 0,
        mathCount: subject === 'Math' ? 1 : 0,
        sstCount: subject === 'SST' ? 1 : 0,
        lastStudied: new Date(),
      },
    });
  }

  // Check for badges
  await checkAndAwardBadges(userId);
}

/**
 * Check and award completion badges based on config
 */
async function checkAndAwardBadges(userId: string): Promise<void> {
  const progress = await prisma.nCERTProgress.findUnique({
    where: { userId },
  });

  if (!progress) return;

  const badges = JSON.parse(progress.completionBadges) as string[];
  let badgesUpdated = false;

  // Check each badge configuration
  for (const badge of Object.values(BADGE_CONFIG)) {
    if (badges.includes(badge.id)) continue; // Already has this badge

    // Check if user meets requirement
    const requirement = badge.requirement;
    const meetsRequirement = Object.entries(requirement).every(([key, value]) => {
      return (progress as any)[key] >= value;
    });

    if (meetsRequirement) {
      badges.push(badge.id);
      badgesUpdated = true;
      console.log(`🏆 Badge awarded to user ${userId}: ${badge.name}`);
    }
  }

  if (badgesUpdated) {
    await prisma.nCERTProgress.update({
      where: { userId },
      data: { completionBadges: JSON.stringify(badges) },
    });
  }
}

/**
 * Get user's study history
 */
export async function getStudyHistory(userId: string, limit: number = 50): Promise<ChapterHistory[]> {
  const studies = await prisma.nCERTChapterStudy.findMany({
    where: { userId },
    orderBy: { studiedAt: 'desc' },
    take: limit,
  });

  return studies.map(study => ({
    chapterId: study.chapterId,
    chapterName: study.chapterName,
    subject: study.subject,
    class: study.class,
    studiedAt: study.studiedAt,
    revised: study.revised,
  }));
}

/**
 * Get user's progress statistics
 */
export async function getProgress(userId: string): Promise<ProgressStats> {
  const progress = await prisma.nCERTProgress.findUnique({
    where: { userId },
  });

  if (!progress) {
    return {
      totalChapters: 0,
      bySubject: {
        english: 0,
        science: 0,
        math: 0,
        sst: 0,
      },
      completionBadges: [],
    };
  }

  return {
    totalChapters: progress.totalChapters,
    bySubject: {
      english: progress.englishCount,
      science: progress.scienceCount,
      math: progress.mathCount,
      sst: progress.sstCount,
    },
    completionBadges: JSON.parse(progress.completionBadges),
    lastStudied: progress.lastStudied,
  };
}

/**
 * Record chapter study activity
 */
export async function recordChapterStudy(
  userId: string,
  chapterId: string,
  chapterName: string,
  className: string,
  subject: string
): Promise<void> {
  await prisma.nCERTChapterStudy.upsert({
    where: {
      userId_class_subject_chapterId: {
        userId,
        class: className,
        subject,
        chapterId,
      },
    },
    create: {
      userId,
      class: className,
      subject,
      chapterId,
      chapterName,
      completedSummary: true,
      studiedAt: new Date(),
    },
    update: {
      studiedAt: new Date(),
      completedSummary: true,
      revised: true,
    },
  });
}

/**
 * Increment follow-up count for a chapter
 */
export async function incrementFollowUpCount(userId: string, chapterId: string): Promise<void> {
  const study = await prisma.nCERTChapterStudy.findFirst({
    where: { userId, chapterId },
  });

  if (study) {
    await prisma.nCERTChapterStudy.update({
      where: { id: study.id },
      data: { followUpCount: { increment: 1 } },
    });
  }
}

// ===========================
// Exports
// ===========================

export default {
  updateProgress,
  getStudyHistory,
  getProgress,
  recordChapterStudy,
  incrementFollowUpCount,
};
