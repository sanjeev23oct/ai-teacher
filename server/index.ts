import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as questionPaperService from './services/questionPaperService';
import * as gradingService from './services/gradingService';
import * as authService from './services/authService';
import { calculateImageHash } from './lib/imageHash';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';
import prisma from './lib/prisma';

dotenv.config();

// Types for enhanced grading response
interface Annotation {
    id: string;
    type: 'checkmark' | 'cross' | 'score' | 'comment';
    position: { x: number; y: number };
    color: 'green' | 'red' | 'yellow';
    text?: string;
    questionId: string;
    clickable: boolean;
}

interface QuestionAnalysis {
    id: string;
    question: string;
    studentAnswer: string;
    correct: boolean;
    score: string;
    remarks: string;
    topic?: string;
    concept?: string;
    position?: { x: number; y: number };
}

interface GradingResponse {
    subject: string;
    language: string;
    gradeLevel: string;
    totalScore: string;
    feedback: string;
    imageDimensions?: { width: number; height: number };
    annotations?: Annotation[];
    detailedAnalysis: QuestionAnalysis[];
}

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
}));
app.use(cookieParser());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Serve static files from React build (in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });
const uploadMultiple = multer({ dest: 'uploads/' }).fields([
    { name: 'questionPaper', maxCount: 1 },
    { name: 'answerSheet', maxCount: 1 }
]);

// Ollama Setup (local server)
const ollama = new OpenAI({
    apiKey: 'ollama', // Ollama doesn't require a real API key
    baseURL: process.env.OLLAMA_URL || 'http://localhost:11434/v1'
});

// Gemini Setup (optional, for better vision results)
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Helper function to generate default annotations if AI doesn't provide them
function generateDefaultAnnotations(detailedAnalysis: QuestionAnalysis[]): Annotation[] {
    const annotations: Annotation[] = [];
    const questionsPerPage = detailedAnalysis.length;
    const spacing = 100 / (questionsPerPage + 1);

    detailedAnalysis.forEach((question, index) => {
        const yPosition = question.position?.y || (spacing * (index + 1));
        const xPosition = question.position?.x || 10;

        // Add checkmark or cross
        annotations.push({
            id: `ann-${question.id}-mark`,
            type: question.correct ? 'checkmark' : 'cross',
            position: { x: xPosition, y: yPosition },
            color: question.correct ? 'green' : 'red',
            questionId: question.id,
            clickable: true
        });

        // Add score
        annotations.push({
            id: `ann-${question.id}-score`,
            type: 'score',
            position: { x: xPosition - 5, y: yPosition },
            text: question.score,
            color: question.correct ? 'green' : 'red',
            questionId: question.id,
            clickable: true
        });

        // Add comment for incorrect answers
        if (!question.correct && question.remarks) {
            annotations.push({
                id: `ann-${question.id}-comment`,
                type: 'comment',
                position: { x: xPosition + 30, y: yPosition + 2 },
                text: question.remarks.substring(0, 50) + (question.remarks.length > 50 ? '...' : ''),
                color: 'red',
                questionId: question.id,
                clickable: true
            });
        }
    });

    return annotations;
}

// ============================================
// AUTH ENDPOINTS
// ============================================

// Signup
app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
        const { name, email, password, grade, school } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const result = await authService.signup({
            name,
            email,
            password,
            grade,
            school
        });

        // Set cookie with token (standard pattern for browser auth)
        res.cookie('auth_token', result.token, {
            httpOnly: false, // Allow JavaScript access
            secure: false, // Allow over HTTP for localhost
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        res.json(result);
    } catch (error: any) {
        console.error('Signup error:', error);
        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await authService.login({ email, password });
        
        // Set cookie with token (standard pattern for browser auth)
        res.cookie('auth_token', result.token, {
            httpOnly: false, // Allow JavaScript access
            secure: false, // Allow over HTTP for localhost
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });
        
        res.json(result);
    } catch (error: any) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid')) {
            return res.status(401).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to log in' });
    }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        res.json({ user: req.user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// Logout (client-side token removal, but we can track it)
app.post('/api/auth/logout', authMiddleware, async (req: Request, res: Response) => {
    try {
        // In a more advanced setup, we'd invalidate the token here
        // For now, client just removes the token
        res.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Failed to log out' });
    }
});

// ============================================
// EXAM HISTORY ENDPOINTS
// ============================================

// Get exam history for logged-in user
app.get('/api/exams/history', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const gradings = await prisma.grading.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                questionPaper: {
                    select: {
                        id: true,
                        title: true,
                        subject: true
                    }
                }
            }
        });

        const total = await prisma.grading.count({
            where: { userId }
        });

        const exams = gradings.map(g => ({
            id: g.id,
            date: g.createdAt,
            subject: g.subject,
            language: g.language,
            gradeLevel: g.gradeLevel,
            totalScore: g.totalScore,
            questionPaperId: g.questionPaperId,
            questionPaperTitle: g.questionPaper?.title,
            mode: g.matchingMode || 'single'
        }));

        res.json({
            exams,
            total,
            hasMore: offset + limit < total
        });
    } catch (error) {
        console.error('Error fetching exam history:', error);
        res.status(500).json({ error: 'Failed to fetch exam history' });
    }
});

