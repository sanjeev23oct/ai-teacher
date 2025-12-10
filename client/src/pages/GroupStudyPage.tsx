import React, { useState, useEffect, useRef } from 'react';
import { Users, Play, MessageCircle, Award, TrendingUp, LogIn, Volume2, VolumeX } from 'lucide-react';
import { getApiUrl } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/api';

interface GroupStudySession {
  sessionId: string;
  topic: string;
  subject: string;
  classmate1Name: string;
  classmate2Name: string;
  phase: 'setup' | 'initial-answer' | 'classmate1-question' | 'classmate1-response' | 'classmate2-counter' | 'classmate2-response' | 'evaluation';
}

interface AIMessage {
  speaker: 'classmate1' | 'classmate2';
  speakerName: string;
  message: string;
}

interface EvaluationResult {
  handlingScore: number;
  strengths: string[];
  improvements: string[];
  tips: string[];
  badge?: string;
  nextDifficulty: string;
}

interface HandlingHistory {
  topic: string;
  subject: string;
  score: number;
  date: string;
  challenges: number;
}

const GroupStudyPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('English');
  const [classmate1Name, setClassmate1Name] = useState('');
  const [classmate2Name, setClassmate2Name] = useState('');
  const [session, setSession] = useState<GroupStudySession | null>(null);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [classmate1Message, setClassmate1Message] = useState<AIMessage | null>(null);
  const [classmate2Message, setClassmate2Message] = useState<AIMessage | null>(null);
  const [classmate1Response, setClassmate1Response] = useState('');
  const [classmate2Response, setClassmate2Response] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<HandlingHistory[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = async (text: string, speakerRole: 'questioner' | 'challenger') => {
    if (isPlayingAudio) return;

    setIsPlayingAudio(true);
    try {
      const response = await authenticatedFetch(getApiUrl('/api/group-study/audio/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speakerRole }),
      });

      if (!response.ok) throw new Error('Audio generation failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsPlayingAudio(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
      fetchProgress();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/api/group-study/history'));
      const data = await response.json();
      setHistory(data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/api/group-study/progress'));
      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const startSession = async () => {
    if (!topic || !subject || !classmate1Name || !classmate2Name) {
      alert('Please enter topic, subject, and both classmate names');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(getApiUrl('/api/group-study/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, subject, classmate1Name, classmate2Name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start session');
      }

      const data = await response.json();
      setSession({
        sessionId: data.sessionId,
        topic: data.topic,
        subject: data.subject,
        classmate1Name: data.classmate1Name,
        classmate2Name: data.classmate2Name,
        phase: 'initial-answer',
      });
      setStudentAnswer('');
      setClassmate1Message(null);
      setClassmate2Message(null);
      setEvaluation(null);
    } catch (error: any) {
      console.error('Failed to start session:', error);
      alert(error.message || 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!session || !studentAnswer) return;

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(getApiUrl('/api/group-study/classmate1-question'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId, studentAnswer }),
      });

      const data = await response.json();
      setClassmate1Message(data);
      setSession({ ...session, phase: 'classmate1-question' });
      setClassmate1Response('');
      
      if (data.message) {
        playAudio(data.message, 'questioner');
      }
    } catch (error) {
      console.error('Failed to get classmate1 question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitClassmate1Response = async () => {
    if (!session || !classmate1Response) return;

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(getApiUrl('/api/group-study/classmate2-counter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId, classmate1Response }),
      });

      const data = await response.json();
      setClassmate2Message(data);
      setSession({ ...session, phase: 'classmate2-counter' });
      setClassmate2Response('');
      
      if (data.message) {
        playAudio(data.message, 'challenger');
      }
    } catch (error) {
      console.error('Failed to get classmate2 counter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitClassmate2Response = async () => {
    if (!session || !classmate2Response) return;

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(getApiUrl('/api/group-study/evaluate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId, classmate2Response }),
      });

      const data = await response.json();
      setEvaluation(data);
      setSession({ ...session, phase: 'evaluation' });
      fetchHistory();
      fetchProgress();
    } catch (error) {
      console.error('Failed to evaluate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    setSession(null);
    setStudentAnswer('');
    setClassmate1Message(null);
    setClassmate2Message(null);
    setClassmate1Response('');
    setClassmate2Response('');
    setEvaluation(null);
    stopAudio();
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6 flex items-center justify-center">
        <div className="bg-surface rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-gray-700">
          <LogIn className="mx-auto mb-4 text-primary" size={48} />
          <h2 className="text-2xl font-bold mb-4 text-white">Login Required</h2>
          <p className="text-gray-300 mb-6">
            Please create an account or login to use Group Study Simulator
          </p>
          <a
            href="/login"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2 sm:gap-3">
            <Users className="text-primary" size={32} />
            <span className="hidden sm:inline">Group Study Simulator</span>
            <span className="sm:hidden">Group Study</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-300">Practice defending your answers with AI study buddies</p>
        </div>

        {progress && (
          <div className="bg-surface rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-white">
              <TrendingUp size={18} className="text-primary" />
              Your Progress
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-primary">{progress.sessionsCount}</p>
                <p className="text-xs sm:text-sm text-gray-400">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-500">{progress.avgScore.toFixed(1)}/5</p>
                <p className="text-xs sm:text-sm text-gray-400">Avg Score</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-purple-400">{progress.currentLevel}</p>
                <p className="text-xs sm:text-sm text-gray-400">Level</p>
              </div>
            </div>
          </div>
        )}

        {!session ? (
          <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 border border-gray-700">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-white">Start New Session</h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 bg-background border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary text-white text-sm sm:text-base"
                >
                  <option value="English">English</option>
                  <option value="Science">Science</option>
                  <option value="Math">Math</option>
                  <option value="SST">Social Studies</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, Linear Equations"
                  className="w-full px-3 sm:px-4 py-2 bg-background border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500 text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    First Study Buddy
                  </label>
                  <input
                    type="text"
                    value={classmate1Name}
                    onChange={(e) => setClassmate1Name(e.target.value)}
                    placeholder="e.g., Rohan, Alex"
                    className="w-full px-3 sm:px-4 py-2 bg-background border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Second Study Buddy
                  </label>
                  <input
                    type="text"
                    value={classmate2Name}
                    onChange={(e) => setClassmate2Name(e.target.value)}
                    placeholder="e.g., Priya, Maya"
                    className="w-full px-3 sm:px-4 py-2 bg-background border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              <button
                onClick={startSession}
                disabled={isLoading || !topic || !classmate1Name || !classmate2Name}
                className="w-full bg-primary text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
              >
                <Play size={18} />
                {isLoading ? 'Starting...' : 'Start Discussion'}
              </button>
            </div>
          </div>
        ) : session.phase === 'evaluation' && evaluation ? (
          <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 border border-gray-700">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center gap-2 text-white">
              <Award className="text-yellow-500" size={24} />
              Session Complete!
            </h2>

            <div className="mb-4 sm:mb-6">
              <div className="text-center mb-4">
                <p className="text-xs sm:text-sm text-gray-400 mb-2">Handling Score</p>
                <p className="text-4xl sm:text-5xl font-bold text-primary">{evaluation.handlingScore}/5</p>
              </div>

              {evaluation.badge && (
                <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 sm:p-4 mb-4 text-center">
                  <Award className="mx-auto mb-2 text-yellow-500" size={28} />
                  <p className="font-semibold text-yellow-400 text-sm sm:text-base">🎉 Badge Earned: {evaluation.badge}</p>
                </div>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div>
                <h3 className="font-semibold text-green-400 mb-2 text-sm sm:text-base">💪 Strengths</h3>
                <ul className="list-disc list-inside space-y-1">
                  {evaluation.strengths.map((strength, i) => (
                    <li key={i} className="text-gray-300 text-xs sm:text-sm">{strength}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-orange-400 mb-2 text-sm sm:text-base">📈 Areas to Improve</h3>
                <ul className="list-disc list-inside space-y-1">
                  {evaluation.improvements.map((improvement, i) => (
                    <li key={i} className="text-gray-300 text-xs sm:text-sm">{improvement}</li>
                  ))}
                </ul>
              </div>

              {evaluation.tips && evaluation.tips.length > 0 && (
                <div>
                  <h3 className="font-semibold text-blue-400 mb-2 text-sm sm:text-base">💡 Tips</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {evaluation.tips.map((tip, i) => (
                      <li key={i} className="text-gray-300 text-xs sm:text-sm">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={resetSession}
              className="w-full bg-primary text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base font-medium"
            >
              Start New Session
            </button>
          </div>
        ) : (
          <div className="bg-surface rounded-xl shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 border border-gray-700">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">{session.topic}</h3>
              <p className="text-sm sm:text-base text-gray-400">{session.subject}</p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {session.phase === 'initial-answer' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Your Answer
                  </label>
                  <textarea
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500 h-28 sm:h-32 text-sm sm:text-base"
                  />
                  <button
                    onClick={submitAnswer}
                    disabled={isLoading || !studentAnswer}
                    className="mt-3 sm:mt-4 w-full bg-primary text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm sm:text-base font-medium"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Answer'}
                  </button>
                </div>
              )}

              {classmate1Message && (
                <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <MessageCircle className="text-blue-400 mt-1 flex-shrink-0" size={18} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="font-semibold text-blue-300 text-sm sm:text-base truncate">{classmate1Message.speakerName}</p>
                        <button
                          onClick={() => playAudio(classmate1Message.message, 'questioner')}
                          disabled={isPlayingAudio}
                          className="text-blue-400 hover:text-blue-300 disabled:opacity-50 flex-shrink-0"
                          title="Play audio"
                        >
                          {isPlayingAudio ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{classmate1Message.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {session.phase === 'classmate1-question' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Your Response to {session.classmate1Name}
                  </label>
                  <textarea
                    value={classmate1Response}
                    onChange={(e) => setClassmate1Response(e.target.value)}
                    placeholder="Respond to the question..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500 h-28 sm:h-32 text-sm sm:text-base"
                  />
                  <button
                    onClick={submitClassmate1Response}
                    disabled={isLoading || !classmate1Response}
                    className="mt-3 sm:mt-4 w-full bg-primary text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm sm:text-base font-medium"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Response'}
                  </button>
                </div>
              )}

              {classmate2Message && (
                <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <MessageCircle className="text-purple-400 mt-1 flex-shrink-0" size={18} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="font-semibold text-purple-300 text-sm sm:text-base truncate">{classmate2Message.speakerName}</p>
                        <button
                          onClick={() => playAudio(classmate2Message.message, 'challenger')}
                          disabled={isPlayingAudio}
                          className="text-purple-400 hover:text-purple-300 disabled:opacity-50 flex-shrink-0"
                          title="Play audio"
                        >
                          {isPlayingAudio ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{classmate2Message.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {session.phase === 'classmate2-counter' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Your Response to {session.classmate2Name}
                  </label>
                  <textarea
                    value={classmate2Response}
                    onChange={(e) => setClassmate2Response(e.target.value)}
                    placeholder="Defend your answer or acknowledge their point..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-gray-500 h-28 sm:h-32 text-sm sm:text-base"
                  />
                  <button
                    onClick={submitClassmate2Response}
                    disabled={isLoading || !classmate2Response}
                    className="mt-3 sm:mt-4 w-full bg-primary text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm sm:text-base font-medium"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Response'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-surface rounded-xl shadow-md p-4 sm:p-6 border border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Recent Sessions</h3>
            <div className="space-y-3">
              {history.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-start sm:items-center gap-3 border-b border-gray-700 pb-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white text-sm sm:text-base truncate">{item.topic}</p>
                    <p className="text-xs sm:text-sm text-gray-400">{item.subject} • {item.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-primary text-sm sm:text-base">{item.score}/5</p>
                    <p className="text-xs text-gray-500">{item.challenges} challenges</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupStudyPage;
