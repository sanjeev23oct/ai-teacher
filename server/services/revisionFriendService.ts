import prisma from '../lib/prisma';
import { aiService } from './aiService';
import { textToSpeechStream } from './ttsService';
import { languageService } from './languageService';
import { v4 as uuidv4 } from 'uuid';

// TypeScript interfaces
export interface RevisionRequest {
  topic: string;
  subject: string;
  userId?: string;
  languageCode?: string;
}

export interface RevisionPhaseResponse {
  sessionId: string;
  phase: string;
  content: string;
  duration: number;
  hasAudio: boolean;
}

export interface PerformanceData {
  quizScore: number;
  weakAreas: string[];
  completedPhases: string[];
}

export interface RevisionHistory {
  topic: string;
  subject: string;
  score: number;
  date: string;
  weakAreas: string[];
}

// In-memory session state
interface ActiveSession {
  sessionId: string;
  userId?: string;
  topic: string;
  subject: string;
  currentPhase: string;
  startTime: Date;
  phaseHistory: string[];
  languageCode: string;
}

const activeSessions = new Map<string, ActiveSession>();

// Phase durations in seconds
const PHASE_DURATIONS = {
  explanation: 60,
  repeat: 30,
  quiz: 60,
  drill: 30,
};

class RevisionFriendService {
  /**
   * Start a new revision session
   */
  async startRevision(request: RevisionRequest): Promise<RevisionPhaseResponse> {
    const { topic, subject, userId, languageCode = 'en' } = request;
    const sessionId = uuidv4();
    
    console.log(`[RevisionFriend] Starting revision - Topic: ${topic}, Subject: ${subject}, Language: ${languageCode}`);

    // Create active session
    const session: ActiveSession = {
      sessionId,
      userId,
      topic,
      subject,
      currentPhase: 'explanation',
      startTime: new Date(),
      phaseHistory: ['explanation'],
      languageCode,
    };
    activeSessions.set(sessionId, session);

    // Create database record
    await prisma.revisionSession.create({
      data: {
        id: sessionId,
        userId,
        topic,
        subject,
        phasesCompleted: JSON.stringify(['explanation']),
      },
    });

    // Generate explanation content with language support
    const content = await this.generatePhaseContent('explanation', topic, subject, undefined, languageCode);

    return {
      sessionId,
      phase: 'explanation',
      content,
      duration: PHASE_DURATIONS.explanation,
      hasAudio: true,
    };
  }

  /**
   * Get next phase content
   */
  async getNextPhase(
    sessionId: string,
    currentPhase: string
  ): Promise<RevisionPhaseResponse> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Determine next phase
    const phaseOrder = ['explanation', 'repeat', 'quiz', 'drill'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
      throw new Error('Invalid phase or session complete');
    }

    const nextPhase = phaseOrder[currentIndex + 1];
    session.currentPhase = nextPhase;
    session.phaseHistory.push(nextPhase);

    // Update database
    await prisma.revisionSession.update({
      where: { id: sessionId },
      data: {
        phasesCompleted: JSON.stringify(session.phaseHistory),
      },
    });

    // Generate content for next phase with language support
    const content = await this.generatePhaseContent(
      nextPhase,
      session.topic,
      session.subject,
      session.phaseHistory,
      session.languageCode
    );

