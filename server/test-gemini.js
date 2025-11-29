const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI('AIzaSyBEHrsNADaar_SnyxTyI9TARYUGX8fCuF0');

async function listModels() {
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBEHrsNADaar_SnyxTyI9TARYUGX8fCuF0');
        const data = await response.json();
        console.log('Available models:');
        data.models.forEach(m => {
            if (m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent')) {
                console.log(`  - ${m.name.replace('models/', '')}`);
            }
        });
    } catch (e) {
        console.error('Error listing models:', e);
    }
}

async function testGemini() {
    await listModels();
    console.log('\nTrying gemini-2.5-flash...\n');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const imagePath = '/Users/sanjeevgulati/personal-repos/ai-teacher/server/samplerequest/WhatsApp Image 2025-11-29 at 12.52.50 PM.jpeg';
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    const prompt = `You are a mathematics teacher. Analyze this exam and respond with ONLY valid JSON.

Output this JSON structure:
{
  "subject": "Mathematics",
  "language": "actual language",
  "gradeLevel": "grade level",
  "totalScore": "score like 8/10",
  "feedback": "assessment",
  "detailedAnalysis": [
    {
      "question": "question text",
      "studentAnswer": "answer",
      "correct": true,
      "score": "points",
      "remarks": "feedback"
    }
  ]
}`;

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
        }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    console.log('Gemini Response:');
    console.log(text);
}

testGemini().catch(console.error);
