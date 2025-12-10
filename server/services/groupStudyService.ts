import prisma from '../lib/prisma';
import { aiService } from './aiService';
import { textToSpeech } from './ttsService';
import { getClassmate1Prompt, getClassmate2Prompt, getEvaluationPrompt, getTipsForScore } from '../prompts/groupStudyPrompts';
import { v4 as uuidv4 } from 'uuid';

// TypeScript interfaces
export interface SessionRequest {
  topic: string;
  subject: string;
  userId: string;
  classmate1Name: string;
  classmate2Name: string;
  question?: string;
  languageCode?: string;
}

export interface SessionResponse {
  sessionId: string;
  topic: string;
  subject: string;
  classmate1Name: string;
  classmate2Name: string;
  initialPrompt: string;
}

export interface AIResponse {
  speaker: 'classmate1' | 'classmate2';
  speakerName: string;
  message: string;
  challengeType: 'follow-up' | 'counter' | 'clarification' | 'example';
}

export interface EvaluationResult {
  handlingScore: number;
  strengths: string[];
  improvements: string[];
  tips: string[];
  badge?: string;
  nextDifficulty: DifficultyLevel;
}

export interface HandlingHistory {
  topic: string;
  subject: string;
  score: number;
  date: string;
  challenges: number;
  badges?: string[];
}

export type DifficultyLevel = 'supportive' | 'moderate' | 'challenging';

// In-memory session state
interface ActiveGroupSession {
  sessionId: string;
  userId: string;
  topic: string;
  subject: string;
  classmate1Name: string;
  classmate2Name: string;
  currentPhase: 'initial' | 'classmate1' | 'classmate2' | 'evaluation';
  difficulty: DifficultyLevel;
  startTime: Date;
  languageCode: string;
  responses: {
    student: string;
    classmate1?: string;
    classmate2?: string;
  };
}

const activeSessions = new Map<string, ActiveGroupSession>();

class GroupStudyService {
  /**
   * Start a new group study session
   */
  async startSession(request: SessionRequest): Promise<SessionResponse> {
    const { topic, subject, userId, classmate1Name, classmate2Name, question, languageCode = 'en' } = request;
    
    if (!userId) {
      throw new Error('User ID is required for group study sessions');
    }
    
    if (!classmate1Name || !classmate2Name) {
      throw new Error('Both classmate names are required');
    }
    
    const sessionId = uuidv4();
    
    console.log(`[GroupStudy] Starting session - Topic: ${topic}, Subject: ${subject}, Classmates: ${classmate1Name} & ${classmate2Name}`);

    // Get user's current difficulty level
    const progress = await this.getUserProgress(userId);
    const difficulty = progress?.currentLevel as DifficultyLevel || 'moderate';

    // Create active session
    const session: ActiveGroupSession = {
      sessionId,
      userId,
      topic,
      subject,
      classmate1Name,
      classmate2Name,
      currentPhase: 'initial',
      difficulty,
      startTime: new Date(),
      languageCode,
      responses: {
        student: '',
      },
    };
    activeSessions.set(sessionId, session);

    const initialPrompt = question || `Let's discuss ${topic} in ${subject}. ${classmate1Name} and ${classmate2Name} are ready to challenge your understanding!`;

    return {
      sessionId,
      topic,
      subject,
      classmate1Name,
      classmate2Name,
      initialPrompt,
    };
  }

  /**
   * Get first classmate's follow-up question
   */
  async getClassmate1Question(sessionId: string, studentAnswer: string): Promise<AIResponse> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.responses.student = studentAnswer;
    session.currentPhase = 'classmate1';

    console.log(`[GroupStudy] Generating ${session.classmate1Name}'s question...`);

    // Generate follow-up question using AI
    const prompt = getClassmate1Prompt({
      classmateName: session.classmate1Name,
      studentAnswer,
      topic: session.topic,
      subject: session.subject,
      languageCode: session.languageCode,
      difficulty: session.difficulty,
    });

