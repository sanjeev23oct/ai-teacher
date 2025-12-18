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
- Fluent, clear pronunciation with minimal hesitations
- Rich vocabulary and correct grammar
- Confident, natural delivery
- Comprehensive content with good examples
- Addresses all aspects of the topic

4/5 - VERY GOOD:
- Mostly fluent with occasional minor hesitations
- Good vocabulary and mostly correct grammar
- Clear and understandable delivery
- Relevant content covering most aspects
- Some good examples or details

3/5 - GOOD:
- Some hesitations but generally understandable
- Adequate vocabulary for the topic
- Basic grammar with minor errors
- Stays on topic with basic coverage
- Limited examples or details

2/5 - SATISFACTORY:
- Frequent hesitations affecting flow
- Limited vocabulary, repetitive language
- Grammar errors that sometimes affect meaning
- Partially addresses the topic
- Very few examples or details

1/5 - NEEDS IMPROVEMENT:
- Very hesitant with many long pauses
- Very limited vocabulary
- Many grammar errors affecting understanding
- Off-topic or extremely brief response
- No examples or supporting details

ANALYSIS INSTRUCTIONS:
1. Carefully read the student's transcription
2. Analyze ONLY what is actually present in their speech
3. Score based on the rubric above (1-5)
4. Provide EXACTLY 3 specific, actionable tips

FEEDBACK GUIDELINES:
- Base feedback on ACTUAL content from their speech
- Quote their exact words when giving examples
- Don't assume problems that aren't clearly present
- Focus on the most impactful improvements
- Use encouraging, teacher-like tone in Hinglish
- Give specific alternatives, not just criticism

FEEDBACK EXAMPLES:
✅ GOOD: "Tumne kaha 'books are good' - try adding why: 'books are good because they teach us new things'"
✅ GOOD: "I noticed you repeated 'very good' 3 times - use different words like 'excellent', 'amazing', 'wonderful'"
✅ GOOD: "You said 'I like cricket' - add details: 'I like cricket because it's exciting and teaches teamwork'"

❌ AVOID: Mentioning filler words if they're not excessive (1-2 'um' is normal)
❌ AVOID: Generic advice like "speak more fluently" without examples
❌ AVOID: Criticizing things that aren't actually problems in their speech

RESPONSE FORMAT (JSON only):
{
  "score": 4,
  "fixes": [
    "Tumne kaha 'books are good' - try adding why: 'books are good because they teach us new things'",
    "I noticed you repeated 'very good' 3 times - use different words like 'excellent', 'amazing', 'wonderful'",
    "You covered the topic well - next time add a personal example to make it more interesting"
  ]
}

CRITICAL: Only mention issues that are clearly present in the transcription. Don't assume problems!`;

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