// Get user stats (must be before /:id route)
app.get('/api/exams/stats', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        const gradings = await prisma.grading.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100 // Last 100 exams for stats
        });

        const totalExams = gradings.length;

        // Calculate average score (parse "8/10" format)
        const scores = gradings.map(g => {
            const match = g.totalScore.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
            if (match) {
                const earned = parseFloat(match[1]);
                const total = parseFloat(match[2]);
                return total > 0 ? (earned / total) * 100 : 0;
            }
            return 0;
        });

        const averageScore = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;

        // Group by subject
        const bySubject: Record<string, { count: number; avgScore: number; scores: number[] }> = {};
        gradings.forEach(g => {
            if (!bySubject[g.subject]) {
                bySubject[g.subject] = { count: 0, avgScore: 0, scores: [] };
            }
            bySubject[g.subject].count++;
            
            const match = g.totalScore.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
            if (match) {
                const earned = parseFloat(match[1]);
                const total = parseFloat(match[2]);
                const percentage = total > 0 ? (earned / total) * 100 : 0;
                bySubject[g.subject].scores.push(percentage);
            }
        });

        // Calculate average for each subject
        Object.keys(bySubject).forEach(subject => {
            const scores = bySubject[subject].scores;
            bySubject[subject].avgScore = scores.length > 0
                ? scores.reduce((a, b) => a + b, 0) / scores.length
                : 0;
        });

        // Recent exams
        const recentExams = gradings.slice(0, 5).map(g => ({
            id: g.id,
            date: g.createdAt,
            subject: g.subject,
            totalScore: g.totalScore
        }));

        res.json({
            totalExams,
            averageScore: Math.round(averageScore * 10) / 10,
            bySubject: Object.fromEntries(
                Object.entries(bySubject).map(([subject, data]) => [
                    subject,
                    {
                        count: data.count,
                        avgScore: Math.round(data.avgScore * 10) / 10
                    }
                ])
            ),
            recentExams
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Delete exam
app.delete('/api/exams/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const examId = req.params.id;

        // Check if exam belongs to user
        const grading = await prisma.grading.findFirst({
            where: {
                id: examId,
                userId
            }
        });

        if (!grading) {
            return res.status(404).json({ error: 'Exam not found' });
        }

        // Delete the exam (cascade will delete answers)
        await prisma.grading.delete({
            where: { id: examId }
        });

        res.json({ success: true, message: 'Exam deleted successfully' });
    } catch (error) {
        console.error('Error deleting exam:', error);
        res.status(500).json({ error: 'Failed to delete exam' });
    }
});

// Get specific exam details
app.get('/api/exams/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const examId = req.params.id;

        const grading = await prisma.grading.findFirst({
            where: {
                id: examId,
                userId
            },
            include: {
                answers: true,
                questionPaper: {
                    include: {
                        questions: true
                    }
                }
            }
        });

        if (!grading) {
            return res.status(404).json({ error: 'Exam not found' });
        }

        res.json(grading);
    } catch (error) {
        console.error('Error fetching exam details:', error);
        res.status(500).json({ error: 'Failed to fetch exam details' });
    }
});

// ============================================
// QUESTION PAPER ENDPOINTS
// ============================================

