import { PrismaClient } from '@prisma/client';
import { aiService } from './aiService';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface CreateWorksheetParams {
  imageBuffer: Buffer;
  imageMimeType: string;
  imageUrl: string;
  userId?: string;
  title?: string;
  subject?: string;
}

interface WorksheetProgress {
  worksheetId: string;
  currentQuestion: number;
  totalQuestions: number;
  completed: number;
  skipped: number;
  pending: number;
}

export class WorksheetService {
  /**
   * Detect number of questions in an image using AI
   */
  async detectQuestions(imageBuffer: Buffer, imageMimeType: string): Promise<number> {
    const imageBase64 = imageBuffer.toString('base64');
    
    const prompt = `Analyze this image and count the total number of questions present.
    
Instructions:
- Look for question numbers (1, 2, 3, etc.) or question markers (Q1, Q2, etc.)
- Count all distinct questions in the image
- If you see sub-questions (like 1a, 1b), count them as separate questions
- Return ONLY a single number representing the total count
- If no questions are found, return 0

Response format: Just the number, nothing else.`;

    try {
      const result = await aiService.generateContent({
        prompt,
        imageBase64,
        imageMimeType,
      });

      // Extract number from response
      const match = result.text.match(/\d+/);
      const questionCount = match ? parseInt(match[0], 10) : 0;

      return Math.max(0, questionCount); // Ensure non-negative
    } catch (error) {
      console.error('Error detecting questions:', error);
      throw new Error('Failed to detect questions in image');
    }
  }

  /**
   * Create a new worksheet session
   */
  async createWorksheet(params: CreateWorksheetParams) {
    const { imageBuffer, imageMimeType, imageUrl, userId, title, subject } = params;

    // Generate image hash for deduplication
    const imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

    // Check if worksheet already exists for this image
    const existingWorksheet = await prisma.worksheet.findUnique({
      where: { imageHash },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
    });

    if (existingWorksheet) {
      // Return existing worksheet
      return {
        id: existingWorksheet.id,
        sessionId: existingWorksheet.sessionId,
        totalQuestions: existingWorksheet.totalQuestions,
        currentQuestion: existingWorksheet.currentQuestion,
        imageUrl: existingWorksheet.imageUrl,
      };
    }

    // Detect questions
    const totalQuestions = await this.detectQuestions(imageBuffer, imageMimeType);

    if (totalQuestions === 0) {
      throw new Error('No questions detected in the image');
    }

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create worksheet
    const worksheet = await prisma.worksheet.create({
      data: {
        userId,
        imageUrl,
        imageHash,
        totalQuestions,
        currentQuestion: 1,
        sessionId,
        expiresAt,
        title,
        subject,
      },
    });

    // Create worksheet questions
    const questions = Array.from({ length: totalQuestions }, (_, i) => ({
      worksheetId: worksheet.id,
      questionNumber: i + 1,
      status: 'pending',
    }));

    await prisma.worksheetQuestion.createMany({
      data: questions,
    });

    return {
      id: worksheet.id,
      sessionId: worksheet.sessionId,
      totalQuestions: worksheet.totalQuestions,
      currentQuestion: worksheet.currentQuestion,
      imageUrl: worksheet.imageUrl,
    };
  }

  /**
   * Get worksheet by ID
   */
  async getWorksheet(worksheetId: string) {
    const worksheet = await prisma.worksheet.findUnique({
      where: { id: worksheetId },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
    });

    if (!worksheet) {
      throw new Error('Worksheet not found');
    }

    // Check if expired
    if (new Date() > worksheet.expiresAt) {
      throw new Error('Worksheet session expired');
    }

    return worksheet;
  }

  /**
   * Get worksheet by session ID
   */
  async getWorksheetBySession(sessionId: string) {
    const worksheet = await prisma.worksheet.findUnique({
      where: { sessionId },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
    });

    if (!worksheet) {
      throw new Error('Worksheet session not found');
    }

    // Check if expired
    if (new Date() > worksheet.expiresAt) {
      throw new Error('Worksheet session expired');
    }

    return worksheet;
  }

