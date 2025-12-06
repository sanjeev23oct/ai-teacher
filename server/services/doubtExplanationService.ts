import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { buildPrompt, Subject, Language } from '../prompts/subjectPrompts';
import { aiService } from './aiService';

const prisma = new PrismaClient();

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
  questionNumber?: number;
  worksheetId?: string;
}): Promise<ExplanationResponse> {
  const { questionImage, questionText, subject, language, userId, questionNumber, worksheetId } = params;

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

    // Build prompt based on whether this is a worksheet question or standalone
    if (questionNumber && worksheetId) {
      // This is a worksheet with multiple questions
      console.log(`[Prompt] Building prompt for worksheet ${worksheetId}, question ${questionNumber}`);
      userPrompt = `This image contains multiple questions. Please analyze ONLY question number ${questionNumber}.

IMPORTANT INSTRUCTIONS:
- Focus EXCLUSIVELY on question ${questionNumber} - ignore all other questions in the image
- Look for question markers like "${questionNumber}.", "Q${questionNumber}", "${questionNumber})", or similar
- Provide a detailed step-by-step explanation for question ${questionNumber} ONLY
- Use proper LaTeX notation for mathematical symbols (e.g., $\\sin \\theta$, $\\cos^2 x$, $\\frac{a}{b}$)
- Ensure all mathematical expressions are properly formatted with LaTeX

Please provide your response in the required JSON format.`;
    } else if (questionText) {
      userPrompt = `Question text: ${questionText}\n\nPlease analyze the image and provide a detailed explanation.`;
    } else {
      userPrompt = `Please analyze this image and identify the FIRST question you see. Provide a detailed step-by-step explanation for that question only.

IMPORTANT: 
- Focus on solving ONE question at a time
- Use proper LaTeX notation for mathematical symbols (e.g., $\\sin \\theta$, $\\cos^2 x$, $\\frac{a}{b}$)
- Ensure all mathematical expressions are properly formatted with LaTeX

Please provide your response in the required JSON format.`;
    }
  } else {
    userPrompt = `Question: ${questionText}\n\nPlease provide a detailed explanation.`;
  }

  // Call AI service
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  
  const result = await aiService.generateContent({
    prompt: fullPrompt,
    imageBase64: questionImage ? questionImage.toString('base64') : undefined,
    imageMimeType: questionImage ? 'image/jpeg' : undefined,
  });

  const text = result.text;

  // Parse AI response
  let aiResponse: AIResponse;
  let parseError = false;
  
  try {
    // Extract JSON from response (handle markdown code blocks and extra text)
    let jsonText = text;
    
    // Try to extract from markdown code block first
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    } else if (text.includes('```json')) {
      // Handle incomplete code block (response was truncated)
      const startIndex = text.indexOf('```json') + 7;
      jsonText = text.substring(startIndex);
      
      // Remove trailing ``` if present
      if (jsonText.includes('```')) {
        jsonText = jsonText.substring(0, jsonText.indexOf('```'));
      }
      
      // Try to fix truncated JSON by adding missing closing brackets
      const openBraces = (jsonText.match(/\{/g) || []).length;
      const closeBraces = (jsonText.match(/\}/g) || []).length;
      const openBrackets = (jsonText.match(/\[/g) || []).length;
      const closeBrackets = (jsonText.match(/\]/g) || []).length;
      
      // Add missing closing brackets/braces
      for (let i = 0; i < (openBrackets - closeBrackets); i++) {
        jsonText += '\n]';
      }
      for (let i = 0; i < (openBraces - closeBraces); i++) {
        jsonText += '\n}';
      }
    } else {
      // Try to find JSON object in the text
      const jsonStart = text.indexOf('{');
      if (jsonStart !== -1) {
        jsonText = text.substring(jsonStart);
        
        // Try to fix truncated JSON
        const openBraces = (jsonText.match(/\{/g) || []).length;
        const closeBraces = (jsonText.match(/\}/g) || []).length;
        const openBrackets = (jsonText.match(/\[/g) || []).length;
        const closeBrackets = (jsonText.match(/\]/g) || []).length;
        
        // Add missing closing brackets/braces
        for (let i = 0; i < (openBrackets - closeBrackets); i++) {
          jsonText += '\n]';
        }
        for (let i = 0; i < (openBraces - closeBraces); i++) {
          jsonText += '\n}';
        }
      }
    }
    
    aiResponse = JSON.parse(jsonText.trim());
  } catch (error) {
    console.error('Failed to parse AI response:', text.substring(0, 500));
    console.error('Full response length:', text.length);
    parseError = true;
    
    // Create fallback response so we can still save the doubt
    aiResponse = {
      whatQuestionAsks: questionText || 'Question from image',
      steps: [
        {
          number: 1,
          title: 'AI Response',
          explanation: text.substring(0, 1000) + (text.length > 1000 ? '...' : '')
        }
      ],
      finalAnswer: 'Please try asking this question again for a complete explanation.',
      keyConcepts: ['The AI response was incomplete'],
      practiceTip: 'Try uploading a clearer image or asking the question again.',
      annotations: []
    };
  }

  // Only save to database if there's an image (not for text-only questions)
  let doubtId: string;
  
  if (questionImage && imageUrl) {
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
    doubtId = doubt.id;
  } else {
    // For text-only questions, generate a temporary ID (not saved to DB)
    doubtId = `temp-${uuidv4()}`;
  }

  // Return structured response
  return {
    doubtId,
    conversationId,
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

  // Call AI service
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const result = await aiService.generateContent({ prompt: fullPrompt });
  const detailedExplanation = result.text;

  return { detailedExplanation };
}
