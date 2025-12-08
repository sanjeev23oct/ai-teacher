/**
 * Revision Friend Prompt Templates
 * Phase-specific prompts for generating revision content
 */

export interface RevisionPromptParams {
  topic: string;
  subject: string;
  weakAreas?: string[];
}

export const revisionPrompts = {
  /**
   * Explanation Phase (60 seconds)
   * Main concept explanation in simple Hinglish
   */
  explanation: (params: RevisionPromptParams): string => `You are a friendly tutor helping a CBSE Class 9-10 student revise "${params.topic}" in ${params.subject}.

Provide a 60-second explanation in simple Hinglish covering:
- Main concept in easy words
- 2-3 key points to remember
- One practical example
- Why it's important for exams

Keep it conversational like: "Dekho yaar, ${params.topic} basically ye hai..."
Make it feel like a friend explaining, not a teacher lecturing.

Give a clear, engaging 60-second explanation:`,

  /**
   * Repeat Phase (30 seconds)
   * Key points for student repetition
   */
  repeat: (params: RevisionPromptParams): string => `Create a 30-second repetition exercise for "${params.topic}" in ${params.subject}.

Format: "Now tumhara turn - repeat these 3 main points:
1. [Point 1]
2. [Point 2]
3. [Point 3]

Bolo loudly and clearly!"

List 3 key points the student should repeat:`,

  /**
   * Quiz Phase (60 seconds)
   * 3 quick questions with answers
   */
  quiz: (params: RevisionPromptParams): string => `Create a 60-second quick quiz with 3 questions about "${params.topic}" in ${params.subject} for CBSE Class 9-10.

Format each question like:
"Question 1: [Easy question]
*pause for answer*
Answer: [Correct answer with brief explanation]"

Make questions exam-relevant but not too hard.

Create 3 quick questions:`,

  /**
   * Drill Phase (30 seconds)
   * Rapid review focusing on weak areas
   */
  drill: (params: RevisionPromptParams): string => {
    const weakAreasText = params.weakAreas && params.weakAreas.length > 0
      ? params.weakAreas.join(', ')
      : 'key concepts';

    return `Create a 30-second rapid drill for "${params.topic}" in ${params.subject}.
${params.weakAreas && params.weakAreas.length > 0 ? `Focus on these weak areas: ${weakAreasText}` : ''}

Format: "Last 30 seconds - rapid fire!
- Remember: [Key point 1]
- Don't forget: [Key point 2]
- Exam tip: [Important tip]

You've got this! 💪"

Create the final drill:`;
  },
};

/**
 * Subject-specific context to add to prompts
 */
export const subjectContext = {
  English: 'Focus on literary devices, themes, character analysis, and writing techniques.',
  Science: 'Focus on scientific concepts, experiments, formulas, and real-world applications.',
  Math: 'Focus on formulas, problem-solving steps, common mistakes, and exam patterns.',
  SST: 'Focus on historical events, dates, causes and effects, and map work.',
};

/**
 * Get NCERT reference if available
 */
export function getNCERTReference(topic: string, subject: string): string | null {
  // This would ideally query a database or reference file
  // For now, return null - can be enhanced later
  return null;
}