    return {
      sessionId,
      phase: nextPhase,
      content,
      duration: PHASE_DURATIONS[nextPhase as keyof typeof PHASE_DURATIONS],
      hasAudio: true,
    };
  }

  /**
   * Complete revision session and track performance
   */
  async completeRevision(
    sessionId: string,
    performance: PerformanceData
  ): Promise<void> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const { quizScore, weakAreas } = performance;

    // Update session in database
    await prisma.revisionSession.update({
      where: { id: sessionId },
      data: {
        completedAt: new Date(),
        score: quizScore,
        weakAreas: JSON.stringify(weakAreas),
        phasesCompleted: JSON.stringify(session.phaseHistory),
      },
    });

    // Track weak topics if score is low
    if (session.userId) {
      if (quizScore < 3) {
        // Add or update weak topic
        await prisma.weakTopic.upsert({
          where: {
            userId_topic_subject: {
              userId: session.userId,
              topic: session.topic,
              subject: session.subject,
            },
          },
          create: {
            userId: session.userId,
            topic: session.topic,
            subject: session.subject,
            occurrences: 1,
            lastSeen: new Date(),
            improved: false,
          },
          update: {
            occurrences: { increment: 1 },
            lastSeen: new Date(),
            improved: false,
          },
        });
      } else if (quizScore >= 4) {
        // Mark topic as improved
        await prisma.weakTopic.updateMany({
          where: {
            userId: session.userId,
            topic: session.topic,
            subject: session.subject,
          },
          data: {
            improved: true,
            improvedAt: new Date(),
          },
        });
      }
    }

    // Clean up active session
    activeSessions.delete(sessionId);
  }

  /**
   * Get revision history for a user
   */
  async getRevisionHistory(userId: string): Promise<RevisionHistory[]> {
    const sessions = await prisma.revisionSession.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });

    return sessions.map((session) => ({
      topic: session.topic,
      subject: session.subject,
      score: session.score || 0,
      date: session.completedAt
        ? new Date(session.completedAt).toLocaleDateString()
        : '',
      weakAreas: session.weakAreas ? JSON.parse(session.weakAreas) : [],
    }));
  }

  /**
   * Get personalized suggestions for a user
   */
  async getSuggestions(userId?: string): Promise<string[]> {
    const suggestions: string[] = [];

    if (userId) {
      // Get weak topics
      const weakTopics = await prisma.weakTopic.findMany({
        where: {
          userId,
          improved: false,
        },
        orderBy: { lastSeen: 'desc' },
        take: 3,
      });

      suggestions.push(
        ...weakTopics.map((wt) => `${wt.topic} (${wt.subject}) - Weak area`)
      );
    }

    // Add common CBSE topics
    const commonTopics = [
      'Photosynthesis (Science)',
      'The Fun They Had (English)',
      'Quadratic Equations (Math)',
      'French Revolution (SST)',
      'The Lost Child (English)',
      'Acids and Bases (Science)',
      'Coordinate Geometry (Math)',
    ];

    // Get recent topics to avoid duplicates
    const recentTopics = userId
      ? await prisma.revisionSession.findMany({
          where: { userId, completedAt: { not: null } },
          orderBy: { completedAt: 'desc' },
          take: 5,
          select: { topic: true },
        })
      : [];

    const recentTopicNames = recentTopics.map((t) => t.topic.toLowerCase());

    // Add topics not recently revised
    const newSuggestions = commonTopics.filter(
      (topic) =>
        !recentTopicNames.some((recent) =>
          topic.toLowerCase().includes(recent)
        ) &&
        !suggestions.some((s) => s.toLowerCase().includes(topic.toLowerCase()))
    );

    suggestions.push(...newSuggestions.slice(0, 6 - suggestions.length));

    return suggestions.slice(0, 6);
  }

  /**
   * Generate phase-specific content using AI
   */
  private async generatePhaseContent(
    phase: string,
    topic: string,
    subject: string,
    phaseHistory?: string[],
    languageCode: string = 'en'
  ): Promise<string> {
    const prompts = {
      explanation: `You are a friendly tutor helping a CBSE Class 9-10 student revise "${topic}" in ${subject}.

Provide a 60-second explanation covering:
- Main concept in easy words
- 2-3 key points to remember
- One practical example
- Why it's important for exams

Keep it conversational and friendly, like a friend explaining.
Make it feel like a friend explaining, not a teacher lecturing.

Give a clear, engaging 60-second explanation:`,

      repeat: `Create a 30-second repetition exercise for "${topic}" in ${subject}.

Format: "Now your turn - repeat these 3 main points:
1. [Point 1]
2. [Point 2]
3. [Point 3]

Say it loudly and clearly!"

List 3 key points the student should repeat:`,

      quiz: `Create a 60-second quick quiz with 3 questions about "${topic}" in ${subject} for CBSE Class 9-10.

Format EXACTLY as follows (use this exact format):
Q1: [Question text]
A1: [Correct answer]

Q2: [Question text]
A2: [Correct answer]

Q3: [Question text]
A3: [Correct answer]

Make questions exam-relevant but not too hard. Keep questions clear and answers concise.

Create 3 quick questions:`,

      drill: `Create a 30-second rapid drill for "${topic}" in ${subject}.

Format: "Last 30 seconds - rapid fire!
- Remember: [Key point 1]
- Don't forget: [Key point 2]
- Exam tip: [Important tip]

You've got this! 💪"

Create the final drill:`,
    };

    const basePrompt = prompts[phase as keyof typeof prompts];
    if (!basePrompt) {
      throw new Error(`Invalid phase: ${phase}`);
    }

    // Build language-aware prompt - this adds the language instruction at the beginning
    const prompt = languageService.buildLanguageAwarePrompt(basePrompt, languageCode);
    
    // Debug logging
    console.log(`[RevisionFriend] Generating ${phase} content for language: ${languageCode}`);
    console.log(`[RevisionFriend] Language instruction: ${languageService.getPromptInstruction(languageCode).substring(0, 100)}...`);

    try {
      const result = await aiService.generateContent({ prompt });
      console.log(`[RevisionFriend] Generated content (first 200 chars): ${result.text.substring(0, 200)}...`);
      return result.text;
    } catch (error) {
      console.error(`Error generating ${phase} content:`, error);
      // Fallback content
      return this.getFallbackContent(phase, topic, subject);
    }
  }

  /**
   * Get audio stream for content with language support
   */
  async getAudioStream(content: string, languageCode?: string): Promise<AsyncIterable<Buffer> | null> {
    try {
      // Get TTS config for the language
      const voiceId = languageCode ? languageService.getTTSVoiceId(languageCode) : undefined;
      const model = languageCode ? languageService.getTTSModel(languageCode) : undefined;
      
      console.log(`[RevisionFriend] Getting audio stream - Language: ${languageCode}, Voice: ${voiceId}, Model: ${model}`);
      
      return await textToSpeechStream(content, voiceId, model);
    } catch (error) {
      console.error('Error generating audio stream:', error);
      return null;
    }
  }

  /**
   * Get language code for a session
   */
  getSessionLanguage(sessionId: string): string {
    const session = activeSessions.get(sessionId);
    return session?.languageCode || 'en';
  }

  /**
   * Fallback content when AI fails
   */
  private getFallbackContent(
    phase: string,
    topic: string,
    subject: string
  ): string {
    const fallbacks = {
      explanation: `Let's revise ${topic} in ${subject}. This is an important topic for your exams. Focus on understanding the main concepts and how they apply in real life.`,
      repeat: `Now repeat these key points about ${topic}: 1. Main concept, 2. Important formula or rule, 3. Real-world application.`,
      quiz: `Quick quiz on ${topic}: Question 1: What is the main concept? Question 2: How is it used? Question 3: Why is it important?`,
      drill: `Final drill for ${topic}: Remember the key formula, don't forget the exceptions, and practice similar problems. You've got this!`,
    };

    return fallbacks[phase as keyof typeof fallbacks] || `Content for ${phase}`;
  }
}

export const revisionFriendService = new RevisionFriendService();
