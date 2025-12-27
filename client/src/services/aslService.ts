import type { ASLTask, ASLResult, ASLHistory, CustomASLTask } from '../types/aslTypes';

class ASLService {
  async fetchTasks(classNum?: 9 | 10, mode?: 'solo' | 'pair'): Promise<ASLTask[]> {
    let url = '/api/asl/tasks';
    const params = new URLSearchParams();
    
    if (classNum) params.append('class', classNum.toString());
    if (mode) params.append('mode', mode);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch ASL tasks');
    }
    
    return response.json();
  }

  async scoreASLResponse(
    transcription: string, 
    taskId: string, 
    mode: 'solo' | 'pair',
    languageCode: string,
    isCustom?: boolean
  ): Promise<ASLResult> {
    const response = await fetch('/api/asl/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        transcription,
        taskId,
        mode,
        languageCode,
        isCustom
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Scoring failed');
    }
    
    return response.json();
  }

  async scoreCustomASLResponse(
    transcription: string,
    customTask: CustomASLTask,
    languageCode: string
  ): Promise<ASLResult> {
    const response = await fetch('/api/asl/score-custom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        transcription,
        customTask,
        languageCode
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Scoring failed');
    }
    
    return response.json();
  }

  async fetchPracticeHistory(): Promise<ASLHistory[]> {
    const response = await fetch('/api/asl/history', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch practice history');
    }
    
    const data = await response.json();
    return Array.isArray(data.history) ? data.history : [];
  }

  async sendChatMessage(
    message: string,
    languageCode: string,
    context: any,
    history: any[]
  ): Promise<{ response: string }> {
    const response = await fetch('/api/asl/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        languageCode,
        context,
        history
      })
    });

    if (!response.ok) {
      throw new Error('Chat failed');
    }

    return response.json();
  }
}

export const aslService = new ASLService();