// Question Paper Extraction Endpoint
app.post('/api/question-papers/extract', upload.single('questionPaper'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype;

        // Check if question paper already exists
        const imageHash = calculateImageHash(req.file.path);
        const existing = await questionPaperService.findQuestionPaperByHash(imageHash);

        if (existing) {
            fs.unlinkSync(req.file.path);
            return res.json({
                id: existing.id,
                title: existing.title,
                subject: existing.subject,
                gradeLevel: existing.gradeLevel,
                language: existing.language,
                totalQuestions: existing.totalQuestions,
                questions: existing.questions,
                cached: true,
                message: 'Question paper already exists in database'
            });
        }

        // Extract questions using Gemini
        const useGemini = genAI && process.env.USE_GEMINI !== 'false';
        if (!useGemini) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Gemini API required for question extraction' });
        }

        const model = genAI!.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are analyzing a question paper. Extract all questions with their details.

IMPORTANT: Return ONLY valid JSON, no other text.

{
  "subject": "Mathematics/Physics/Chemistry/etc",
  "language": "English/Hindi/Bengali/etc",
  "gradeLevel": "Grade 9-10/High School/etc",
  "questions": [
    {
      "questionNumber": "1",
      "questionText": "Full question text",
      "maxScore": 5,
      "topic": "Algebra/Geometry/etc",
      "concept": "Linear Equations/etc",
      "position": { "x": 10, "y": 25 }
    }
  ]
}

Extract ALL questions you can see. Include question numbers, full text, and estimated positions (x, y as percentages 0-100).`;

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

        const extracted = JSON.parse(jsonStr.trim());

        // Move uploaded file to permanent storage
        const permanentPath = path.join('uploads', 'question-papers', `${imageHash}.jpg`);
        const permanentDir = path.dirname(permanentPath);
        if (!fs.existsSync(permanentDir)) {
            fs.mkdirSync(permanentDir, { recursive: true });
        }
        fs.renameSync(req.file.path, permanentPath);

        // Store in database
        const questionPaper = await questionPaperService.storeQuestionPaper(permanentPath, {
            title: req.body.title,
            subject: extracted.subject,
            gradeLevel: extracted.gradeLevel,
            language: extracted.language,
            imageUrl: permanentPath,
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

        res.json({
            id: questionPaper.id,
            title: questionPaper.title,
            subject: questionPaper.subject,
            gradeLevel: questionPaper.gradeLevel,
            language: questionPaper.language,
            totalQuestions: questionPaper.totalQuestions,
            questions: questionPaper.questions,
            cached: false,
            message: 'Question paper extracted and stored'
        });

    } catch (error) {
        console.error('Error extracting question paper:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to extract question paper' });
    }
});

// List Question Papers Endpoint
app.get('/api/question-papers', async (req: Request, res: Response) => {
    try {
        const questionPapers = await questionPaperService.listQuestionPapers(20);
        res.json({ questionPapers });
    } catch (error) {
        console.error('Error listing question papers:', error);
        res.status(500).json({ error: 'Failed to list question papers' });
    }
});

// Get Question Paper Endpoint
app.get('/api/question-papers/:id', async (req: Request, res: Response) => {
    try {
        const questionPaper = await questionPaperService.getQuestionPaper(req.params.id);
        if (!questionPaper) {
            return res.status(404).json({ error: 'Question paper not found' });
        }
        res.json(questionPaper);
    } catch (error) {
        console.error('Error getting question paper:', error);
        res.status(500).json({ error: 'Failed to get question paper' });
    }
});

// Multer middleware that accepts any field
const uploadAny = multer({ dest: 'uploads/' }).any();

// Enhanced Grading Endpoint (supports single and dual mode)
app.post('/api/grade', optionalAuthMiddleware, uploadAny, async (req: Request, res: Response) => {
    console.log('=== GRADING REQUEST RECEIVED ===');
    console.log('User:', req.user?.email || 'Guest');
    console.log('Files:', (req.files as Express.Multer.File[])?.length || 0);
    console.log('Mode:', req.body.mode || 'single');
    
    try {
        const files = (req.files as Express.Multer.File[]) || [];
        const mode = req.body.mode || 'single';
        const questionPaperId = req.body.questionPaperId;

        let questionPaperFile: Express.Multer.File | undefined;
        let answerSheetFile: Express.Multer.File | undefined;
        let examFile: Express.Multer.File | undefined;

        // Parse files by fieldname
        for (const file of files) {
            if (file.fieldname === 'questionPaper') {
                questionPaperFile = file;
            } else if (file.fieldname === 'answerSheet') {
                answerSheetFile = file;
            } else if (file.fieldname === 'exam') {
                examFile = file;
            }
        }

        // Determine which files we have
        if (mode === 'dual') {
            if (!answerSheetFile) {
                return res.status(400).json({ error: 'Answer sheet is required for dual mode' });
            }
            
            if (!questionPaperId && !questionPaperFile) {
                return res.status(400).json({ error: 'Question paper or questionPaperId is required for dual mode' });
            }
        } else {
            // Single mode
            if (!examFile) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
        }

        // Handle dual mode with stored or new question paper
        if (mode === 'dual') {
            return await handleDualModeGrading(
                req,
                res,
                questionPaperId,
                questionPaperFile,
                answerSheetFile!
            );
        }

        // Handle single mode (existing behavior)
        return await handleSingleModeGrading(req, res, examFile!);

    } catch (error) {
        console.error('Error in grading:', error);
        res.status(500).json({ error: 'Failed to process grading request' });
    }
});

// Single mode grading (existing behavior)
async function handleSingleModeGrading(
    req: Request,
    res: Response,
    examFile: Express.Multer.File
) {
    try {
        // Read the image file and convert to base64
        const imageBuffer = fs.readFileSync(examFile.path);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = examFile.mimetype;

        // Use Gemini if available, otherwise fall back to Ollama
        const useGemini = genAI && process.env.USE_GEMINI !== 'false';

        if (useGemini) {
            // Use Gemini Vision for better OCR and structured output
            const model = genAI!.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `You are a warm, caring mathematics teacher who genuinely wants your students to succeed. You're reviewing your student's work with encouragement and support.

TONE GUIDELINES:
- Be conversational and friendly, like talking to a friend
- Use "you" and "your" to make it personal
- Show genuine excitement for successes
- Be gentle and supportive about mistakes
- Use phrases like "Great job!", "You're on the right track!", "Let's work on this together"
- Avoid robotic language like "demonstrates", "adequate", "satisfactory"

IMPORTANT: You must also identify the approximate position of each question in the image.

Carefully examine the mathematical problems, solutions, and work shown. For each question:
1. Identify its approximate position in the image (as percentage from top-left corner)
2. Evaluate correctness
3. Provide warm, specific feedback
4. Identify the topic/concept

Output ONLY this JSON structure (no other text):
{
  "subject": "Mathematics",
  "language": "actual language (Bengali/Hindi/English/etc)",
  "gradeLevel": "estimate based on difficulty",
  "totalScore": "calculated score like 8/10",
  "feedback": "Warm, encouraging feedback in BULLET POINTS. Format:\n\n🎯 Overall: [Brief warm opening with score]\n\n✨ What You Nailed:\n• [Specific strength 1]\n• [Specific strength 2]\n\n💪 Let's Improve Together:\n• [Area 1 with gentle guidance]\n• [Area 2 with helpful tip]\n\n🚀 Keep Going: [Motivational closing]\n\nUse emojis naturally and keep each bullet concise and specific.",
  "imageDimensions": {
    "width": 1200,
    "height": 1600
  },
  "annotations": [
    {
      "id": "ann-1",
      "type": "checkmark",
      "position": { "x": 10, "y": 25 },
      "color": "green",
      "questionId": "q1",
      "clickable": true
    },
    {
      "id": "ann-2",
      "type": "score",
      "position": { "x": 5, "y": 25 },
      "text": "5/5",
      "color": "green",
      "questionId": "q1",
      "clickable": true
    }
  ],
  "detailedAnalysis": [
    {
      "id": "q1",
      "question": "question number and problem",
      "studentAnswer": "student's work/solution",
      "correct": true or false,
      "score": "points earned",
      "remarks": "Warm, specific feedback. If correct: celebrate specifically (e.g., 'Brilliant! Your method here was spot-on! ✨'). If incorrect: be encouraging (e.g., 'You're so close! Here's a tip: [specific guidance]. You've got this! 💪'). Always be supportive and constructive.",
      "topic": "Geometry/Algebra/etc",
      "concept": "specific concept like 'Basic Proportionality Theorem'",
      "position": { "x": 10, "y": 25 }
    }
  ]
}

Position guidelines:
- x and y are percentages (0-100) from top-left corner
- Estimate where each question starts in the image
- Place checkmarks/crosses at the left margin of each question
- Place scores slightly to the left of checkmarks
- For comments, position them near the relevant part of the answer

Annotation types:
- "checkmark" for correct answers (green)
- "cross" for incorrect answers (red)
- "score" for point values (green if full marks, red if partial/zero)
- "comment" for specific feedback on errors (red, with text field)

Generate annotations for EVERY question you identify.`;

            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            };

            const result = await model.generateContent([prompt, imagePart]);
            const text = result.response.text();

            // Parse JSON from response
            let jsonStr = text;
            if (text.includes('```json')) {
                jsonStr = text.split('```json')[1].split('```')[0];
            } else if (text.includes('```')) {
                jsonStr = text.split('```')[1].split('```')[0];
            }

            try {
                const jsonResponse: GradingResponse = JSON.parse(jsonStr.trim());
                
                // Ensure annotations exist, generate defaults if not provided
                if (!jsonResponse.annotations || jsonResponse.annotations.length === 0) {
                    console.log('No annotations provided by AI, generating defaults');
                    jsonResponse.annotations = generateDefaultAnnotations(jsonResponse.detailedAnalysis);
                }

                // Ensure imageDimensions exist (use defaults if not provided)
                if (!jsonResponse.imageDimensions) {
                    jsonResponse.imageDimensions = { width: 1200, height: 1600 };
                }

                // Ensure each question has an ID
                jsonResponse.detailedAnalysis = jsonResponse.detailedAnalysis.map((q, index) => ({
                    ...q,
                    id: q.id || `q${index + 1}`
                }));

                // Save to database if user is logged in
                const userId = req.user?.id;
                if (userId) {
                    // Move file to permanent storage
                    const permanentPath = path.join('uploads', 'exams', `${Date.now()}-${examFile.filename}`);
                    const permanentDir = path.dirname(permanentPath);
                    if (!fs.existsSync(permanentDir)) {
                        fs.mkdirSync(permanentDir, { recursive: true });
                    }
                    fs.renameSync(examFile.path, permanentPath);

                    await questionPaperService.storeGrading({
                        userId: userId,
                        answerSheetUrl: permanentPath,
                        subject: jsonResponse.subject,
                        language: jsonResponse.language,
                        gradeLevel: jsonResponse.gradeLevel || 'Unknown',
                        totalScore: jsonResponse.totalScore,
                        feedback: jsonResponse.feedback,
                        matchingMode: 'single',
                        annotations: jsonResponse.annotations,
                        imageDimensions: jsonResponse.imageDimensions,
                        answers: jsonResponse.detailedAnalysis.map((a: any) => ({
                            questionNumber: a.id || 'unknown',
                            studentAnswer: a.studentAnswer,
                            correct: a.correct,
                            score: a.score,
                            remarks: a.remarks,
                            positionX: a.position?.x,
                            positionY: a.position?.y
                        }))
                    });
                } else {
                    // Clean up uploaded file if not logged in
                    fs.unlinkSync(examFile.path);
                }

                res.json(jsonResponse);
            } catch (e) {
                console.error("Failed to parse JSON:", text);
                res.json({
                    rawResponse: text,
                    error: "Failed to parse structured response",
                    subject: "Unknown",
                    language: "Unknown",
                    totalScore: "?",
                    feedback: text,
                    imageDimensions: { width: 1200, height: 1600 },
                    annotations: [],
                    detailedAnalysis: []
                });
            }
            return;
        }

        const prompt = `You are a mathematics teacher grading an exam. Analyze the image carefully and respond with ONLY valid JSON.

Look at the mathematical problems, solutions, and work shown in this exam paper.
Identify the language, transcribe what you see, evaluate the correctness, and provide scores.

DO NOT write explanatory text. START with { and END with }

Required JSON format:
{
  "subject": "Mathematics",
  "language": "the actual language you see (Bengali/Hindi/English/etc)",
  "gradeLevel": "your estimate based on problem difficulty",
  "totalScore": "your calculated score like 8/10",
  "feedback": "your actual assessment of this student's mathematical work and understanding",
  "detailedAnalysis": [
    {
      "question": "actual question number and problem you see",
      "studentAnswer": "actual work/solution the student wrote",
      "correct": your evaluation true/false,
      "score": "points for this problem",
      "remarks": "your specific feedback on this solution"
    }
  ]
}

Analyze the image now and output ONLY the JSON.`;

        // Ollama uses the llava model for vision
        const response = await ollama.chat.completions.create({
            model: "llava:13b",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 2000,
            temperature: 0.7
        });

        const text = response.choices[0].message.content || '';

        // Clean up uploaded file
        fs.unlinkSync(examFile.path);

        // Parse JSON from response
        let jsonStr = text;
        if (text.includes('```json')) {
            jsonStr = text.split('```json')[1].split('```')[0];
        } else if (text.includes('```')) {
            jsonStr = text.split('```')[1].split('```')[0];
        }

        try {
            const jsonResponse = JSON.parse(jsonStr.trim());
            res.json(jsonResponse);
        } catch (e) {
            console.error("Failed to parse JSON:", text);
            res.json({
                rawResponse: text,
                error: "Failed to parse structured response",
                subject: "Unknown",
                language: "Unknown",
                totalScore: "?",
                feedback: text,
                detailedAnalysis: []
            });
        }

    } catch (error: any) {
        console.error('Error processing exam:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to process exam', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

// Multi-Page Grading Endpoint
app.post('/api/grade/multi-page', optionalAuthMiddleware, upload.array('answerSheetPages', 10), async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        const { questionPaperId, mode } = req.body;
        const userId = req.user?.id;

        console.log('=== MULTI-PAGE GRADING REQUEST ===');
        console.log('User:', req.user?.email || 'Guest');
        console.log('Pages:', files?.length || 0);
        console.log('Question Paper ID:', questionPaperId);
        console.log('Mode:', mode);

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        if (files.length > 10) {
            return res.status(400).json({ error: 'Maximum 10 pages allowed' });
        }

        if (!questionPaperId) {
            return res.status(400).json({ error: 'Question paper ID is required for multi-page grading' });
        }

        const { gradeMultiplePages } = await import('./services/multiPageGradingService');

        const filePaths = files.map(f => f.path);

        // Grade all pages
        const result = await gradeMultiplePages(questionPaperId, filePaths, userId);

        console.log('✅ Multi-page grading complete:', result.totalScore);

        res.json(result);
    } catch (error: any) {
        console.error('❌ Multi-page grading error:', error);
        res.status(500).json({ 
            error: 'Failed to grade multi-page exam',
            details: error.message
        });
    }
});

