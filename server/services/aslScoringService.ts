import { aiService } from './aiService';

interface ASLScoringResult {
  score: number; // 1-5
  fixes: string[]; // Exactly 3 fixes
  transcription: string;
  detailedFeedback?: {
    originalText: string;
    annotatedText: string;
    improvements: Array<{
      original: string;
      suggestion: string;
      severity: 'minor' | 'major' | 'critical';
      position: number;
    }>;
  };
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
 * Enhanced scoring with detailed word-by-word feedback
 */
export async function scoreASLResponseDetailed(params: {
  transcription: string;
  taskPrompt: string;
  keywords: string[];
  duration: number;
}): Promise<ASLScoringResult> {
  const { transcription, taskPrompt, keywords, duration } = params;

  // Enhanced prompt for detailed analysis
  const detailedPrompt = `You are a CBSE English teacher providing detailed word-by-word feedback on ASL speaking.

TASK: "${taskPrompt}"
STUDENT RESPONSE: "${transcription}"

Provide:
1. Score (1-5) based on CBSE rubric
2. Three conversational feedback points
3. Detailed word-by-word analysis with HTML highlighting

For the annotated text, highlight issues using:
- <span style="background-color: #fef3c7; color: #92400e;">word</span> for minor issues (yellow)
- <span style="background-color: #fed7aa; color: #c2410c;">word</span> for major issues (orange)  
- <span style="background-color: #fecaca; color: #dc2626;">word</span> for critical issues (red)
- <em style="color: #10b981;">suggested replacement</em> for AI suggestions

Example annotated text:
"I <span style="background-color: #fef3c7; color: #92400e;">really really</span> <em style="color: #10b981;">really</em> like books because they <span style="background-color: #fed7aa; color: #c2410c;">are good</span> <em style="color: #10b981;">teach us many things</em>."

RESPONSE FORMAT (JSON only):
{
  "score": 4,
  "fixes": [
    "You said 'really really' twice - just say 'really' once for better flow",
    "Instead of 'books are good', try 'books teach us many things' - more specific!",
    "Great job staying on topic! Next time add a personal example"
  ],
  "detailedFeedback": {
    "originalText": "${transcription}",
    "annotatedText": "Your annotated text with HTML highlighting here",
    "improvements": [
      {
        "original": "really really",
        "suggestion": "really",
        "severity": "minor",
        "position": 2
      }
    ]
  }
}`;

  try {
    const aiResult = await aiService.generateContent({ prompt: detailedPrompt });
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
      transcription,
      detailedFeedback: result.detailedFeedback
    };
  } catch (error) {
    console.error('Enhanced ASL scoring error:', error);
    // Fallback to basic scoring
    return scoreASLResponse(params);
  }
}

/**
 * Score student's ASL response (basic version)
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
 * Score custom ASL response (for general topics)
 */
export async function scoreCustomASLResponse(params: {
  transcription: string;
  taskPrompt: string;
  keywords: string[];
  duration: number;
}): Promise<ASLScoringResult> {
  const { transcription, taskPrompt, keywords, duration } = params;

  // Build scoring prompt with context for custom topics
  const prompt = `${ASL_SCORING_PROMPT}

CUSTOM SPEAKING TASK:
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
    console.error('Custom ASL scoring error:', error);
    throw new Error('Failed to score custom ASL response');
  }
}

/**
 * Transcribe audio using mock transcription for testing
 * NOTE: This function is deprecated - we now use client-side native STT
 * @deprecated Use client-side nativeSTTService instead
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  console.log('⚠️  [DEPRECATED] transcribeAudio called - should use client-side STT instead');
  console.log('📊 Audio buffer size:', audioBuffer.length, 'bytes');
  
  // Return a fallback message indicating this shouldn't be used
  return "This is a deprecated server-side transcription. Please use client-side native STT instead.";
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