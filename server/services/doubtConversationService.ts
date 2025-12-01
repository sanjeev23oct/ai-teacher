import { PrismaClient } from '@prisma/client';
import { buildConversationPrompt, Subject, Language } from '../prompts/subjectPrompts';
import { aiService } from './aiService';

const prisma = new PrismaClient();

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function sendMessage(params: {
  conversationId: string;
  doubtId: string;
  message: string;
  conversationHistory: Message[];
}): Promise<{ response: string; audioUrl?: string }> {
  const { conversationId, doubtId, message, conversationHistory } = params;

  // Get doubt from database
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
  });

  if (!doubt) {
    throw new Error('Doubt not found');
  }

  if (doubt.conversationId !== conversationId) {
    throw new Error('Invalid conversation ID');
  }

  // Parse explanation
  const explanation = JSON.parse(doubt.explanation);

  // Build conversation prompt
  const systemPrompt = buildConversationPrompt(
    doubt.subject as Subject,
    doubt.language as Language,
    doubt.questionText,
    JSON.stringify(explanation)
  );

  // Build full prompt with context
  const fullPrompt = `${systemPrompt}\n\nStudent: ${message}`;

  // Call AI service (non-streaming)
  const result = await aiService.generateContent({ prompt: fullPrompt });
  const response = result.text;

  // Save messages to database
  await prisma.doubtMessage.create({
    data: {
      doubtId,
      role: 'user',
      content: message,
    },
  });

  await prisma.doubtMessage.create({
    data: {
      doubtId,
      role: 'assistant',
      content: response,
    },
  });

  // Update message count
  await prisma.doubt.update({
    where: { id: doubtId },
    data: {
      messageCount: {
        increment: 2,
      },
    },
  });

  return { response };
}

export async function* streamResponse(params: {
  conversationId: string;
  doubtId: string;
  message: string;
  conversationHistory: Message[];
}): AsyncIterator<string> {
  const { conversationId, doubtId, message, conversationHistory } = params;

  // Get doubt from database
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
  });

  if (!doubt) {
    throw new Error('Doubt not found');
  }

  if (doubt.conversationId !== conversationId) {
    throw new Error('Invalid conversation ID');
  }

  // Parse explanation
  const explanation = JSON.parse(doubt.explanation);

  // Build conversation prompt
  const systemPrompt = buildConversationPrompt(
    doubt.subject as Subject,
    doubt.language as Language,
    doubt.questionText,
    JSON.stringify(explanation)
  );

  // Build conversation history
  const history = [
    { role: 'assistant' as const, content: systemPrompt },
    ...conversationHistory,
  ];

  let fullResponse = '';

  // Stream from AI service
  const stream = aiService.streamContent(message, history);
  
  for await (const chunk of stream) {
    fullResponse += chunk;
    yield chunk;
  }

  // Save messages to database after streaming completes
  await prisma.doubtMessage.create({
    data: {
      doubtId,
      role: 'user',
      content: message,
    },
  });

  await prisma.doubtMessage.create({
    data: {
      doubtId,
      role: 'assistant',
      content: fullResponse,
    },
  });

  // Update message count
  await prisma.doubt.update({
    where: { id: doubtId },
    data: {
      messageCount: {
        increment: 2,
      },
    },
  });
}
