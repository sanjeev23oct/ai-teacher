import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { buildConversationPrompt, Subject, Language } from '../prompts/subjectPrompts';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

  // Build conversation history for AI
  const conversationParts = conversationHistory.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // Add current message
  conversationParts.push({
    role: 'user',
    parts: [{ text: message }],
  });

  // Call Gemini API
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I will help the student with their follow-up questions in a warm and supportive way.' }],
      },
      ...conversationParts.slice(0, -1), // All except the current message
    ],
  });

  const result = await chat.sendMessage(message);
  const response = result.response.text();

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

  // Build conversation history for AI
  const conversationParts = conversationHistory.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // Call Gemini API with streaming
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I will help the student with their follow-up questions in a warm and supportive way.' }],
      },
      ...conversationParts,
    ],
  });

  const result = await chat.sendMessageStream(message);

  let fullResponse = '';

  // Stream tokens
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullResponse += chunkText;
    yield chunkText;
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
