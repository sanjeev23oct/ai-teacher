import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

type AIProvider = 'gemini' | 'lmstudio' | 'ollama' | 'groq';

interface AIConfig {
  provider: AIProvider;
  geminiApiKey?: string;
  lmStudioUrl?: string;
  lmStudioModel?: string;
  ollamaUrl?: string;
  groqApiKey?: string;
  groqModel?: string;
}

interface GenerateContentParams {
  prompt: string;
  imageBase64?: string;
  imageMimeType?: string;
}

interface GenerateContentResult {
  text: string;
}

class AIService {
  private config: AIConfig;
  private geminiClient?: GoogleGenerativeAI;
  private openaiClient?: OpenAI;

  constructor() {
    const provider = (process.env.AI_PROVIDER || 'lmstudio') as AIProvider;
    
    this.config = {
      provider,
      geminiApiKey: process.env.GEMINI_API_KEY,
      lmStudioUrl: process.env.LM_STUDIO_URL || 'http://localhost:1234/v1',
      lmStudioModel: process.env.LM_STUDIO_MODEL || 'llama-3.2-3b-instruct',
      ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434/v1',
      groqApiKey: process.env.GROQ_API_KEY,
      groqModel: process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
    };

    this.initializeClients();
  }

  private initializeClients() {
    // Initialize Gemini if configured
    if (this.config.geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(this.config.geminiApiKey);
    }

    // Initialize OpenAI-compatible client for LM Studio, Ollama, or Groq
    if (this.config.provider === 'lmstudio') {
      this.openaiClient = new OpenAI({
        baseURL: this.config.lmStudioUrl,
        apiKey: 'lm-studio', // LM Studio doesn't require a real key
      });
    } else if (this.config.provider === 'ollama') {
      this.openaiClient = new OpenAI({
        baseURL: this.config.ollamaUrl,
        apiKey: 'ollama', // Ollama doesn't require a real key
      });
    } else if (this.config.provider === 'groq' && this.config.groqApiKey) {
      this.openaiClient = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: this.config.groqApiKey,
      });
    }
  }

  async generateContent(params: GenerateContentParams): Promise<GenerateContentResult> {
    const { prompt, imageBase64, imageMimeType } = params;

    if (this.config.provider === 'gemini' && this.geminiClient) {
      return await this.generateWithGemini(prompt, imageBase64, imageMimeType);
    } else if (this.openaiClient) {
      return await this.generateWithOpenAI(prompt, imageBase64, imageMimeType);
    } else {
      throw new Error('No AI provider configured');
    }
  }

  private async generateWithGemini(
    prompt: string,
    imageBase64?: string,
    imageMimeType?: string
  ): Promise<GenerateContentResult> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const model = this.geminiClient.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 8000, // Increase token limit to prevent truncation
        temperature: 0.7,
      }
    });

    const parts: any[] = [];

    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      });
    }

    parts.push({ text: prompt });

    try {
      const result = await model.generateContent(parts);
      const response = result.response;
      const text = response.text();

      return { text };
    } catch (error: any) {
      // Handle rate limit errors specifically
      if (error.status === 429) {
        const retryDelay = error.errorDetails?.find((detail: any) => 
          detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
        )?.retryDelay;
        
        const waitTime = retryDelay ? ` Please try again in ${retryDelay}.` : ' Please try again in a few moments.';
        throw new Error(`Rate limit exceeded.${waitTime}`);
      }
      throw error;
    }
  }

  private async generateWithOpenAI(
    prompt: string,
    imageBase64?: string,
    imageMimeType?: string
  ): Promise<GenerateContentResult> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    let model: string;
    if (this.config.provider === 'lmstudio') {
      model = this.config.lmStudioModel!;
    } else if (this.config.provider === 'groq') {
      model = this.config.groqModel!;
    } else {
      model = 'llava:34b'; // ollama default
    }

    const messages: any[] = [];

    if (imageBase64 && imageMimeType) {
      // For vision models (LM Studio, Ollama, Groq with Llama 4 Scout)
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${imageMimeType};base64,${imageBase64}`,
            },
          },
        ],
      });
    } else {
      // Text-only
      messages.push({
        role: 'user',
        content: prompt,
      });
    }

    // Groq has different token limits - try 8000 for better responses
    const maxTokens = this.config.provider === 'groq' ? 8000 : 4000;
    
    const response = await this.openaiClient.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const text = response.choices[0].message.content || '';
    return { text };
  }

  async streamContent(
    prompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<AsyncIterableIterator<string>> {
    if (this.config.provider === 'gemini' && this.geminiClient) {
      return this.streamWithGemini(prompt, conversationHistory);
    } else if (this.openaiClient) {
      return this.streamWithOpenAI(prompt, conversationHistory);
    } else {
      throw new Error('No AI provider configured for streaming');
    }
  }

  private async *streamWithGemini(
    prompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): AsyncIterableIterator<string> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const model = this.geminiClient.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 8000,
        temperature: 0.7,
      }
    });

    const history = conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }

  private async *streamWithOpenAI(
    prompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): AsyncIterableIterator<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    let model: string;
    if (this.config.provider === 'lmstudio') {
      model = this.config.lmStudioModel!;
    } else if (this.config.provider === 'groq') {
      model = this.config.groqModel!;
    } else {
      model = 'llava:34b'; // ollama default
    }

    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user' as const, content: prompt },
    ];

    const stream = await this.openaiClient.chat.completions.create({
      model,
      messages,
      max_tokens: 4000,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  getProvider(): AIProvider {
    return this.config.provider;
  }
}

// Export singleton instance
export const aiService = new AIService();
