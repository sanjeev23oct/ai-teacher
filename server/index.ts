import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

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

// Routes
app.post('/api/grade', upload.single('exam'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Read the image file and convert to base64
        const imageBuffer = fs.readFileSync(req.file.path);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype;

        // Use Gemini if available, otherwise fall back to Ollama
        const useGemini = genAI && process.env.USE_GEMINI !== 'false';

        if (useGemini) {
            // Use Gemini Vision for better OCR and structured output
            const model = genAI!.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `You are a mathematics teacher grading an exam. Analyze this image and respond with ONLY valid JSON.

IMPORTANT: You must also identify the approximate position of each question in the image.

Carefully examine the mathematical problems, solutions, and work shown. For each question:
1. Identify its approximate position in the image (as percentage from top-left corner)
2. Evaluate correctness
3. Provide specific feedback
4. Identify the topic/concept

Output ONLY this JSON structure (no other text):
{
  "subject": "Mathematics",
  "language": "actual language (Bengali/Hindi/English/etc)",
  "gradeLevel": "estimate based on difficulty",
  "totalScore": "calculated score like 8/10",
  "feedback": "overall assessment of mathematical work",
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
      "remarks": "specific feedback",
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

            // Clean up uploaded file
            fs.unlinkSync(req.file.path);

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
        fs.unlinkSync(req.file.path);

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

    } catch (error) {
        console.error('Error processing exam:', error);
        res.status(500).json({ error: 'Failed to process exam. Make sure Ollama is running and llava model is pulled.' });
    }
});

// Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Convert history to OpenAI format
        const messages: any[] = [
            {
                role: "system",
                content: "You are a helpful and knowledgeable AI teacher. You help students with their doubts and explain concepts clearly. Keep your answers concise and conversational."
            }
        ];

        // Add history if provided
        if (history && Array.isArray(history)) {
            history.forEach((msg: any) => {
                if (msg.role === 'user') {
                    messages.push({
                        role: 'user',
                        content: msg.parts[0].text
                    });
                } else if (msg.role === 'model') {
                    messages.push({
                        role: 'assistant',
                        content: msg.parts[0].text
                    });
                }
            });
        }

        // Add current message
        messages.push({
            role: 'user',
            content: message
        });

        const response = await ollama.chat.completions.create({
            model: "llava:13b",
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        });

        const text = response.choices[0].message.content || '';
        res.json({ text });

    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ error: 'Failed to process chat. Make sure Ollama is running and llava model is pulled.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (genAI) {
        console.log(`Using Gemini Vision API for exam grading`);
    } else {
        console.log(`Connecting to Ollama at ${process.env.OLLAMA_URL || 'http://localhost:11434/v1'}`);
        console.log(`Tip: Add GEMINI_API_KEY to .env for better OCR results`);
    }
});
