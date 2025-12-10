// Group Study Simulator - AI Classmate Prompts
// Reusable prompts for generating AI classmate responses

export interface ClassmatePromptParams {
  classmateName: string;
  studentAnswer: string;
  topic: string;
  subject: string;
  languageCode: string;
  difficulty?: 'supportive' | 'moderate' | 'challenging';
}

export interface CounterPromptParams extends ClassmatePromptParams {
  classmate1Name: string;
  classmate1Question: string;
  classmate1Response: string;
}

/**
 * Generate prompt for first classmate (questioner) based on difficulty
 */
export function getClassmate1Prompt(params: ClassmatePromptParams): string {
  const { classmateName, studentAnswer, topic, subject, languageCode, difficulty = 'moderate' } = params;
  
  const basePrompt = `You are ${classmateName}, a curious CBSE Class 9-10 student in a study group discussing ${topic} in ${subject}.

Your friend just answered: "${studentAnswer}"

Ask a follow-up question that:
- Challenges them to think deeper
- Uses phrases like "But what about..." or "How does this work when..."
- Is friendly and conversational (use Hinglish for Indian students)
- Focuses on practical application or edge cases
- Speaks naturally as ${classmateName}

`;

  const difficultyInstructions = {
    supportive: 'Ask a gentle clarifying question to help them explain better. Be encouraging.',
    moderate: 'Ask a thought-provoking question that makes them reconsider or add more details.',
    challenging: 'Ask a challenging edge-case question that tests their deep understanding.'
  };

  return basePrompt + difficultyInstructions[difficulty] + '\n\nKeep it short (1-2 sentences max). Speak in natural student language.';
}

/**
 * Generate prompt for second classmate (challenger) based on difficulty
 */
export function getClassmate2Prompt(params: CounterPromptParams): string {
  const { classmateName, studentAnswer, classmate1Name, classmate1Question, classmate1Response, topic, subject, languageCode, difficulty = 'moderate' } = params;
  
  const basePrompt = `You are ${classmateName}, an analytical CBSE Class 9-10 student in a study group discussing ${topic} in ${subject}.

Your friend initially said: "${studentAnswer}"
${classmate1Name} asked: "${classmate1Question}"
They responded: "${classmate1Response}"

Provide a counter-argument or alternative viewpoint that:
- Respectfully disagrees or shows another angle
- Starts with "I disagree because..." or "Actually..." or "What if..."
- Is thoughtful but friendly (use Hinglish for Indian students)
- Makes them defend their reasoning
- Speaks naturally as ${classmateName}

`;

  const difficultyInstructions = {
    supportive: 'Gently suggest an alternative view with supportive tone. Help them see another perspective.',
    moderate: 'Provide a reasonable counter-argument that makes them think critically.',
    challenging: 'Give a strong counter-argument with solid reasoning that really challenges their view.'
  };

  return basePrompt + difficultyInstructions[difficulty] + '\n\nKeep it short (1-2 sentences max). Speak in natural student language.';
}

/**
 * Generate evaluation prompt for handling skill assessment
 */
export function getEvaluationPrompt(
  topic: string,
  subject: string,
  studentAnswer: string,
  classmate1Question: string,
  classmate1Response: string,
  classmate2Counter: string,
  classmate2Response: string
): string {
  return `Evaluate this student's ability to handle challenges and defend their answer about ${topic} in ${subject}.

Initial Answer: "${studentAnswer}"

Follow-up Question Asked: "${classmate1Question}"
Student's Response: "${classmate1Response}"

Counter-Argument Given: "${classmate2Counter}"
Student's Response: "${classmate2Response}"

Provide:
1. A handling score (1-5) where:
   - 5: Clear, detailed, addresses challenges well, provides evidence
   - 4: Good explanations, handles most challenges
   - 3: Basic answers, some vagueness, needs more depth
   - 2: Struggled with challenges, unclear reasoning
   - 1: Very vague, didn't address questions properly

2. 2-3 specific strengths (what they did well)

3. 2-3 specific improvements (what they could do better)

Format your response as JSON:
{
  "score": <number 1-5>,
  "strengths": ["strength 1", "strength 2", ...],
  "improvements": ["improvement 1", "improvement 2", ...]
}`;
}

/**
 * Get tips for struggling students based on score
 */
export function getTipsForScore(score: number): string[] {
  if (score <= 2) {
    return [
      'Try to explain your reasoning, not just state the answer',
      'Use examples to support your points',
      'Address the specific question being asked',
      'It\'s okay to say "I\'m not sure, but I think..." and explain your thinking'
    ];
  } else if (score === 3) {
    return [
      'Add more specific details to your explanations',
      'Try to anticipate what questions might be asked',
      'Connect your answer to real-world examples'
    ];
  }
  return [];
}