// Voice Chat Endpoint (context-aware)
app.post('/api/voice/chat', async (req: Request, res: Response) => {
    try {
        const { context, message, conversationHistory } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const useGemini = genAI && process.env.USE_GEMINI !== 'false';

        // Import AI service
        const { aiService } = await import('./services/aiService');

        // Determine subject-specific tone
        const subject = context.topic || 'Mathematics';
        const subjectLower = subject.toLowerCase();
        
        let subjectTone = '';
        if (subjectLower.includes('math') || subjectLower.includes('algebra') || 
            subjectLower.includes('geometry') || subjectLower.includes('trigonometry')) {
            subjectTone = 'Mathematics teacher who explains concepts step-by-step with clear logic';
        } else if (subjectLower.includes('science') || subjectLower.includes('physics') || 
                   subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
            subjectTone = 'Science teacher who connects concepts to real-world examples';
        } else if (subjectLower.includes('english') || subjectLower.includes('language')) {
            subjectTone = 'Language teacher who encourages expression and creativity';
        } else {
            subjectTone = 'teacher who makes learning engaging and relatable';
        }

        // Build context-aware prompt with Hinglish support
        const systemPrompt = `You are a warm, friendly Indian ${subjectTone}. You speak naturally in Hinglish (mix of Hindi and English). A student is asking about a specific question from their exam.

Question: ${context.question}
Student's Answer: ${context.studentAnswer}
Your Feedback: ${context.feedback}
Topic: ${subject}
${context.concept ? `Concept: ${context.concept}` : ''}

IMPORTANT: Respond in natural Hinglish - mix Hindi and English the way Indian teachers actually speak. Be conversational, warm, and encouraging. Keep responses concise (2-3 sentences).

Examples of natural Hinglish:
- "Dekho, tumhara approach bilkul sahi hai!"
- "Arre, yahan pe ek chhoti si mistake hai. Let me explain..."
- "Bahut accha! You understood the concept perfectly!"
- "Chalo, isko step by step samajhte hain"
- "Perfect! Ab next step mein kya karna hai?"

For math terms, use natural pronunciation:
- "cos theta" not "cosθ"
- "sine squared theta" not "sin²θ"
- "square root" not "√"

Provide clear, concise explanations in Hinglish. Reference the specific mistake they made. Be encouraging and supportive like a caring teacher.

If they ask for practice, acknowledge that you can help generate similar problems.`;

        // Build conversation history
        const conversationText = conversationHistory && conversationHistory.length > 0
            ? '\n\nPrevious conversation:\n' + conversationHistory.map((msg: any) => 
                `${msg.role === 'user' ? 'Student' : 'Teacher'}: ${msg.content}`
              ).join('\n')
            : '';

        const fullPrompt = `${systemPrompt}${conversationText}\n\nStudent: ${message}\n\nTeacher:`;

        // Use AI service (respects .env configuration)
        const result = await aiService.generateContent({
            prompt: fullPrompt,
        });

        res.json({ text: result.text });

    } catch (error) {
        console.error('Error in voice chat:', error);
        res.status(500).json({ error: 'Failed to process chat request.' });
    }
});

