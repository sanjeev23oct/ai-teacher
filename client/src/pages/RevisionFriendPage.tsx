import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Play, RotateCcw, Clock, CheckCircle, Volume2, BookmarkCheck, LogIn } from 'lucide-react';
import { getApiUrl } from '../config';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface QuizQuestion {
  question: string;
  correctAnswer: string;
}



interface RevisionSession {
  sessionId: string;
  topic: string;
  subject: string;
  phase: 'explanation' | 'repeat' | 'quiz' | 'drill' | 'complete';
  timeLeft: number;
  content?: string;
  hasAudio?: boolean;
  quizQuestions?: QuizQuestion[];
  currentQuestionIndex?: number;
  quizAnswers?: string[];
  quizReview?: string; // Conversational review from AI
  quizComplete?: boolean;
}

interface RevisionHistory {
  topic: string;
  subject: string;
  score: number;
  date: string;
  weakAreas: string[];
}

const RevisionFriendPage: React.FC = () => {
  const { languageCode } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('English');
  const [session, setSession] = useState<RevisionSession | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState<RevisionHistory[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Parse quiz questions from content
  const parseQuizQuestions = (content: string): QuizQuestion[] => {
    const questions: QuizQuestion[] = [];
    const lines = content.split('\n');
    
    let currentQ = '';
    let currentA = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^Q\d+:/)) {
        if (currentQ && currentA) {
          questions.push({ question: currentQ, correctAnswer: currentA });
        }
        currentQ = trimmed.replace(/^Q\d+:\s*/, '');
        currentA = '';
      } else if (trimmed.match(/^A\d+:/)) {
        currentA = trimmed.replace(/^A\d+:\s*/, '');
      }
    }
    
    if (currentQ && currentA) {
      questions.push({ question: currentQ, correctAnswer: currentA });
    }
    
    return questions;
  };

  useEffect(() => {
    fetchRevisionHistory();
    fetchSuggestions();
  }, []);

  // Auto-play audio when content changes (if enabled and not in quiz phase)
  useEffect(() => {
    if (autoPlayAudio && session?.content && session.hasAudio && session.phase !== 'quiz' && !isPlayingAudio) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        playAudio();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [session?.content, session?.phase]);

  useEffect(() => {
    if (session && isActive && session.timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setSession(prev => {
          if (!prev || prev.timeLeft <= 1) {
            // Don't auto-advance if audio is playing - let it finish
            if (!isPlayingAudio) {
              handlePhaseComplete();
            } else {
              // Pause timer, will resume when audio ends
              setIsActive(false);
            }
            return prev;
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session, isActive, isPlayingAudio]);

  const fetchRevisionHistory = async () => {
    try {
      const response = await fetch(getApiUrl('/api/revision-friend/history'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(getApiUrl('/api/revision-friend/suggestions'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  };

  const startRevision = async (revisionTopic?: string) => {
    const targetTopic = revisionTopic || topic;
    if (!targetTopic.trim()) return;

    // Check authentication
    if (!user) {
      alert('Please login or create an account to use Revision Friend');
      window.location.href = '/login?redirect=/revision-friend';
      return;
    }

    // Stop any playing audio from previous session
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/revision-friend/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic: targetTopic, subject, languageCode })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to start revision' }));
        if (response.status === 401) {
          alert(errorData.message || 'Please login to use Revision Friend');
          window.location.href = '/login?redirect=/revision-friend';
          return;
        }
        throw new Error(errorData.message || errorData.error || 'Failed to start revision');
      }

      const data = await response.json();
      
      setSession({
        sessionId: data.sessionId,
        topic: targetTopic,
        subject,
        phase: 'explanation',
        timeLeft: 60,
        content: data.content,
        hasAudio: data.hasAudio,
      });
      
      setIsActive(true);
      setTopic('');
    } catch (err) {
      console.error('Revision start error:', err);
      alert('Failed to start revision. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhaseComplete = async () => {
    if (!session) return;

    setIsActive(false);
    
    const nextPhases: Record<string, { phase: 'repeat' | 'quiz' | 'drill' | 'complete', time: number }> = {
      'explanation': { phase: 'repeat' as const, time: 30 },
      'repeat': { phase: 'quiz' as const, time: 60 },
      'quiz': { phase: 'drill' as const, time: 30 },
      'drill': { phase: 'complete' as const, time: 0 }
    };

    const next = nextPhases[session.phase];
    if (!next) return;
    
    if (next.phase === 'complete') {
      // Session complete
      setSession(prev => prev ? { ...prev, phase: 'complete' } : null);
      
      // Complete session on backend
      try {
        await fetch(getApiUrl('/api/revision-friend/complete'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            sessionId: session.sessionId,
            performance: {
              quizScore: 3, // Default score
              weakAreas: [],
              completedPhases: ['explanation', 'repeat', 'quiz', 'drill']
            }
          })
        });
      } catch (err) {
        console.error('Failed to complete session:', err);
      }
      
      fetchRevisionHistory();
      fetchSuggestions();
    } else {
      // Move to next phase
      try {
        const response = await fetch(getApiUrl('/api/revision-friend/next-phase'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            sessionId: session.sessionId,
            currentPhase: session.phase,
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Stop any playing audio when transitioning
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          setIsPlayingAudio(false);
          
          // Parse quiz questions if entering quiz phase
          const quizQuestions = next.phase === 'quiz' ? parseQuizQuestions(data.content) : undefined;
          
          setSession(prev => prev ? {
            ...prev,
            phase: next.phase,
            timeLeft: next.time,
            content: data.content,
            hasAudio: data.hasAudio,
            quizQuestions,
            currentQuestionIndex: next.phase === 'quiz' ? 0 : undefined,
            quizAnswers: next.phase === 'quiz' ? [] : undefined,
            quizResults: undefined,
            quizScore: undefined,
          } : null);
          
          // For quiz phase, pause timer until questions are answered
          if (next.phase === 'quiz') {
            setIsActive(false);
          } else if (next.time > 0) {
            setIsActive(true);
          }
        }
      } catch (err) {
        console.error('Phase transition error:', err);
      }
    }
  };

  const submitQuizAnswer = () => {
    if (!session || !currentAnswer.trim()) return;
    
    const answers = [...(session.quizAnswers || []), currentAnswer];
    const nextIndex = (session.currentQuestionIndex || 0) + 1;
    
    setSession(prev => prev ? {
      ...prev,
      quizAnswers: answers,
      currentQuestionIndex: nextIndex,
    } : null);
    
    setCurrentAnswer('');
    
    // If all questions answered, grade the quiz
    if (nextIndex >= (session.quizQuestions?.length || 0)) {
      gradeQuiz(answers);
    }
  };

  const gradeQuiz = async (answers: string[]) => {
    if (!session || !session.quizQuestions) return;
    
    setIsGrading(true);
    setIsActive(false);
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
    
    try {
      const response = await fetch(getApiUrl('/api/revision-friend/grade-quiz'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          answers,
          correctAnswers: session.quizQuestions.map(q => q.correctAnswer),
          topic: session.topic
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSession(prev => prev ? {
          ...prev,
          quizReview: data.conversationalReview,
          quizComplete: true,
        } : null);
      }
    } catch (err) {
      console.error('Quiz grading error:', err);
    } finally {
      setIsGrading(false);
    }
  };

  const playAudio = async () => {
    if (!session?.content || !session.hasAudio || isPlayingAudio) return;

    setIsPlayingAudio(true);
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Use streaming audio endpoint
      const response = await fetch(getApiUrl('/api/revision-friend/audio/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: session.content, languageCode })
      });

      if (!response.ok) {
        throw new Error('Failed to get audio stream');
      }

      // Create blob from response and play
      const audioBlob = await response.blob();
      const audioBlobUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioBlobUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioBlobUrl);
        
        // Auto-advance if timer is at 0
        if (session && session.timeLeft === 0) {
          handlePhaseComplete();
        }
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioBlobUrl);
      };
      
      await audio.play();
    } catch (err) {
      console.error('Audio play error:', err);
      setIsPlayingAudio(false);
    }
  };

  const resetSession = () => {
    setSession(null);
    setIsActive(false);
    setIsPlayingAudio(false);
    setCurrentAnswer('');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const getPhaseDescription = (phase: string) => {
    const descriptions = {
      explanation: 'Listen to explanation',
      repeat: 'Repeat key points',
      quiz: 'Answer questions',
      drill: 'Rapid fire drill',
      complete: 'Session complete!',
    };
    return descriptions[phase as keyof typeof descriptions] || phase;
  };

  const getPhaseIcon = (phase: string) => {
    const icons = {
      explanation: <BookOpen className="w-5 h-5" />,
      repeat: <RotateCcw className="w-5 h-5" />,
      quiz: <CheckCircle className="w-5 h-5" />,
      drill: <Play className="w-5 h-5" />,
      complete: <CheckCircle className="w-5 h-5 text-green-500" />,
    };
    return icons[phase as keyof typeof icons] || <Clock className="w-5 h-5" />;
  };

  const getNextPhaseName = (currentPhase: string) => {
    const nextPhases: Record<string, string> = {
      explanation: 'Start Repeat',
      repeat: 'Start Quiz',
      quiz: 'Start Rapid Fire',
      drill: 'Complete',
    };
    return nextPhases[currentPhase] || 'Next Phase';
  };

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <BookmarkCheck className="w-8 h-8" />
          Revision Friend
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          "Revise kara do" - Your 3-minute study buddy
        </p>
      </div>

      {/* Authentication Required Message */}
      {!authLoading && !user && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <LogIn className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-500 mb-2">Login Required</h3>
              <p className="text-gray-300 text-sm mb-4">
                Please create an account or login to use Revision Friend. We save your progress, track weak areas, and provide personalized suggestions.
              </p>
              <div className="flex gap-3">
                <a
                  href="/login?redirect=/revision-friend"
                  className="px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm transition-all"
                >
                  Login
                </a>
                <a
                  href="/signup?redirect=/revision-friend"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-all"
                >
                  Create Account
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {!session ? (
        <>
          {/* Start Revision */}
          <div className="bg-surface rounded-lg border border-gray-800 p-4 mb-4">
            <h2 className="text-lg font-semibold text-white mb-3">Start Quick Revision</h2>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                >
                  <option value="English">English</option>
                  <option value="Science">Science</option>
                  <option value="Math">Math</option>
                  <option value="SST">Social Studies</option>
                </select>
                
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., photosynthesis, Beehive Ch1..."
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm placeholder-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && startRevision()}
                />
                
                <button
                  onClick={() => startRevision()}
                  disabled={isLoading || !topic.trim()}
                  className="px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm transition-all disabled:opacity-50"
                >
                  {isLoading ? '...' : 'Start'}
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-surface rounded-lg border border-gray-800 p-4 mb-4">
              <h3 className="text-sm font-semibold text-white mb-2">Suggested Revisions:</h3>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const parts = suggestion.split('(');
                      const topicText = parts[0].trim();
                      startRevision(topicText);
                    }}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition-all disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent History */}
          {history.length > 0 && (
            <div className="bg-surface rounded-lg border border-gray-800 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Recent Revisions:</h3>
              <div className="space-y-2">
                {history.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <div>
                      <p className="text-sm text-white">{item.topic}</p>
                      <p className="text-xs text-gray-400">{item.subject} • {item.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-yellow-500">★{item.score}/5</span>
                      <button
                        onClick={() => startRevision(item.topic)}
                        disabled={isLoading}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-all disabled:opacity-50"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Active Session */
        <div className="bg-surface rounded-lg border border-gray-800 p-4">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-white mb-1">{session.topic}</h2>
            <p className="text-sm text-gray-400">{session.subject}</p>
          </div>

          {/* Phase Overview */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span className={session.phase === 'explanation' ? 'text-primary font-semibold' : ''}>
                1. Summary
              </span>
              <span className={session.phase === 'repeat' ? 'text-primary font-semibold' : ''}>
                2. Repeat
              </span>
              <span className={session.phase === 'quiz' ? 'text-primary font-semibold' : ''}>
                3. Quiz
              </span>
              <span className={session.phase === 'drill' ? 'text-primary font-semibold' : ''}>
                4. Rapid Fire
              </span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ 
                  width: session.phase === 'explanation' ? '25%' : 
                         session.phase === 'repeat' ? '50%' : 
                         session.phase === 'quiz' ? '75%' : 
                         session.phase === 'drill' ? '100%' : '100%' 
                }}
              />
            </div>
          </div>

          {/* Current Phase */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 text-sm">
              {getPhaseIcon(session.phase)}
              <span className="text-white font-semibold">{getPhaseDescription(session.phase)}</span>
            </div>
          </div>

          {/* Content Display */}
          {session.phase === 'quiz' && session.quizQuestions ? (
            /* Interactive Quiz */
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              {session.quizComplete && session.quizReview ? (
                /* Conversational Quiz Review */
                <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {session.quizReview}
                </div>
              ) : session.currentQuestionIndex !== undefined && session.currentQuestionIndex < session.quizQuestions.length ? (
                /* Current Question */
                <div>
                  <div className="mb-3">
                    <span className="text-xs text-gray-400">
                      Question {session.currentQuestionIndex + 1} of {session.quizQuestions.length}
                    </span>
                  </div>
                  <p className="text-white text-base mb-4">
                    {session.quizQuestions[session.currentQuestionIndex].question}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitQuizAnswer()}
                      placeholder="Type your answer..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                      disabled={isGrading}
                    />
                    <button
                      onClick={submitQuizAnswer}
                      disabled={!currentAnswer.trim() || isGrading}
                      className="px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm disabled:opacity-50"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              ) : isGrading ? (
                <div className="text-center text-gray-400">
                  <p>Grading your answers...</p>
                </div>
              ) : null}
            </div>
          ) : session.content && session.phase !== 'quiz' ? (
            /* Regular Content Display */
            <div className="bg-gray-900 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
              <div className="text-gray-300 text-sm whitespace-pre-wrap">
                {session.content}
              </div>
            </div>
          ) : null}

          {/* Timer */}
          {session.phase !== 'complete' && (
            <div className="text-center mb-4">
              <div className={`text-4xl font-bold ${
                session.timeLeft <= 10 ? 'text-red-500' : 'text-primary'
              }`}>
                {Math.floor(session.timeLeft / 60)}:{(session.timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isActive ? 'Running...' : 'Paused'}
              </p>
            </div>
          )}

          {/* Audio Controls */}
          {session.hasAudio && session.content && (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={playAudio}
                  disabled={isPlayingAudio}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  {isPlayingAudio ? 'Playing...' : 'Play Audio'}
                </button>
                <button
                  onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                  className={`px-3 py-2 rounded text-xs transition-all ${
                    autoPlayAudio 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                  title={autoPlayAudio ? 'Auto-play enabled' : 'Auto-play disabled'}
                >
                  Auto {autoPlayAudio ? '✓' : '✗'}
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            {session.phase !== 'complete' ? (
              <>
                {session.phase === 'quiz' && session.quizComplete ? (
                  /* Quiz completed, show next button */
                  <button
                    onClick={handlePhaseComplete}
                    className="px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm transition-all"
                  >
                    {getNextPhaseName(session.phase)}
                  </button>
                ) : session.phase === 'quiz' && !session.quizComplete ? (
                  /* Quiz in progress */
                  <div className="text-xs text-gray-400">
                    Answer all questions to continue
                  </div>
                ) : (
                  /* Normal phase controls - show skip and next phase buttons */
                  <>
                    <button
                      onClick={handlePhaseComplete}
                      className="px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm transition-all"
                    >
                      {getNextPhaseName(session.phase)}
                    </button>
                    <button
                      onClick={handlePhaseComplete}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-all"
                    >
                      Skip →
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="text-center">
                <p className="text-green-400 mb-2 text-lg">🎉 Revision Complete!</p>
                <button
                  onClick={resetSession}
                  className="px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm transition-all"
                >
                  Start New Revision
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionFriendPage;
