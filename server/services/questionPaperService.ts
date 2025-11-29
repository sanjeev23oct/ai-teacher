import prisma from '../lib/prisma';
import { calculateImageHash } from '../lib/imageHash';
import fs from 'fs';
import path from 'path';

interface QuestionData {
  questionNumber: string;
  questionText: string;
  maxScore?: number;
  topic?: string;
  concept?: string;
  positionX?: number;
  positionY?: number;
}

interface QuestionPaperData {
  title?: string;
  subject: string;
  gradeLevel: string;
  language: string;
  imageUrl: string;
  questions: QuestionData[];
}

/**
 * Check if a question paper already exists by image hash
 */
export async function findQuestionPaperByHash(imageHash: string) {
  return await prisma.questionPaper.findUnique({
    where: { imageHash },
    include: {
      questions: {
        orderBy: { questionNumber: 'asc' }
      }
    }
  });
}

/**
 * Store a new question paper with its questions
 */
export async function storeQuestionPaper(
  imagePath: string,
  data: QuestionPaperData
) {
  // Calculate image hash
  const imageHash = calculateImageHash(imagePath);

  // Check if already exists
  const existing = await findQuestionPaperByHash(imageHash);
  if (existing) {
    console.log('Question paper already exists, returning existing:', existing.id);
    return existing;
  }

  // Store new question paper
  const questionPaper = await prisma.questionPaper.create({
    data: {
      title: data.title,
      subject: data.subject,
      gradeLevel: data.gradeLevel,
      language: data.language,
      imageUrl: data.imageUrl,
      imageHash: imageHash,
      totalQuestions: data.questions.length,
      questions: {
        create: data.questions.map(q => ({
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          maxScore: q.maxScore,
          topic: q.topic,
          concept: q.concept,
          positionX: q.positionX,
          positionY: q.positionY
        }))
      }
    },
    include: {
      questions: {
        orderBy: { questionNumber: 'asc' }
      }
    }
  });

  console.log('Stored new question paper:', questionPaper.id);
  return questionPaper;
}

/**
 * Get question paper by ID
 */
export async function getQuestionPaper(id: string) {
  return await prisma.questionPaper.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { questionNumber: 'asc' }
      }
    }
  });
}

/**
 * List all question papers (most recent first)
 */
export async function listQuestionPapers(limit: number = 20) {
  return await prisma.questionPaper.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { gradings: true }
      }
    }
  });
}

/**
 * Increment usage count when question paper is used
 */
export async function incrementUsageCount(id: string) {
  return await prisma.questionPaper.update({
    where: { id },
    data: {
      usageCount: { increment: 1 }
    }
  });
}

/**
 * Store grading result
 */
export async function storeGrading(data: {
  userId?: string;
  questionPaperId?: string;
  answerSheetUrl: string;
  subject: string;
  language: string;
  gradeLevel: string;
  totalScore: string;
  feedback: string;
  matchingMode?: string;
  totalQuestions?: number;
  answeredQuestions?: number;
  answers: Array<{
    questionNumber: string;
    studentAnswer: string | null;
    correct: boolean;
    score: string;
    remarks: string;
    matched?: boolean;
    matchConfidence?: number;
    positionX?: number;
    positionY?: number;
  }>;
}) {
  const grading = await prisma.grading.create({
    data: {
      userId: data.userId,
      questionPaperId: data.questionPaperId,
      answerSheetUrl: data.answerSheetUrl,
      subject: data.subject,
      language: data.language,
      gradeLevel: data.gradeLevel,
      totalScore: data.totalScore,
      feedback: data.feedback,
      matchingMode: data.matchingMode,
      totalQuestions: data.totalQuestions,
      answeredQuestions: data.answeredQuestions,
      answers: {
        create: data.answers.map(a => ({
          questionNumber: a.questionNumber,
          studentAnswer: a.studentAnswer,
          correct: a.correct,
          score: a.score,
          remarks: a.remarks,
          matched: a.matched ?? true,
          matchConfidence: a.matchConfidence,
          positionX: a.positionX,
          positionY: a.positionY
        }))
      }
    },
    include: {
      answers: true
    }
  });

  // Increment usage count if question paper was used
  if (data.questionPaperId) {
    await incrementUsageCount(data.questionPaperId);
  }

  return grading;
}