// Text-to-Speech Streaming Endpoint (ElevenLabs) - Faster response
app.post('/api/tts/stream', async (req: Request, res: Response) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const { textToSpeechStream } = await import('./services/ttsService');
        const audioStream = await textToSpeechStream(text);

        if (!audioStream) {
            return res.status(503).json({ 
                error: 'TTS service not available',
                message: 'ElevenLabs API key not configured.'
            });
        }

        res.set({
            'Content-Type': 'audio/mpeg',
            'Transfer-Encoding': 'chunked'
        });

        // Stream audio chunks as they arrive
        for await (const chunk of audioStream) {
            res.write(chunk);
        }
        
        res.end();
    } catch (error) {
        console.error('Error in streaming TTS:', error);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
});

// Text-to-Speech Endpoint (ElevenLabs) - Full audio
app.post('/api/tts', async (req: Request, res: Response) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const { textToSpeech } = await import('./services/ttsService');
        const audioBuffer = await textToSpeech(text);

        if (!audioBuffer) {
            return res.status(503).json({ 
                error: 'TTS service not available',
                message: 'ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to environment variables.'
            });
        }

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length
        });
        res.send(audioBuffer);
    } catch (error) {
        console.error('Error in TTS:', error);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
});

// Chat Endpoint (general, for voice tutor page)
app.post('/api/chat', async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Import AI service
        const { aiService } = await import('./services/aiService');

        // Convert history to standard format
        const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        
        if (history && Array.isArray(history)) {
            history.forEach((msg: any) => {
                if (msg.role === 'user') {
                    conversationHistory.push({
                        role: 'user',
                        content: msg.parts[0].text
                    });
                } else if (msg.role === 'model') {
                    conversationHistory.push({
                        role: 'assistant',
                        content: msg.parts[0].text
                    });
                }
            });
        }

        // Build prompt with system message
        const systemPrompt = "You are a helpful and knowledgeable AI teacher. You help students with their doubts and explain concepts clearly. Keep your answers concise and conversational.";
        const fullPrompt = conversationHistory.length > 0 
            ? `${systemPrompt}\n\nUser: ${message}`
            : `${systemPrompt}\n\nUser: ${message}`;

        // Use AI service (respects .env configuration)
        const result = await aiService.generateContent({
            prompt: fullPrompt,
        });

        res.json({ text: result.text });

    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ error: 'Failed to process chat request' });
    }
});

// CBSE Class 10 Voice Tutor with Image Support
app.post('/api/voice-tutor/chat-with-image', upload.single('image'), async (req: Request, res: Response) => {
    try {
        const { message, class: classNum, subject, history } = req.body;
        const imageFile = req.file;

        if (!classNum || !subject) {
            return res.status(400).json({ error: 'Class and subject are required' });
        }

        if (!imageFile) {
            return res.status(400).json({ error: 'Image is required' });
        }

        // Import CBSE prompts and AI service
        const { getCBSEPrompt, isSupportedClass, getUnsupportedClassMessage } = await import('./prompts/cbsePrompts');
        const { aiService } = await import('./services/aiService');

        // Check if class is supported
        if (!isSupportedClass(classNum)) {
            const boundaryMessage = getUnsupportedClassMessage(classNum, subject);
            return res.json({ text: boundaryMessage });
        }

        // Get class and subject-specific CBSE prompt
        const systemPrompt = getCBSEPrompt(classNum as any, subject as any);

        // Read image file
        const imageBuffer = fs.readFileSync(imageFile.path);
        const imageBase64 = imageBuffer.toString('base64');

        // Convert history to standard format
        const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        
        if (history) {
            const parsedHistory = typeof history === 'string' ? JSON.parse(history) : history;
            if (Array.isArray(parsedHistory)) {
                parsedHistory.forEach((msg: any) => {
                    if (msg.role === 'user') {
                        conversationHistory.push({
                            role: 'user',
                            content: msg.parts[0].text
                        });
                    } else if (msg.role === 'model') {
                        conversationHistory.push({
                            role: 'assistant',
                            content: msg.parts[0].text
                        });
                    }
                });
            }
        }

        // Build full prompt with conversation history
        let fullPrompt = systemPrompt + '\n\n';
        
        if (conversationHistory.length > 0) {
            fullPrompt += 'Previous conversation:\n';
            conversationHistory.forEach(msg => {
                fullPrompt += `${msg.role === 'user' ? 'Student' : 'Teacher'}: ${msg.content}\n`;
            });
            fullPrompt += '\n';
        }
        
        fullPrompt += `Student uploaded an image and asks: ${message || 'Please explain this question'}\n\nTeacher:`;

        // Use AI service with image
        const result = await aiService.generateContent({
            prompt: fullPrompt,
            imageBase64,
            imageMimeType: 'image/jpeg'
        });

        // Clean up uploaded file
        fs.unlinkSync(imageFile.path);

        res.json({ text: result.text });

    } catch (error) {
        console.error('Error in voice tutor image chat:', error);
        res.status(500).json({ error: 'Failed to process image request' });
    }
});