  /**
   * Get specific question from worksheet
   */
  async getQuestion(worksheetId: string, questionNumber: number) {
    const worksheet = await this.getWorksheet(worksheetId);

    if (questionNumber < 1 || questionNumber > worksheet.totalQuestions) {
      throw new Error('Invalid question number');
    }

    const question = await prisma.worksheetQuestion.findUnique({
      where: {
        worksheetId_questionNumber: {
          worksheetId,
          questionNumber,
        },
      },
      include: {
        doubt: true,
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    return {
      question,
      hasNext: questionNumber < worksheet.totalQuestions,
      hasPrevious: questionNumber > 1,
    };
  }

  /**
   * Cache explanation for a question
   */
  async cacheExplanation(
    worksheetId: string,
    questionNumber: number,
    explanation: any,
    doubtId?: string
  ) {
    await prisma.worksheetQuestion.update({
      where: {
        worksheetId_questionNumber: {
          worksheetId,
          questionNumber,
        },
      },
      data: {
        cachedExplanation: JSON.stringify(explanation),
        status: 'explained',
        doubtId,
      },
    });
  }

  /**
   * Skip a question
   */
  async skipQuestion(worksheetId: string, questionNumber: number) {
    await prisma.worksheetQuestion.update({
      where: {
        worksheetId_questionNumber: {
          worksheetId,
          questionNumber,
        },
      },
      data: {
        status: 'skipped',
      },
    });
  }

  /**
   * Update current question
   */
  async updateCurrentQuestion(worksheetId: string, questionNumber: number) {
    await prisma.worksheet.update({
      where: { id: worksheetId },
      data: { currentQuestion: questionNumber },
    });
  }

  /**
   * Get worksheet progress
   */
  async getWorksheetProgress(worksheetId: string): Promise<WorksheetProgress> {
    const worksheet = await this.getWorksheet(worksheetId);

    const statusCounts = await prisma.worksheetQuestion.groupBy({
      by: ['status'],
      where: { worksheetId },
      _count: true,
    });

    const completed = statusCounts.find((s) => s.status === 'explained')?._count || 0;
    const skipped = statusCounts.find((s) => s.status === 'skipped')?._count || 0;
    const pending = statusCounts.find((s) => s.status === 'pending')?._count || 0;

    return {
      worksheetId: worksheet.id,
      currentQuestion: worksheet.currentQuestion,
      totalQuestions: worksheet.totalQuestions,
      completed,
      skipped,
      pending,
    };
  }

  /**
   * Get next question number
   */
  async getNextQuestionNumber(worksheetId: string, currentNumber: number): Promise<number | null> {
    const worksheet = await this.getWorksheet(worksheetId);

    if (currentNumber >= worksheet.totalQuestions) {
      return null; // No more questions
    }

    return currentNumber + 1;
  }

  /**
   * Check if worksheet is complete
   */
  async isWorksheetComplete(worksheetId: string): Promise<boolean> {
    const progress = await this.getWorksheetProgress(worksheetId);
    return progress.completed + progress.skipped === progress.totalQuestions;
  }

  /**
   * Navigate to next question
   */
  async navigateNext(worksheetId: string, skipCurrent: boolean = false) {
    const worksheet = await this.getWorksheet(worksheetId);
    const currentNumber = worksheet.currentQuestion;

    // Skip current question if requested
    if (skipCurrent) {
      await this.skipQuestion(worksheetId, currentNumber);
    }

    // Get next question number
    const nextNumber = await this.getNextQuestionNumber(worksheetId, currentNumber);

    if (nextNumber === null) {
      // No more questions
      return {
        hasNext: false,
        currentQuestion: currentNumber,
        isComplete: true,
      };
    }

    // Update current question
    await this.updateCurrentQuestion(worksheetId, nextNumber);

    // Get the next question details
    const { question, hasNext } = await this.getQuestion(worksheetId, nextNumber);

    return {
      hasNext,
      currentQuestion: nextNumber,
      question,
      isComplete: false,
    };
  }

  /**
   * Navigate to previous question
   */
  async navigatePrevious(worksheetId: string) {
    const worksheet = await this.getWorksheet(worksheetId);
    const currentNumber = worksheet.currentQuestion;

    if (currentNumber <= 1) {
      throw new Error('Already at first question');
    }

    const previousNumber = currentNumber - 1;

    // Update current question
    await this.updateCurrentQuestion(worksheetId, previousNumber);

    // Get the previous question details
    const { question, hasPrevious } = await this.getQuestion(worksheetId, previousNumber);

    return {
      hasPrevious,
      currentQuestion: previousNumber,
      question,
    };
  }

  /**
   * Navigate to specific question
   */
  async navigateToQuestion(worksheetId: string, questionNumber: number) {
    const worksheet = await this.getWorksheet(worksheetId);

    if (questionNumber < 1 || questionNumber > worksheet.totalQuestions) {
      throw new Error('Invalid question number');
    }

    // Update current question
    await this.updateCurrentQuestion(worksheetId, questionNumber);

    // Get the question details
    const result = await this.getQuestion(worksheetId, questionNumber);

    return {
      currentQuestion: questionNumber,
      ...result,
    };
  }

  /**
   * Extend session expiry
   */
  async extendSession(worksheetId: string, hoursToAdd: number = 24) {
    const worksheet = await this.getWorksheet(worksheetId);

    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + hoursToAdd);

    await prisma.worksheet.update({
      where: { id: worksheetId },
      data: { expiresAt: newExpiresAt },
    });

    return newExpiresAt;
  }

  /**
   * Check if session is expired
   */
  async isSessionExpired(worksheetId: string): Promise<boolean> {
    try {
      const worksheet = await prisma.worksheet.findUnique({
        where: { id: worksheetId },
      });

      if (!worksheet) {
        return true;
      }

      return new Date() > worksheet.expiresAt;
    } catch (error) {
      return true;
    }
  }

  /**
   * Restore session (if not expired)
   */
  async restoreSession(sessionId: string) {
    try {
      const worksheet = await this.getWorksheetBySession(sessionId);

      // Session is valid, return worksheet data
      const progress = await this.getWorksheetProgress(worksheet.id);

      return {
        worksheetId: worksheet.id,
        sessionId: worksheet.sessionId,
        currentQuestion: worksheet.currentQuestion,
        totalQuestions: worksheet.totalQuestions,
        imageUrl: worksheet.imageUrl,
        progress,
        isExpired: false,
      };
    } catch (error) {
      // Session expired or not found
      return {
        isExpired: true,
        error: error instanceof Error ? error.message : 'Session not found',
      };
    }
  }

  /**
   * Clear worksheet context (for starting new worksheet)
   */
  async clearContext(userId: string) {
    // This is a soft operation - we don't delete old worksheets
    // They remain in the database for history
    // Just return success to indicate context is cleared
    return { success: true };
  }

  /**
   * Get user's worksheets
   */
  async getUserWorksheets(userId: string, limit: number = 10) {
    const worksheets = await prisma.worksheet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        questions: {
          select: {
            status: true,
          },
        },
      },
    });

    return worksheets.map((worksheet) => {
      const completed = worksheet.questions.filter((q) => q.status === 'explained').length;
      const skipped = worksheet.questions.filter((q) => q.status === 'skipped').length;
      const pending = worksheet.questions.filter((q) => q.status === 'pending').length;

      return {
        id: worksheet.id,
        sessionId: worksheet.sessionId,
        title: worksheet.title,
        subject: worksheet.subject,
        totalQuestions: worksheet.totalQuestions,
        currentQuestion: worksheet.currentQuestion,
        imageUrl: worksheet.imageUrl,
        createdAt: worksheet.createdAt,
        expiresAt: worksheet.expiresAt,
        isExpired: new Date() > worksheet.expiresAt,
        progress: {
          completed,
          skipped,
          pending,
        },
      };
    });
  }
}

export const worksheetService = new WorksheetService();
