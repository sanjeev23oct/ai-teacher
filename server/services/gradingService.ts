import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import * as questionPaperService from './questionPaperService';
import { calculateImageHash } from '../lib/imageHash';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

interface GradingResult {
    subject: string;
    language: string;
    gradeLevel: string;
    totalScore: string;
    feedback: string;
    imageDimensions?: { width: number; height: number };
    annotations?: any[];
    detailedAnalysis: any[];
    matchingInfo?: any;
}

/**
 * Grade answer sheet against stored question paper
 */
export async function gradeWithStoredQuestions(
    answerSheetPath: string,
    questionPaperId: string
): Promise<GradingResult> {
    if (!genAI) {
        throw new Error('Gemini API not configured');
    }

    // Get stored question paper
    const questionPaper = await questionPaperService.getQuestionPaper(questionPaperId);
    if (!questionPaper) {
        throw new Error('Question paper not found');
    }

    // Read answer sheet
    const imageBuffer = fs.readFileSync(answerSheetPath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build prompt with stored questions
    const questionsText = questionPaper.questions.map(q => 
        `Question ${q.questionNumber}: ${q.questionText}`
    ).join('\n');

    const prompt = `You are a mathematics teacher grading an answer sheet.

QUESTION PAPER (already extracted):
${questionsText}

ANSWER SHEET IMAGE:
The student's handwritten answers are in the image. Match each answer to its question number.

Your task:
1. Extract answers from the answer sheet with their question numbers
2. Match each answer to the corresponding question from the question paper above
3. Grade each answer against its question
4. Identify unanswered questions
5. Provide annotations for the answer sheet

Return ONLY valid JSON:
{
  "subject": "${questionPaper.subject}",
  "language": "${questionPaper.language}",
  "gradeLevel": "${questionPaper.gradeLevel}",
  "totalScore": "calculated score like 13/15",
  "feedback": "overall assessment",
  "imageDimensions": { "width": 1200, "height": 1600 },
  "matchingInfo": {
    "mode": "dual",
    "totalQuestions": ${questionPaper.totalQuestions},
    "answeredQuestions": number,
    "unansweredQuestions": ["question numbers"],
    "unmatchedAnswers": [],
    "matchingConfidence": "high"
  },
  "annotations": [
    {
      "id": "ann-1",
      "type": "checkmark",
      "position": { "x": 10, "y": 25 },
      "color": "green",
      "questionId": "q1",
      "clickable": true
    }
  ],
  "detailedAnalysis": [
    {
      "id": "q1",
      "questionNumber": "1",
      "question": "question text from question paper",
      "studentAnswer": "extracted answer or null if not attempted",
      "correct": true or false,
      "score": "points earned",
      "remarks": "specific feedback",
      "topic": "topic if known",
      "concept": "concept if known",
      "position": { "x": 10, "y": 25 },
      "matched": true,
      "matchConfidence": 1.0,
      "answerLocation": "found"
    }
  ]
}`;

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType
        }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    // Parse JSON
    let jsonStr = text;
    if (text.includes('```json')) {
        jsonStr = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
        jsonStr = text.split('```')[1].split('```')[0];
    }

    const gradingResult = JSON.parse(jsonStr.trim());

    // Store grading in database
    await questionPaperService.storeGrading({
        questionPaperId: questionPaperId,
        answerSheetUrl: answerSheetPath,
        subject: gradingResult.subject,
        language: gradingResult.language,
        gradeLevel: gradingResult.gradeLevel,
        totalScore: gradingResult.totalScore,
        feedback: gradingResult.feedback,
        matchingMode: 'dual',
        totalQuestions: gradingResult.matchingInfo?.totalQuestions,
        answeredQuestions: gradingResult.matchingInfo?.answeredQuestions,
        answers: gradingResult.detailedAnalysis.map((a: any) => ({
            questionNumber: a.questionNumber,
            studentAnswer: a.studentAnswer,
            correct: a.correct,
            score: a.score,
            remarks: a.remarks,
            matched: a.matched,
            matchConfidence: a.matchConfidence,
            positionX: a.position?.x,
            positionY: a.position?.y
        }))
    });

    return gradingResult;
}

/**
 * Extract question paper and grade answer sheet in one go
 */
export async function gradeWithNewQuestionPaper(
    questionPaperPath: string,
    answerSheetPath: string
): Promise<{ questionPaperId: string; gradingResult: GradingResult }> {
    if (!genAI) {
        throw new Error('Gemini API not configured');
    }

    // Check if question paper already exists
    const imageHash = calculateImageHash(questionPaperPath);
    let questionPaper = await questionPaperService.findQuestionPaperByHash(imageHash);

    if (!questionPaper) {
        // Extract and store question paper
        const imageBuffer = fs.readFileSync(questionPaperPath);
        const base64Image = imageBuffer.toString('base64');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const extractPrompt = `Extract all questions from this question paper. Return ONLY valid JSON:
{
  "subject": "Mathematics",
  "language": "English",
  "gradeLevel": "Grade 9-10",
  "questions": [
    {
      "questionNumber": "1",
      "questionText": "full question text",
      "maxScore": 5,
      "topic": "Algebra",
      "concept": "Linear Equations",
      "position": { "x": 10, "y": 25 }
    }
  ]
}`;

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg'
            }
        };

        const result = await model.generateContent([extractPrompt, imagePart]);
        const text = result.response.text();

        let jsonStr = text;
        if (text.includes('```json')) {
            jsonStr = text.split('```json')[1].split('```')[0];
        } else if (text.includes('```')) {
            jsonStr = text.split('```')[1].split('```')[0];
        }

        const extracted = JSON.parse(jsonStr.trim());

        // Store question paper
        questionPaper = await questionPaperService.storeQuestionPaper(questionPaperPath, {
            subject: extracted.subject,
            gradeLevel: extracted.gradeLevel,
            language: extracted.language,
            imageUrl: questionPaperPath,
            questions: extracted.questions.map((q: any) => ({
                questionNumber: q.questionNumber,
                questionText: q.questionText,
                maxScore: q.maxScore,
                topic: q.topic,
                concept: q.concept,
                positionX: q.position?.x,
                positionY: q.position?.y
            }))
        });
    }

    // Now grade with stored question paper
    const gradingResult = await gradeWithStoredQuestions(answerSheetPath, questionPaper.id);

    return {
        questionPaperId: questionPaper.id,
        gradingResult
    };
}