// CBSE Class 10 Voice Tutor Endpoint (text only)
app.post('/api/voice-tutor/chat', async (req: Request, res: Response) => {
    try {
        const { message, class: classNum, subject, history } = req.body;

        if (!message || !classNum || !subject) {
            return res.status(400).json({ error: 'Message, class, and subject are required' });
        }

        // Import CBSE prompts and AI service
        const { getCBSEPrompt, isSupportedClass, getUnsupportedClassMessage } = await import('./prompts/cbsePrompts');
        const { aiService } = await import('./services/aiService');

        // Check if class is supported
        if (!isSupportedClass(classNum)) {
            const boundaryMessage = getUnsupportedClassMessage(classNum, subject);
            return res.json({ text: boundaryMessage });
        }

        // Get class and subject-specific CBSE prompt
        const systemPrompt = getCBSEPrompt(classNum as any, subject as any);

        // Convert history to standard format
        const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        
        if (history && Array.isArray(history)) {
            history.forEach((msg: any) => {
                if (msg.role === 'user') {
                    conversationHistory.push({
                        role: 'user',
                        content: msg.parts[0].text
                    });
                } else if (msg.role === 'model') {
                    conversationHistory.push({
                        role: 'assistant',
                        content: msg.parts[0].text
                    });
                }
            });
        }

        // Build full prompt with conversation history
        let fullPrompt = systemPrompt + '\n\n';
        
        if (conversationHistory.length > 0) {
            fullPrompt += 'Previous conversation:\n';
            conversationHistory.forEach(msg => {
                fullPrompt += `${msg.role === 'user' ? 'Student' : 'Teacher'}: ${msg.content}\n`;
            });
            fullPrompt += '\n';
        }
        
        fullPrompt += `Student: ${message}\n\nTeacher:`;

        // Use AI service (respects .env configuration)
        const result = await aiService.generateContent({
            prompt: fullPrompt,
        });

        res.json({ text: result.text });

    } catch (error) {
        console.error('Error in voice tutor chat:', error);
        res.status(500).json({ error: 'Failed to process chat request' });
    }
});

// Dual mode grading handler
async function handleDualModeGrading(
    req: Request,
    res: Response,
    questionPaperId: string | undefined,
    questionPaperFile: Express.Multer.File | undefined,
    answerSheetFile: Express.Multer.File
) {
    try {
        let gradingResult;
        let usedQuestionPaperId = questionPaperId;
        const userId = req.user?.id;

        if (questionPaperId) {
            // Use existing question paper
            console.log('Using stored question paper:', questionPaperId);
            gradingResult = await gradingService.gradeWithStoredQuestions(
                answerSheetFile.path,
                questionPaperId,
                userId
            );
        } else if (questionPaperFile) {
            // Extract new question paper and grade
            console.log('Extracting new question paper and grading');
            const result = await gradingService.gradeWithNewQuestionPaper(
                questionPaperFile.path,
                answerSheetFile.path,
                userId
            );
            usedQuestionPaperId = result.questionPaperId;
            gradingResult = result.gradingResult;
        } else {
            throw new Error('No question paper provided');
        }

        // Clean up uploaded files
        if (questionPaperFile) {
            fs.unlinkSync(questionPaperFile.path);
        }
        fs.unlinkSync(answerSheetFile.path);

        // Add question paper ID to response
        res.json({
            ...gradingResult,
            questionPaperId: usedQuestionPaperId,
            mode: 'dual'
        });

    } catch (error) {
        console.error('Error in dual mode grading:', error);
        
        // Clean up files on error
        if (questionPaperFile && fs.existsSync(questionPaperFile.path)) {
            fs.unlinkSync(questionPaperFile.path);
        }
        if (fs.existsSync(answerSheetFile.path)) {
            fs.unlinkSync(answerSheetFile.path);
        }
        
        throw error;
    }
}

// ============================================
// DOUBT SOLVER ENDPOINTS
// ============================================

// Explain Question Endpoint
app.post('/api/doubts/explain', optionalAuthMiddleware, upload.single('questionImage'), async (req: Request, res: Response) => {
    try {
        const { questionText, subject, language, questionNumber, worksheetId } = req.body;
        const userId = req.user?.id;

        // Debug logging
        console.log('[Doubt] Auth header:', req.headers.authorization ? 'Present' : 'Missing');
        console.log('[Doubt] User ID:', userId || 'NULL (Guest)');

        // Log worksheet question requests for debugging
        if (questionNumber && worksheetId) {
            console.log(`[Worksheet] Analyzing question ${questionNumber} for worksheet ${worksheetId}`);
        }

        if (!req.file && !questionText) {
            return res.status(400).json({ error: 'Either questionImage or questionText is required' });
        }

        if (!subject || !language) {
            return res.status(400).json({ error: 'Subject and language are required' });
        }

        const { explainQuestion } = await import('./services/doubtExplanationService');

        const questionImage = req.file ? fs.readFileSync(req.file.path) : undefined;

        const explanation = await explainQuestion({
            questionImage,
            questionText,
            subject,
            language,
            userId,
            questionNumber: questionNumber ? parseInt(questionNumber) : undefined,
            worksheetId,
        });

        // Clean up uploaded file
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.json(explanation);
    } catch (error: any) {
        console.error('Error explaining question:', error);
        
        // Handle rate limit errors with 429 status
        if (error.message && error.message.includes('Rate limit exceeded')) {
            res.status(429).json({ 
                error: 'Rate limit exceeded',
                details: error.message
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to explain question',
                details: error.message
            });
        }
    }
});

