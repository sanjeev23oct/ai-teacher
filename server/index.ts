import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

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

        const prompt = `You are an expert teacher. 
Please grade this handwritten exam paper.

1. Identify the subject and likely grade level.
2. Identify the language of the handwriting.
3. Transcribe the student's answers (briefly).
4. Evaluate the correctness of each answer.
5. Assign a score (e.g., 8/10).
6. Provide constructive feedback and point out specific mistakes.

Return the response in the following JSON format ONLY:
{
  "subject": "Subject Name",
  "language": "Language (e.g., Hindi, English)",
  "totalScore": "X/Y",
  "feedback": "Overall feedback...",
  "detailedAnalysis": [
    {
      "question": "Question number or inferred question",
      "studentAnswer": "Transcribed answer",
      "correct": boolean,
      "score": "score for this question",
      "remarks": "Specific feedback"
    }
  ]
}`;

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
    console.log(`Connecting to Ollama at ${process.env.OLLAMA_URL || 'http://localhost:11434/v1'}`);
});
