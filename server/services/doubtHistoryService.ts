import { PrismaClient } from '@prisma/client';
import { Subject } from '../prompts/subjectPrompts';

const prisma = new PrismaClient();

interface DoubtHistoryItem {
  id: string;
  questionThumbnail?: string;
  questionPreview: string;
  subject: Subject;
  language: string;
  timestamp: number;
  isFavorite: boolean;
  messageCount: number;
}

export async function getHistory(params: {
  userId: string;
  page?: number;
  limit?: number;
  subject?: Subject;
  searchQuery?: string;
}): Promise<{
  doubts: DoubtHistoryItem[];
  total: number;
  page: number;
  limit: number;
}> {
  const { userId, page = 1, limit = 20, subject, searchQuery } = params;

  // Build where clause
  const where: any = { userId };

  if (subject) {
    where.subject = subject;
  }

  if (searchQuery) {
    where.OR = [
      { questionText: { contains: searchQuery, mode: 'insensitive' } },
      { subject: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Get total count
  const total = await prisma.doubt.count({ where });

  // Get doubts with pagination
  const doubts = await prisma.doubt.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      questionImage: true,
      questionText: true,
      subject: true,
      language: true,
      createdAt: true,
      isFavorite: true,
      messageCount: true,
    },
  });

  // Transform to history items
  const historyItems: DoubtHistoryItem[] = doubts.map((doubt) => ({
    id: doubt.id,
    questionThumbnail: doubt.questionImage || undefined,
    questionPreview: doubt.questionText.substring(0, 100) + (doubt.questionText.length > 100 ? '...' : ''),
    subject: doubt.subject as Subject,
    language: doubt.language,
    timestamp: doubt.createdAt.getTime(),
    isFavorite: doubt.isFavorite,
    messageCount: doubt.messageCount,
  }));

  return {
    doubts: historyItems,
    total,
    page,
    limit,
  };
}

export async function getDoubt(doubtId: string): Promise<{
  doubt: any;
  conversation: any[];
}> {
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!doubt) {
    throw new Error('Doubt not found');
  }

  // Parse explanation
  const explanation = JSON.parse(doubt.explanation);
  const annotations = doubt.annotations ? JSON.parse(doubt.annotations) : [];
  const imageDimensions = doubt.imageDimensions ? JSON.parse(doubt.imageDimensions) : undefined;

  // Transform messages
  const conversation = doubt.messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.createdAt.getTime(),
    audioUrl: msg.audioUrl || undefined,
  }));

  return {
    doubt: {
      doubtId: doubt.id,
      conversationId: doubt.conversationId,
      questionImage: doubt.questionImage || undefined,
      questionText: doubt.questionText,
      subject: doubt.subject,
      language: doubt.language,
      whatQuestionAsks: explanation.whatQuestionAsks,
      steps: explanation.steps,
      finalAnswer: explanation.finalAnswer,
      keyConcepts: explanation.keyConcepts,
      practiceTip: explanation.practiceTip,
      annotations,
      imageDimensions,
      isFavorite: doubt.isFavorite,
    },
    conversation,
  };
}

export async function toggleFavorite(doubtId: string, userId: string): Promise<{ isFavorite: boolean }> {
  // Get current favorite status
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    select: { isFavorite: true, userId: true },
  });

  if (!doubt) {
    throw new Error('Doubt not found');
  }

  if (doubt.userId !== userId) {
    throw new Error('Unauthorized');
  }

  // Toggle favorite
  const updated = await prisma.doubt.update({
    where: { id: doubtId },
    data: { isFavorite: !doubt.isFavorite },
    select: { isFavorite: true },
  });

  return { isFavorite: updated.isFavorite };
}

export async function searchDoubts(params: {
  userId: string;
  query: string;
}): Promise<DoubtHistoryItem[]> {
  const { userId, query } = params;

  const doubts = await prisma.doubt.findMany({
    where: {
      userId,
      OR: [
        { questionText: { contains: query, mode: 'insensitive' } },
        { subject: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      questionImage: true,
      questionText: true,
      subject: true,
      language: true,
      createdAt: true,
      isFavorite: true,
      messageCount: true,
    },
  });

  return doubts.map((doubt) => ({
    id: doubt.id,
    questionThumbnail: doubt.questionImage || undefined,
    questionPreview: doubt.questionText.substring(0, 100) + (doubt.questionText.length > 100 ? '...' : ''),
    subject: doubt.subject as Subject,
    language: doubt.language,
    timestamp: doubt.createdAt.getTime(),
    isFavorite: doubt.isFavorite,
    messageCount: doubt.messageCount,
  }));
}