// Doubt Chat Endpoint
app.post('/api/doubts/chat', async (req: Request, res: Response) => {
    try {
        const { conversationId, doubtId, message, conversationHistory } = req.body;

        if (!conversationId || !doubtId || !message) {
            return res.status(400).json({ error: 'conversationId, doubtId, and message are required' });
        }

        const { sendMessage } = await import('./services/doubtConversationService');

        const result = await sendMessage({
            conversationId,
            doubtId,
            message,
            conversationHistory: conversationHistory || [],
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error in doubt chat:', error);
        res.status(500).json({ 
            error: 'Failed to process chat',
            details: error.message
        });
    }
});

// Doubt Chat Streaming Endpoint
app.post('/api/doubts/chat/stream', async (req: Request, res: Response) => {
    try {
        const { conversationId, doubtId, message, conversationHistory } = req.body;

        if (!conversationId || !doubtId || !message) {
            return res.status(400).json({ error: 'conversationId, doubtId, and message are required' });
        }

        const { streamResponse } = await import('./services/doubtConversationService');

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = streamResponse({
            conversationId,
            doubtId,
            message,
            conversationHistory: conversationHistory || [],
        });

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error: any) {
        console.error('Error in doubt chat stream:', error);
        res.status(500).json({ 
            error: 'Failed to process chat stream',
            details: error.message
        });
    }
});

// Get Doubt History Endpoint
app.get('/api/doubts/history', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        // Show all records regardless of auth status (for development)
        const userId = req.user?.id || null;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const subject = req.query.subject as string;
        const searchQuery = req.query.search as string;

        const { getHistory } = await import('./services/doubtHistoryService');

        const result = await getHistory({
            userId,
            page,
            limit,
            subject: subject as any,
            searchQuery,
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error getting doubt history:', error);
        res.status(500).json({ 
            error: 'Failed to get history',
            details: error.message
        });
    }
});

// Get Single Doubt Endpoint
app.get('/api/doubts/:doubtId', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { doubtId } = req.params;

        const { getDoubt } = await import('./services/doubtHistoryService');

        const result = await getDoubt(doubtId);

        res.json(result);
    } catch (error: any) {
        console.error('Error getting doubt:', error);
        if (error.message === 'Doubt not found') {
            return res.status(404).json({ error: 'Doubt not found' });
        }
        res.status(500).json({ 
            error: 'Failed to get doubt',
            details: error.message
        });
    }
});

// Toggle Favorite Endpoint
app.post('/api/doubts/:doubtId/favorite', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { doubtId } = req.params;
        const userId = req.user!.id;

        const { toggleFavorite } = await import('./services/doubtHistoryService');

        const result = await toggleFavorite(doubtId, userId);

        res.json(result);
    } catch (error: any) {
        console.error('Error toggling favorite:', error);
        if (error.message === 'Doubt not found') {
            return res.status(404).json({ error: 'Doubt not found' });
        }
        if (error.message === 'Unauthorized') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        res.status(500).json({ 
            error: 'Failed to toggle favorite',
            details: error.message
        });
    }
});

// Migrate Guest Doubts Endpoint
app.post('/api/doubts/migrate', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { doubtIds } = req.body;

        if (!Array.isArray(doubtIds) || doubtIds.length === 0) {
            return res.status(400).json({ error: 'doubtIds array is required' });
        }

        // Update all guest doubts to belong to this user
        const result = await prisma.doubt.updateMany({
            where: {
                id: { in: doubtIds },
                userId: null // Only migrate guest doubts
            },
            data: {
                userId: userId
            }
        });

        res.json({ 
            success: true, 
            migratedCount: result.count,
            message: `Successfully migrated ${result.count} doubts to your account`
        });
    } catch (error: any) {
        console.error('Error migrating doubts:', error);
        res.status(500).json({ 
            error: 'Failed to migrate doubts',
            details: error.message
        });
    }
});

// ============================================
// WORKSHEET ENDPOINTS
// ============================================

// Create worksheet
app.post('/api/worksheets/create', optionalAuthMiddleware, upload.single('image'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const { worksheetService } = await import('./services/worksheetService');
        const userId = req.user?.id;

        const imageBuffer = fs.readFileSync(req.file.path);
        const imageMimeType = req.file.mimetype;
        const imageUrl = `/uploads/${req.file.filename}`;

        const worksheet = await worksheetService.createWorksheet({
            imageBuffer,
            imageMimeType,
            imageUrl,
            userId,
            title: req.body.title,
            subject: req.body.subject,
        });

        res.json(worksheet);
    } catch (error: any) {
        console.error('Error creating worksheet:', error);
        res.status(500).json({ 
            error: 'Failed to create worksheet',
            details: error.message
        });
    }
});

// Get worksheet question
app.get('/api/worksheets/:worksheetId/question/:number', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { worksheetId, number } = req.params;
        const { worksheetService } = await import('./services/worksheetService');

        const result = await worksheetService.getQuestion(worksheetId, parseInt(number));

        // Disable caching to ensure fresh data for each question
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        res.json(result);
    } catch (error: any) {
        console.error('Error getting question:', error);
        if (error.message === 'Worksheet not found' || error.message === 'Question not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Worksheet session expired') {
            return res.status(410).json({ error: error.message });
        }
        res.status(500).json({ 
            error: 'Failed to get question',
            details: error.message
        });
    }
});