    const result = await aiService.generateContent({ prompt });
    const questionText = result.text;
    
    // Determine challenge type based on answer quality
    const challengeType = this.determineChallengeType(studentAnswer);

    return {
      speaker: 'classmate1',
      speakerName: session.classmate1Name,
      message: questionText,
      challengeType,
    };
  }

  /**
   * Get second classmate's counter-argument
   */
  async getClassmate2Counter(sessionId: string, classmate1Response: string): Promise<AIResponse> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.responses.classmate1 = classmate1Response;
    session.currentPhase = 'classmate2';

    console.log(`[GroupStudy] Generating ${session.classmate2Name}'s counter-argument...`);

    // We need the classmate1's question from database or memory
    // For now, generate a placeholder - in production, store this in session
    const classmate1Question = "Follow-up question"; // This should be retrieved from session storage

    // Generate counter-argument using AI
    const prompt = getClassmate2Prompt({
      classmateName: session.classmate2Name,
      studentAnswer: session.responses.student,
      classmate1Name: session.classmate1Name,
      classmate1Question,
      classmate1Response,
      topic: session.topic,
      subject: session.subject,
      languageCode: session.languageCode,
      difficulty: session.difficulty,
    });

    const result = await aiService.generateContent({ prompt });
    const counterText = result.text;

    return {
      speaker: 'classmate2',
      speakerName: session.classmate2Name,
      message: counterText,
      challengeType: 'counter',
    };
  }

  /**
   * Evaluate student's handling skill
   */
  async evaluateHandling(
    sessionId: string,
    classmate2Response: string
  ): Promise<EvaluationResult> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.responses.classmate2 = classmate2Response;
    session.currentPhase = 'evaluation';

    console.log(`[GroupStudy] Evaluating handling skill...`);

    // Generate evaluation using AI
    const evaluationPrompt = getEvaluationPrompt(
      session.topic,
      session.subject,
      session.responses.student,
      'classmate1Question', // Should be stored
      session.responses.classmate1 || '',
      'classmate2Counter', // Should be stored
      session.responses.classmate2 || ''
    );

    const result = await aiService.generateContent({ prompt: evaluationPrompt });
    const evaluationText = result.text;
    
    // Parse JSON response
    let evaluation: { score: number; strengths: string[]; improvements: string[] };
    try {
      evaluation = JSON.parse(evaluationText);
    } catch (error) {
      console.error('[GroupStudy] Failed to parse evaluation:', error);
      evaluation = {
        score: 3,
        strengths: ['Participated in the discussion'],
        improvements: ['Try to provide more detailed explanations'],
      };
    }

    const handlingScore = Math.max(1, Math.min(5, evaluation.score));

    // Save session to database
    await prisma.groupStudySession.create({
      data: {
        id: sessionId,
        userId: session.userId,
        topic: session.topic,
        subject: session.subject,
        classmate1Name: session.classmate1Name,
        classmate2Name: session.classmate2Name,
        studentAnswer: session.responses.student,
        classmate1Response: session.responses.classmate1,
        classmate2Response: session.responses.classmate2,
        handlingScore,
        strengths: JSON.stringify(evaluation.strengths),
        improvements: JSON.stringify(evaluation.improvements),
        completedAt: new Date(),
      },
    });

    // Update user progress
    const nextDifficulty = await this.updateUserProgress(session.userId, handlingScore);

    // Check for badges
    const badge = await this.checkBadges(session.userId, handlingScore);

    // Get tips for improvement
    const tips = getTipsForScore(handlingScore);

    // Clean up active session
    activeSessions.delete(sessionId);

    return {
      handlingScore,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      tips,
      badge,
      nextDifficulty,
    };
  }

  /**
   * Get user's handling skill progress
   */
  async getUserProgress(userId: string) {
    return await prisma.handlingSkillProgress.findUnique({
      where: { userId },
    });
  }

  /**
   * Update user's progress and calculate next difficulty
   */
  async updateUserProgress(userId: string, newScore: number): Promise<DifficultyLevel> {
    const progress = await this.getUserProgress(userId);

    if (!progress) {
      // Create new progress record
      await prisma.handlingSkillProgress.create({
        data: {
          userId,
          currentLevel: 'moderate',
          avgScore: newScore,
          sessionsCount: 1,
        },
      });
      return 'moderate';
    }

    // Calculate new average (last 5 sessions weighted)
    const newAvg = (progress.avgScore * progress.sessionsCount + newScore) / (progress.sessionsCount + 1);
    const newSessionsCount = progress.sessionsCount + 1;

    // Determine next difficulty
    let nextDifficulty: DifficultyLevel;
    if (newAvg >= 4) nextDifficulty = 'challenging';
    else if (newAvg >= 2.5) nextDifficulty = 'moderate';
    else nextDifficulty = 'supportive';

    await prisma.handlingSkillProgress.update({
      where: { userId },
      data: {
        currentLevel: nextDifficulty,
        avgScore: newAvg,
        sessionsCount: newSessionsCount,
        lastSession: new Date(),
      },
    });

    return nextDifficulty;
  }

  /**
   * Check if user earned any badges
   */
  async checkBadges(userId: string, latestScore: number): Promise<string | undefined> {
    // Get last 3 sessions
    const recentSessions = await prisma.groupStudySession.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 3,
    });

    if (recentSessions.length < 3) return undefined;

    // Check for "Discussion Pro" badge (3 consecutive scores >= 4)
    const allHighScores = recentSessions.every((s: any) => (s.handlingScore || 0) >= 4);
    if (allHighScores) {
      await this.awardBadge(userId, 'Discussion Pro');
      return 'Discussion Pro';
    }

    return undefined;
  }

  /**
   * Award badge to user
   */
  async awardBadge(userId: string, badgeName: string) {
    const progress = await this.getUserProgress(userId);
    if (!progress) return;

    const currentBadges = JSON.parse(progress.badges || '[]');
    if (!currentBadges.includes(badgeName)) {
      currentBadges.push(badgeName);
      await prisma.handlingSkillProgress.update({
        where: { userId },
        data: { badges: JSON.stringify(currentBadges) },
      });
      console.log(`[GroupStudy] Badge awarded: ${badgeName} to user ${userId}`);
    }
  }

  /**
   * Get user's group study history
   */
  async getHistory(userId: string): Promise<HandlingHistory[]> {
    const sessions = await prisma.groupStudySession.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });

    const progress = await this.getUserProgress(userId);
    const badges = progress ? JSON.parse(progress.badges || '[]') : [];

    return sessions.map((session) => ({
      topic: session.topic,
      subject: session.subject,
      score: session.handlingScore || 0,
      date: session.completedAt
        ? new Date(session.completedAt).toLocaleDateString()
        : new Date(session.createdAt).toLocaleDateString(),
      challenges: session.challengesCount,
      badges,
    }));
  }

  /**
   * Determine challenge type based on answer quality
   */
  private determineChallengeType(answer: string): 'follow-up' | 'clarification' | 'example' {
    const wordCount = answer.split(' ').length;
    const hasExample = /for example|such as|like/i.test(answer);
    
    if (wordCount < 10) return 'clarification';
    if (!hasExample && wordCount < 30) return 'example';
    return 'follow-up';
  }

  /**
   * Generate audio for AI classmate message
   */
  async getAudioStream(text: string, speakerRole: 'questioner' | 'challenger'): Promise<AsyncIterable<Buffer> | null> {
    // For now, use default TTS
    // In future, could use different voices based on role
    const audioBuffer = await textToSpeech(text);
    
    if (!audioBuffer) return null;

    // Convert buffer to async iterable
    async function* bufferToStream(buffer: Buffer) {
      yield buffer;
    }
    
    return bufferToStream(audioBuffer);
  }
}

export const groupStudyService = new GroupStudyService();
