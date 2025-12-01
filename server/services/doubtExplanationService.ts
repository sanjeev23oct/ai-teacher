import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { buildPrompt, Subject, Language } from '../prompts/subjectPrompts';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ExplanationStep {
  number: number;
  title: string;
  explanation: string;
}

interface Annotation {
  type: 'step' | 'concept' | 'formula' | 'highlight';
  position: { x: number; y: number };
  label: string;
}

interface ExplanationResponse {
  doubtId: string;
  conversationId: string;
  questionImage?: string;
  questionText: string;
  subject: Subject;
  language: Language;
  whatQuestionAsks: string;
  steps: ExplanationStep[];
  finalAnswer: string;
  keyConcepts: string[];
  practiceTip: string;
  annotations: Annotation[];
  imageDimensions?: { width: number; height: number };
}

interface AIResponse {
  whatQuestionAsks: string;
  steps: ExplanationStep[];
  finalAnswer: string;
  keyConcepts: string[];
  practiceTip: string;
  annotations: Annotation[];
}

export async function explainQuestion(params: {
  questionImage?: Buffer;
  questionText?: string;
  subject: Subject;
  language: Language;
  userId?: string;
}): Promise<ExplanationResponse> {
  const { questionImage, questionText, subject, language, userId } = params;

  if (!questionImage && !questionText) {
    throw new Error('Either questionImage or questionText must be provided');
  }

  // Generate conversation ID
  const conversationId = uuidv4();

  // Build subject-specific prompt
  const systemPrompt = buildPrompt(subject, language);

  // Prepare the question for AI
  let userPrompt = '';
  let imageParts: any[] = [];
  let imageUrl: string | undefined;
  let imageDimensions: { width: number; height: number } | undefined;

  if (questionImage) {
    // Save image to disk
    const filename = `doubt-${Date.now()}-${uuidv4()}.jpg`;
    const uploadsDir = path.join(__dirname, '../uploads/doubts');
    await fs.mkdir(uploadsDir, { recursive: true });
    const imagePath = path.join(uploadsDir, filename);
    await fs.writeFile(imagePath, questionImage);
    imageUrl = `/uploads/doubts/${filename}`;

    // Get image dimensions (simplified - in production, use image library)
    imageDimensions = { width: 1200, height: 1600 }; // Default dimensions

    // Prepare image for Gemini
    const imageBase64 = questionImage.toString('base64');
    imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg',
        },
      },
    ];

    userPrompt = questionText
      ? `Question text: ${questionText}\n\nPlease analyze the image and provide a detailed explanation.`
      : 'Please analyze this question image and provide a detailed explanation.';
  } else {
    userPrompt = `Question: ${questionText}\n\nPlease provide a detailed explanation.`;
  }

  // Call Gemini API
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const parts = imageParts.length > 0 ? [...imageParts, { text: userPrompt }] : [{ text: userPrompt }];

  const result = await model.generateContent([
    { text: systemPrompt },
    ...parts,
  ]);

  const response = result.response;
  const text = response.text();

  // Parse AI response
  let aiResponse: AIResponse;
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    aiResponse = JSON.parse(jsonText);
  } catch (error) {
    console.error('Failed to parse AI response:', text);
    throw new Error('Failed to parse AI response as JSON');
  }

  // Save to database
  const doubt = await prisma.doubt.create({
    data: {
      userId,
      questionImage: imageUrl,
      questionText: questionText || 'See image',
      subject,
      language,
      explanation: JSON.stringify(aiResponse),
      annotations: JSON.stringify(aiResponse.annotations || []),
      imageDimensions: imageDimensions ? JSON.stringify(imageDimensions) : null,
      conversationId,
      messageCount: 0,
    },
  });

  // Return structured response
  return {
    doubtId: doubt.id,
    conversationId: doubt.conversationId,
    questionImage: imageUrl,
    questionText: questionText || 'See image',
    subject,
    language,
    whatQuestionAsks: aiResponse.whatQuestionAsks,
    steps: aiResponse.steps,
    finalAnswer: aiResponse.finalAnswer,
    keyConcepts: aiResponse.keyConcepts,
    practiceTip: aiResponse.practiceTip,
    annotations: aiResponse.annotations || [],
    imageDimensions,
  };
}

export async function getDetailedStep(params: {
  doubtId: string;
  stepNumber: number;
}): Promise<{ detailedExplanation: string }> {
  const { doubtId, stepNumber } = params;

  // Get doubt from database
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
  });

  if (!doubt) {
    throw new Error('Doubt not found');
  }

  const explanation = JSON.parse(doubt.explanation) as AIResponse;
  const step = explanation.steps.find((s) => s.number === stepNumber);

  if (!step) {
    throw new Error('Step not found');
  }

  // Build prompt for detailed explanation
  const systemPrompt = buildPrompt(doubt.subject as Subject, doubt.language as Language);
  const userPrompt = `The student wants more details about this step:

Step ${step.number}: ${step.title}
${step.explanation}

Please provide a more detailed explanation of this step. Break it down further, explain the reasoning, and give examples if helpful.`;

  // Call Gemini API
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const result = await model.generateContent([
    { text: systemPrompt },
    { text: userPrompt },
  ]);

  const response = result.response;
  const detailedExplanation = response.text();

  return { detailedExplanation };
}
