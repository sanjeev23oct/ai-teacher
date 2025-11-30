import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import * as questionPaperService from './questionPaperService';
import { calculateImageHash } from '../lib/imageHash';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

/**
 * Get subject-specific and grade-level appropriate tone and examples
 */
function getSubjectSpecificGuidelines(subject: string, gradeLevel: string): string {
    const isElementary = gradeLevel.toLowerCase().includes('grade') && 
                        (gradeLevel.includes('1') || gradeLevel.includes('2') || 
                         gradeLevel.includes('3') || gradeLevel.includes('4') || gradeLevel.includes('5'));
    
    const isMiddle = gradeLevel.toLowerCase().includes('grade') && 
                    (gradeLevel.includes('6') || gradeLevel.includes('7') || gradeLevel.includes('8'));
    
    const subjectLower = subject.toLowerCase();
    
    let guidelines = '';
    
    // Subject-specific tone
    if (subjectLower.includes('math') || subjectLower.includes('algebra') || 
        subjectLower.includes('geometry') || subjectLower.includes('trigonometry')) {
        guidelines += `
MATHEMATICS TEACHER TONE:
- Use simple, clear explanations for concepts
- Break down steps logically
- Use everyday examples (money, shapes, measurements)
- Encourage problem-solving thinking
- Hinglish examples: "Dekho, yeh formula bahut simple hai!", "Step by step karte hain", "Calculation mein dhyan do"`;
    } else if (subjectLower.includes('science') || subjectLower.includes('physics') || 
               subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
        guidelines += `
SCIENCE TEACHER TONE:
- Connect concepts to real-world examples
- Encourage curiosity and observation
- Use relatable analogies
- Praise scientific thinking
- Hinglish examples: "Experiment ka result dekho!", "Concept clear hai?", "Real life mein yeh kaise hota hai?"`;
    } else if (subjectLower.includes('english') || subjectLower.includes('language')) {
        guidelines += `
LANGUAGE TEACHER TONE:
- Encourage expression and creativity
- Focus on communication, not just grammar
- Praise effort in writing/speaking
- Be supportive of mistakes
- Hinglish examples: "Tumhari writing bahut creative hai!", "Grammar thoda improve karo", "Expression accha hai!"`;
    } else if (subjectLower.includes('social') || subjectLower.includes('history') || 
               subjectLower.includes('geography')) {
        guidelines += `
SOCIAL STUDIES TEACHER TONE:
- Make connections to current events
- Encourage critical thinking
- Appreciate different perspectives
- Use storytelling approach
- Hinglish examples: "History ko story ki tarah samjho", "Map reading mein practice karo", "Facts yaad rakho"`;
    }
    
    // Grade-level adaptation
    if (isElementary) {
        guidelines += `
ELEMENTARY LEVEL (Grades 1-5):
- Use very simple language
- Give lots of encouragement and praise
- Use fun, playful tone
- Short sentences
- Examples: "Shabash! Bahut accha!", "Tumne mehnat ki!", "Keep trying, you can do it!"`;
    } else if (isMiddle) {
        guidelines += `
MIDDLE SCHOOL LEVEL (Grades 6-8):
- Balance encouragement with constructive feedback
- Explain "why" behind concepts
- Build confidence
- Examples: "Good thinking!", "Concept samajh aa gaya?", "Let's improve this together"`;
    } else {
        guidelines += `
HIGH SCHOOL LEVEL (Grades 9-12):
- More detailed explanations
- Focus on understanding and application
- Prepare for exams
- Examples: "Excellent approach!", "Yeh concept exam mein important hai", "Practice more problems"`;
    }
    
    return guidelines;
}

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
    questionPaperId: string,
    userId?: string
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

    // Get subject and grade-specific guidelines
    const subjectGuidelines = getSubjectSpecificGuidelines(questionPaper.subject, questionPaper.gradeLevel);

    const prompt = `You are a warm, caring ${questionPaper.subject} teacher (${questionPaper.gradeLevel}) who genuinely wants your students to succeed. You're supportive, encouraging, and make learning feel positive.

${subjectGuidelines}

QUESTION PAPER (already extracted):
${questionsText}

ANSWER SHEET IMAGE:
The student's handwritten answers are in the image. Match each answer to its question number.

Your task:
1. Extract answers from the answer sheet with their question numbers
2. Match each answer to the corresponding question from the question paper above
3. Grade each answer against its question
4. Identify unanswered questions
5. Create MULTIPLE annotations throughout each answer (like a teacher marking a physical paper):
   - Checkmarks (✓) for correct steps/parts
   - Crosses (✗) for mistakes
   - Score badges showing points earned
   - Comment bubbles for important feedback
   Place annotations at specific locations in the student's work
6. Write feedback that feels HUMAN and ENCOURAGING

FEEDBACK TONE GUIDELINES:
- Be conversational and friendly, like an Indian teacher talking to a student
- Mix Hindi and English naturally (Hinglish) - the way teachers actually speak
- Use "you" and "your" to make it personal
- Include encouraging emojis naturally (✨, 💪, 🎯, 🌟, 🚀, 💡, 👏, 🔥)
- Show genuine excitement for their successes
- Be gentle and supportive about mistakes
- Offer specific, actionable advice
- Use contractions (you're, let's, that's)
- Avoid: "The student", "demonstrates", "adequate", "satisfactory"
- Use: "You", "your", "great", "excellent", "let's", "together"

HINGLISH EXAMPLES:
- "Bahut accha! You've really understood this concept! 🎯"
- "Dekho, your approach is correct, but calculation mein thodi si mistake hai"
- "Excellent work! Tumne step-by-step bahut clearly dikhaya"
- "Arre wah! This solution is perfect! 🌟"
- "Chalo, let's work on this together. Yahan pe ek chhoti si galti hai"
- "Shabash! Keep up the great work! 💪"

FEEDBACK STRUCTURE (KEEP IT SHORT - max 100 words, use Hinglish naturally):
1. Warm opening in Hinglish (1 sentence with score)
2. Celebrate strengths (1-2 examples with ✨, mix Hindi-English)
3. Gentle improvements if needed (brief with 💪, use Hinglish)
4. Motivational closing in Hinglish (1 sentence with 🚀)

EXAMPLE PHRASES:
Praise: "Brilliant!", "Spot on!", "You nailed it!", "I'm impressed!", "Excellent work!"
Guidance: "Here's the trick...", "Think of it this way...", "Let me show you..."
Encouragement: "You've got this!", "Keep going!", "Almost there!", "You're improving!"

⚠️ CRITICAL: Keep ALL text fields SHORT to ensure complete JSON! Feedback max 100 words, remarks max 2 sentences!

Return ONLY valid JSON:
{
  "subject": "${questionPaper.subject}",
  "language": "${questionPaper.language}",
  "gradeLevel": "${questionPaper.gradeLevel}",
  "totalScore": "calculated score like 13/15",
  "feedback": "WARM, HUMAN feedback in HINGLISH (MAX 100 WORDS - KEEP IT SHORT!). Mix Hindi and English naturally. Structure: warm opening with score → celebrate 1-2 strengths with ✨ → gentle improvements if needed with 💪 → motivational closing with 🚀. Be concise but encouraging!",
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
    },
    {
      "id": "ann-2",
      "type": "cross",
      "position": { "x": 15, "y": 35 },
      "color": "red",
      "text": "Calculation error here",
      "questionId": "q1",
      "clickable": true
    },
    {
      "id": "ann-3",
      "type": "score",
      "position": { "x": 90, "y": 28 },
      "color": "green",
      "text": "3/5",
      "questionId": "q1",
      "clickable": true
    },
    {
      "id": "ann-4",
      "type": "comment",
      "position": { "x": 50, "y": 40 },
      "color": "yellow",
      "text": "Good start!",
      "questionId": "q1",
      "clickable": true
    }
  ],
  
  IMPORTANT: Create MULTIPLE annotations for each answer (like a teacher marking):
  - Checkmarks (✓) for correct steps/working (type: "checkmark", color: "green", no text needed)
  - Crosses (✗) for mistakes/errors (type: "cross", color: "red", text: brief explanation like "Wrong formula" or "Calculation error")
  - Score badges at the end of each answer (type: "score", text: "3/5", color: "green" or "red")
  - Comment bubbles for key feedback (type: "comment", text: "Good start!" or "Check this step", color: "yellow" for neutral, "red" for errors)
  - Position (x, y) as percentage (0-100) of image dimensions
  - Place annotations throughout the answer, not just at the start
  - For long answers, add 3-5 annotations showing where they did well/wrong
  - For EVERY cross or red annotation, include helpful "text" explaining what went wrong
  - questionId must match the id in detailedAnalysis (e.g., "q1", "q2", "q3")
  "detailedAnalysis": [
    {
      "id": "q1",
      "questionNumber": "1",
      "question": "question text from question paper",
      "studentAnswer": "extracted answer or null if not attempted",
      "correct": true or false,
      "score": "points earned",
      "remarks": "HUMAN, ENCOURAGING feedback in HINGLISH (1-2 sentences max - BE BRIEF!). Mix Hindi-English naturally. If correct: celebrate briefly. If incorrect: explain gently what went wrong",
      "topic": "topic if known",
      "concept": "concept if known",
      "position": { "x": 10, "y": 25 },
      "matched": true,
      "matchConfidence": 1.0,
      "answerLocation": "found"
    }
  ]
  
  NOTE: Ensure each question has a matching annotation with the same questionId (q1, q2, q3, etc.)
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

    // Try to fix truncated JSON by adding closing braces
    let gradingResult;
    try {
        gradingResult = JSON.parse(jsonStr.trim());
    } catch (parseError: any) {
        console.error('JSON parse error, attempting to fix truncated response...');
        console.log('Raw JSON length:', jsonStr.length);
        
        // Try to fix by removing incomplete strings and adding missing closing braces
        let fixedJson = jsonStr.trim();
        
        // Remove incomplete string at the end (common truncation issue)
        // Look for unclosed quotes in the last field
        const lastQuoteIndex = fixedJson.lastIndexOf('"');
        const lastColonIndex = fixedJson.lastIndexOf(':');
        
        if (lastColonIndex > lastQuoteIndex) {
            // There's an incomplete value after the last colon
            // Truncate to the last complete field
            const lastCommaIndex = fixedJson.lastIndexOf(',');
            if (lastCommaIndex > 0) {
                fixedJson = fixedJson.substring(0, lastCommaIndex);
            }
        }
        
        // Count and balance braces/brackets
        const openBraces = (fixedJson.match(/{/g) || []).length;
        const closeBraces = (fixedJson.match(/}/g) || []).length;
        const openBrackets = (fixedJson.match(/\[/g) || []).length;
        const closeBrackets = (fixedJson.match(/\]/g) || []).length;
        
        // Add missing closing brackets and braces
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
            fixedJson += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
            fixedJson += '}';
        }
        
        try {
            gradingResult = JSON.parse(fixedJson);
            console.log('✅ Successfully fixed truncated JSON');
        } catch (secondError) {
            console.error('❌ Failed to fix JSON. Last 200 chars:', jsonStr.slice(-200));
            throw new Error(`Failed to parse Gemini response: ${parseError?.message || 'Unknown error'}\n\nRaw response: ${text.substring(0, 500)}...`);
        }
    }

    // Store grading in database
    await questionPaperService.storeGrading({
        userId: userId,
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
    answerSheetPath: string,
    userId?: string
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
}

Note: Extract questions accurately - these will be used to grade students with warm, encouraging feedback.`;

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

        let extracted;
        try {
            extracted = JSON.parse(jsonStr.trim());
        } catch (parseError: any) {
            console.error('JSON parse error in extraction, attempting to fix...');
            let fixedJson = jsonStr.trim();
            const openBraces = (fixedJson.match(/{/g) || []).length;
            const closeBraces = (fixedJson.match(/}/g) || []).length;
            const openBrackets = (fixedJson.match(/\[/g) || []).length;
            const closeBrackets = (fixedJson.match(/\]/g) || []).length;
            
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                fixedJson += ']';
            }
            for (let i = 0; i < openBraces - closeBraces; i++) {
                fixedJson += '}';
            }
            
            extracted = JSON.parse(fixedJson);
            console.log('Successfully fixed truncated extraction JSON');
        }

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
    const gradingResult = await gradeWithStoredQuestions(answerSheetPath, questionPaper.id, userId);

    return {
        questionPaperId: questionPaper.id,
        gradingResult
    };
}