// Skip question
app.post('/api/worksheets/:worksheetId/skip/:number', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { worksheetId, number } = req.params;
        const { worksheetService } = await import('./services/worksheetService');

        await worksheetService.skipQuestion(worksheetId, parseInt(number));
        const nextNumber = await worksheetService.getNextQuestionNumber(worksheetId, parseInt(number));

        res.json({ 
            success: true,
            nextQuestion: nextNumber
        });
    } catch (error: any) {
        console.error('Error skipping question:', error);
        res.status(500).json({ 
            error: 'Failed to skip question',
            details: error.message
        });
    }
});

// Get worksheet progress
app.get('/api/worksheets/:worksheetId/progress', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { worksheetId } = req.params;
        const { worksheetService } = await import('./services/worksheetService');

        const progress = await worksheetService.getWorksheetProgress(worksheetId);

        res.json(progress);
    } catch (error: any) {
        console.error('Error getting progress:', error);
        res.status(500).json({ 
            error: 'Failed to get progress',
            details: error.message
        });
    }
});

// Cache question explanation
app.post('/api/worksheets/:worksheetId/question/:number/cache', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { worksheetId, number } = req.params;
        const { explanation, doubtId } = req.body;
        const { worksheetService } = await import('./services/worksheetService');

        await worksheetService.cacheExplanation(
            worksheetId,
            parseInt(number),
            explanation,
            doubtId
        );

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error caching explanation:', error);
        res.status(500).json({ 
            error: 'Failed to cache explanation',
            details: error.message
        });
    }
});

// ============================================
// REVISION ENDPOINTS
// ============================================

// Add to revision
app.post('/api/revision/add', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { doubtId } = req.body;
        const userId = req.user!.id;
        const { revisionService } = await import('./services/revisionService');

        await revisionService.addToRevision(userId, doubtId);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error adding to revision:', error);
        if (error.message === 'Doubt not found') {
            return res.status(404).json({ error: 'Doubt not found' });
        }
        res.status(500).json({ 
            error: 'Failed to add to revision',
            details: error.message
        });
    }
});

// Remove from revision
app.delete('/api/revision/remove/:doubtId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { doubtId } = req.params;
        const userId = req.user!.id;
        const { revisionService } = await import('./services/revisionService');

        await revisionService.removeFromRevision(userId, doubtId);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error removing from revision:', error);
        if (error.message === 'Doubt not found') {
            return res.status(404).json({ error: 'Doubt not found' });
        }
        res.status(500).json({ 
            error: 'Failed to remove from revision',
            details: error.message
        });
    }
});

// Get revision list
app.get('/api/revision/list', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.json({ doubts: [] });
        }
        const { subject, search } = req.query;
        const { revisionService } = await import('./services/revisionService');

        const doubts = await revisionService.getRevisionDoubts(userId, {
            subject: subject as string,
            search: search as string,
        });

        res.json({ doubts });
    } catch (error: any) {
        console.error('Error getting revision list:', error);
        res.status(500).json({ 
            error: 'Failed to get revision list',
            details: error.message
        });
    }
});

// Check revision status
app.get('/api/revision/check/:doubtId', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { doubtId } = req.params;
        const userId = req.user?.id;
        
        if (!userId) {
            return res.json({ isInRevision: false });
        }
        const { revisionService } = await import('./services/revisionService');

        const isInRevision = await revisionService.isInRevision(userId, doubtId);

        res.json({ isInRevision });
    } catch (error: any) {
        console.error('Error checking revision status:', error);
        res.status(500).json({ 
            error: 'Failed to check revision status',
            details: error.message
        });
    }
});

// ============================================
// RATING ENDPOINTS
// ============================================

// Rate doubt
app.post('/api/ratings/rate', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { doubtId, rating, feedback } = req.body;
        const userId = req.user!.id;
        const { ratingService } = await import('./services/ratingService');

        await ratingService.rateDoubt(userId, doubtId, rating, feedback);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error rating doubt:', error);
        if (error.message === 'Rating must be between 1 and 5') {
            return res.status(400).json({ error: error.message });
        }
        if (error.message === 'Doubt not found') {
            return res.status(404).json({ error: 'Doubt not found' });
        }
        res.status(500).json({ 
            error: 'Failed to rate doubt',
            details: error.message
        });
    }
});

// Get rating
app.get('/api/ratings/:doubtId', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { doubtId } = req.params;
        const userId = req.user?.id;
        
        if (!userId) {
            return res.json({ rating: null });
        }
        const { ratingService } = await import('./services/ratingService');

        const rating = await ratingService.getRating(userId, doubtId);

        res.json({ rating });
    } catch (error: any) {
        console.error('Error getting rating:', error);
        res.status(500).json({ 
            error: 'Failed to get rating',
            details: error.message
        });
    }
});

// Get rating analytics
app.get('/api/ratings/analytics', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { ratingService } = await import('./services/ratingService');

        const analytics = await ratingService.getRatingAnalytics(userId);

        res.json(analytics);
    } catch (error: any) {
        console.error('Error getting rating analytics:', error);
        res.status(500).json({ 
            error: 'Failed to get rating analytics',
            details: error.message
        });
    }
});

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

// Get recent doubts
app.get('/api/dashboard/recent-doubts', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 5;
        const { dashboardService } = await import('./services/dashboardService');

        const doubts = await dashboardService.getRecentDoubts(userId, limit);

        res.json({ doubts });
    } catch (error: any) {
        console.error('Error getting recent doubts:', error);
        res.status(500).json({ 
            error: 'Failed to get recent doubts',
            details: error.message
        });
    }
});

// Get dashboard stats
app.get('/api/dashboard/stats', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { dashboardService } = await import('./services/dashboardService');

        const stats = await dashboardService.getDoubtStats(userId);

        res.json(stats);
    } catch (error: any) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ 
            error: 'Failed to get dashboard stats',
            details: error.message
        });
    }
});

// Catch-all route for React Router (must be last)
if (process.env.NODE_ENV === 'production') {
  app.use((req: Request, res: Response) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (genAI) {
        console.log(`Using Gemini Vision API for exam grading`);
    } else {
        console.log(`Connecting to Ollama at ${process.env.OLLAMA_URL || 'http://localhost:11434/v1'}`);
        console.log(`Tip: Add GEMINI_API_KEY to .env for better OCR results`);
    }
    console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});
