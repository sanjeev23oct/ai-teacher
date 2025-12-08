import { aiService } from './aiService';

interface ASLScoringResult {
  score: number; // 1-5
  fixes: string[]; // Exactly 3 fixes
  transcription: string;
}

/**
 * CBSE ASL Scoring Rubric
 * Based on official CBSE guidelines
 */
const ASL_SCORING_PROMPT = `You are a friendly CBSE English teacher scoring ASL (Assessment of Speaking and Listening) for Class 9-10 students. Talk to them like a real teacher - warm, encouraging, and conversational.

CBSE SCORING RUBRIC (1-5):

5/5 - EXCELLENT:
- Fluent, clear pronunciation
- Good vocabulary and grammar
- Confident delivery
- Relevant content with examples

4/5 - VERY GOOD:
- Mostly fluent with minor hesitations
- Adequate vocabulary
- Clear enough to understand
- Relevant content

3/5 - GOOD:
- Some hesitations and pauses
- Basic vocabulary
- Understandable despite errors
- Stays on topic

2/5 - SATISFACTORY:
- Frequent pauses and hesitations
- Limited vocabulary
- Some communication breakdown
- Partially relevant

1/5 - NEEDS IMPROVEMENT:
- Very hesitant, many long pauses
- Very limited vocabulary
- Difficult to understand
- Off-topic or too brief

YOUR TASK:
1. Read the transcription of student's speech
2. Score it 1-5 based on the rubric above
3. Provide EXACTLY 3 conversational, teacher-like tips in Hinglish

FEEDBACK STYLE - Talk like a real teacher with specific examples:
✅ GOOD: "Dekho, you said 'um' 5 times - instead of 'um... I think', just breathe and say 'I think'"
✅ GOOD: "Tumne bola 'books are good' - better hota agar kehte 'books help us learn new things'"
✅ GOOD: "I heard you say 'my school is nice' - add details like 'my school has a big library and friendly teachers'"

❌ AVOID: "Reduce filler words" (too formal, no example)
❌ AVOID: "Improve vocabulary usage" (too technical, not specific)
❌ AVOID: "Enhance fluency" (not conversational, no context)

IMPORTANT:
- Quote what the student actually said (use their exact words)
- Show them a better way to say it with an example
- Use Hinglish naturally (mix Hindi-English as students speak)
- Make it feel like personal advice: "I noticed you said X, try saying Y instead"
- Each tip should reference something specific from their speech
- Be warm and encouraging like a real teacher

RESPONSE FORMAT (JSON only):
{
  "score": 3,
  "fixes": [
    "Dekho, you said 'um' 5 times - instead of 'um... I think', just breathe and say 'I think'",
    "Tumne bola 'books are good' - better hota agar kehte 'books help us learn new things'",
    "I heard you say 'my school is nice' - add details like 'my school has a big library and friendly teachers'"
  ]
}

Remember: Always quote what they said and show them how to say it better!`;

/**
 * Score student's ASL response
 */
export async function scoreASLResponse(params: {
  transcription: string;
  taskPrompt: string;
  keywords: string[];
  duration: number;
}): Promise<ASLScoringResult> {
  const { transcription, taskPrompt, keywords, duration } = params;

  // Build scoring prompt with context
  const prompt = `${ASL_SCORING_PROMPT}

TASK GIVEN TO STUDENT:
"${taskPrompt}"

EXPECTED KEYWORDS: ${keywords.join(', ')}

STUDENT'S RESPONSE (${duration}s):
"${transcription}"

Now score this response and provide exactly 3 fixes. Return ONLY valid JSON.`;

  try {
    const aiResult = await aiService.generateContent({ prompt });
    const response = aiResult.text;
    
    // Parse JSON response
    let jsonStr = response;
    if (response.includes('```json')) {
      jsonStr = response.split('```json')[1].split('```')[0];
    } else if (response.includes('```')) {
      jsonStr = response.split('```')[1].split('```')[0];
    }
    
    const result = JSON.parse(jsonStr.trim());
    
    // Validate response
    if (!result.score || !result.fixes || result.fixes.length !== 3) {
      throw new Error('Invalid scoring response format');
    }
    
    // Ensure score is 1-5
    result.score = Math.max(1, Math.min(5, result.score));
    
    return {
      score: result.score,
      fixes: result.fixes,
      transcription
    };
  } catch (error) {
    console.error('ASL scoring error:', error);
    throw new Error('Failed to score ASL response');
  }
}

/**
 * Transcribe audio using ElevenLabs Speech-to-Text
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  console.log('Audio received, size:', audioBuffer.length, 'bytes');
  
  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!elevenlabsApiKey) {
    console.warn('ELEVENLABS_API_KEY not found, using mock transcription');
    return `This is a sample student response about the topic. The student spoke for about 60 seconds discussing the main points with some examples. There were a few hesitations and filler words like um and uh, but overall the response was clear and on topic.`;
  }
  
  try {
    // ElevenLabs Speech-to-Text API
    const FormData = require('form-data');
    const form = new FormData();
    form.append('audio', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm',
      knownLength: audioBuffer.length
    });
    
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
        ...form.getHeaders()
      },
      body: form
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs STT error:', error);
      throw new Error(`ElevenLabs STT failed: ${response.status}`);
    }
    
    const data = await response.json();
    const transcription = data.text || data.transcription || '';
    
    console.log('Transcription successful:', transcription.substring(0, 100) + '...');
    return transcription;
    
  } catch (error) {
    console.error('Transcription error:', error);
    // Fallback to mock for testing
    return `This is a sample student response about the topic. The student spoke for about 60 seconds discussing the main points with some examples. There were a few hesitations and filler words like um and uh, but overall the response was clear and on topic.`;
  }
}

/**
 * Detect filler words and hesitations
 */
export function analyzeFillerWords(transcription: string): {
  fillerCount: number;
  fillers: string[];
} {
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'well'];
  const text = transcription.toLowerCase();
  
  let fillerCount = 0;
  const foundFillers: string[] = [];
  
  fillerWords.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      fillerCount += matches.length;
      if (!foundFillers.includes(filler)) {
        foundFillers.push(filler);
      }
    }
  });
  
  return { fillerCount, fillers: foundFillers };
}

/**
 * Check if response uses expected keywords
 */
export function checkKeywordUsage(transcription: string, keywords: string[]): {
  usedCount: number;
  usedKeywords: string[];
} {
  const text = transcription.toLowerCase();
  const usedKeywords: string[] = [];
  
  keywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      usedKeywords.push(keyword);
    }
  });
  
  return {
    usedCount: usedKeywords.length,
    usedKeywords
  };
}
