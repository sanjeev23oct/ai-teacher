export interface ASLTask {
  id: string;
  class?: 9 | 10; // Optional for custom topics
  mode: 'solo' | 'pair';
  title: string;
  prompt: string;
  keywords: string[];
  duration: number;
  sampleAnswer?: string;
  tips?: string[];
  isCustom?: boolean; // Flag to indicate if this is a custom topic
}

export interface ASLResult {
  score: number;
  fixes: string[];
  transcription?: string;
  detailedFeedback?: {
    originalText: string;
    improvements: Array<{
      original: string;
      suggestion: string;
      severity: 'minor' | 'major' | 'critical';
    }>;
  };
}

export interface ASLHistory {
  id: string;
  taskTitle: string;
  score: number;
  practicedAt: string;
  class?: number; // Optional for custom topics
  mode: string;
  transcription?: string;
  detailedFeedback?: {
    originalText: string;
    improvements: Array<{
      original: string;
      suggestion: string;
      severity: 'minor' | 'major' | 'critical';
    }>;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface CustomASLTask {
  title: string;
  prompt: string;
  keywords: string[];
  duration: number;
  mode: 'solo' | 'pair';
}

export type Mode = 'solo' | 'pair';