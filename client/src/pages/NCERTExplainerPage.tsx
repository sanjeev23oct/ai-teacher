import React, { useState, useEffect } from 'react';
import { BookOpen, LogIn, History, TrendingUp, Award } from 'lucide-react';
import { getApiUrl } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/api';
import AudioPlayer from '../components/AudioPlayer';
import FormattedContent from '../components/FormattedContent';

interface ChapterInfo {
  id: string;
  name: string;
  bookName: string;
  chapterNumber: number;
}

interface ChapterResponse {
  chapterId: string;
  chapterName: string;
  summary: string;
  audioUrl: string;
  audioMetadata: {
    source: 'cache' | 'elevenlabs';
    cacheKey: string;
    timestamp: string;
  };
  duration: number;
}

interface FollowUpResponse {
  questions: Array<{
    id: string;
    question: string;
    answer: string;
    audioUrl: string;
    audioMetadata: {
      source: 'cache' | 'elevenlabs';
      cacheKey: string;
      timestamp: string;
    };
  }>;
}

interface StudyRecord {
  chapterId: string;
  chapterName: string;
  className: string;
  subject: string;
  studiedAt: string;
  followUpCount: number;
}

interface Progress {
  totalChapters: number;
  englishCount: number;
  scienceCount: number;
  mathCount: number;
  sstCount: number;
  completionBadges: string[];
  lastStudied: string;
}

const NCERTExplainerPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  
  // Load subject from localStorage or default to English
  const [selectedSubject, setSelectedSubject] = useState(() => {
    return localStorage.getItem('ncert_preferred_subject') || 'English';
  });
  
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [chapterSummary, setChapterSummary] = useState<ChapterResponse | null>(null);
  const [followUps, setFollowUps] = useState<FollowUpResponse | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [history, setHistory] = useState<StudyRecord[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Save subject to localStorage when it changes
  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    localStorage.setItem('ncert_preferred_subject', subject);
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
      fetchProgress();
    }
  }, [user]);

  useEffect(() => {
    fetchChapters();
  }, [user?.grade, selectedSubject]);

  const fetchChapters = async () => {
    if (!user?.grade || !selectedSubject) return;
    try {
      const response = await fetch(getApiUrl(`/api/ncert-explainer/chapters?class=${user.grade}&subject=${selectedSubject}`));
      if (response.ok) {
        const data = await response.json();
        setChapters(data.chapters || []);
        setSelectedChapter('');
        setChapterSummary(null);
        setFollowUps(null);
      }
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/api/ncert-explainer/history'));
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/api/ncert-explainer/progress'));
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const getChapterSummary = async () => {
    if (!selectedChapter) return;

    if (!user) {
      alert('Please login or create an account to use NCERT Explainer');
      window.location.href = '/login?redirect=/ncert-explainer';
      return;
    }

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(getApiUrl('/api/ncert-explainer/chapter-summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class: user?.grade,
          subject: selectedSubject,
          chapterId: selectedChapter,
          languageCode: 'en',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get chapter summary' }));
        if (response.status === 401) {
          alert(errorData.message || 'Please login to use NCERT Explainer');
          window.location.href = '/login?redirect=/ncert-explainer';
          return;
        }
        throw new Error(errorData.message || errorData.error || 'Failed to get chapter summary');
      }

      const data = await response.json();
      setChapterSummary(data);
      setFollowUps(null);
      setExpandedQuestion(null);
      
      // Refresh progress after studying
      fetchProgress();
    } catch (error: any) {
      console.error('Failed to get chapter summary:', error);
      alert(error.message || 'Failed to get chapter summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFollowUpQuestions = async () => {
    if (!chapterSummary) return;

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(getApiUrl('/api/ncert-explainer/follow-up'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class: user?.grade,
          subject: selectedSubject,
          chapterId: chapterSummary.chapterId,
          languageCode: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get follow-up questions');
      }

      const data = await response.json();
      setFollowUps(data);
      
      // Refresh history after follow-ups
      fetchHistory();
    } catch (error) {
      console.error('Failed to get follow-up questions:', error);
      alert('Failed to get follow-up questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  const resetSession = () => {
    setChapterSummary(null);
    setFollowUps(null);
    setExpandedQuestion(null);
    setSelectedChapter('');
  };

  const getBadgeName = (badgeId: string): string => {
    const badgeNames: Record<string, string> = {
      english_master: 'English Master',
      science_explorer: 'Science Explorer',
      math_genius: 'Math Genius',
      sst_scholar: 'SST Scholar',
      knowledge_seeker: 'Knowledge Seeker',
    };
    return badgeNames[badgeId] || badgeId;
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
          <BookOpen className="w-8 h-8 text-purple-500" />
          NCERT Chapter Explainer
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Understand NCERT chapters with AI-powered summaries
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
                Please create an account or login to use NCERT Explainer. We save your progress, track your learning journey, and provide personalized insights.
              </p>
              <div className="flex gap-3">
                <a
                  href="/login?redirect=/ncert-explainer"
                  className="px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm transition-all"
                >
                  Login
                </a>
                <a
                  href="/signup?redirect=/ncert-explainer"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-all"
                >
                  Create Account
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      {user && progress && (
        <div className="bg-surface rounded-lg border border-gray-800 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Your Progress
            </h3>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-primary hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <History size={14} />
              {showHistory ? 'Hide' : 'Show'} History
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{progress.totalChapters}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-blue-400">{progress.englishCount}</p>
              <p className="text-xs text-gray-400">English</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-400">{progress.scienceCount}</p>
              <p className="text-xs text-gray-400">Science</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-purple-400">{progress.mathCount}</p>
              <p className="text-xs text-gray-400">Math</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-orange-400">{progress.sstCount}</p>
              <p className="text-xs text-gray-400">SST</p>
            </div>
          </div>

          {progress.completionBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700">
              {progress.completionBadges.map((badgeId) => (
                <div
                  key={badgeId}
                  className="flex items-center gap-1 px-2 py-1 bg-yellow-900/30 border border-yellow-700/50 rounded text-xs text-yellow-400"
                >
                  <Award size={12} />
                  <span>{getBadgeName(badgeId)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent History */}
      {user && showHistory && history.length > 0 && (
        <div className="bg-surface rounded-lg border border-gray-800 p-4 mb-4">
          <h3 className="text-sm font-semibold text-white mb-3">Recent Chapters:</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.slice(0, 10).map((item, idx) => (
              <button
                key={idx}
                onClick={async () => {
                  // Just load the chapter from history
                  setSelectedSubject(item.subject);
                  setSelectedChapter(item.chapterId);
                  setShowHistory(false);
                  // Trigger chapter summary directly with stored values
                  setIsLoading(true);
                  try {
                    const response = await authenticatedFetch(getApiUrl('/api/ncert-explainer/chapter-summary'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        class: String(item.className),
                        subject: item.subject,
                        chapterId: item.chapterId,
                        languageCode: 'en',
                      }),
                    });

                    if (response.ok) {
                      const data = await response.json();
                      setChapterSummary(data);
                      setFollowUps(null);
                      setExpandedQuestion(null);
                    }
                  } catch (error) {
                    console.error('Failed to replay chapter:', error);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="w-full flex items-center justify-between py-2 border-b border-gray-700 last:border-0 hover:bg-gray-800 rounded px-2 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.chapterName}</p>
                  <p className="text-xs text-gray-400">
                    Class {item.className} • {item.subject} • {new Date(item.studiedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-xs text-primary ml-2 flex-shrink-0">
                  Replay →
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!chapterSummary ? (
        /* Chapter Selection */
        <div className="bg-surface rounded-lg border border-gray-800 p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Select Chapter</h2>
          
          <div className="space-y-3">
            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              >
                <option value="English">English</option>
                <option value="Science">Science</option>
                <option value="Math">Math</option>
                <option value="SST">SST (Social Studies)</option>
              </select>
            </div>

            {/* Chapter Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Chapter (Class {user?.grade} • {selectedSubject})
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              >
                <option value="">-- Select a chapter --</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    Ch {chapter.chapterNumber}: {chapter.name} ({chapter.bookName})
                  </option>
                ))}
              </select>
            </div>

            {/* Get Summary Button */}
            <button
              onClick={getChapterSummary}
              disabled={!selectedChapter || isLoading}
              className="w-full px-4 py-3 bg-primary hover:bg-blue-700 rounded text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <BookOpen size={18} />
              {isLoading ? 'Loading...' : 'Get Chapter Summary'}
            </button>
          </div>
        </div>
      ) : (
        /* Chapter Summary Display */
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-surface rounded-lg border border-gray-800 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white mb-1">{chapterSummary.chapterName}</h2>
                <p className="text-xs text-gray-400">
                  Class {user?.grade} • {selectedSubject}
                </p>
              </div>
              <button
                onClick={resetSession}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Change Chapter
              </button>
            </div>

            {/* Summary Content with Audio */}
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              {/* Audio Player Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-700">
                <AudioPlayer
                  audioEndpoint={`/api/ncert-explainer/chapter/${chapterSummary.chapterId}/audio`}
                  size="md"
                  method="GET"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-200">Chapter Summary Audio</h3>
                  <p className="text-xs text-gray-400">Click to listen to the chapter summary</p>
                </div>
              </div>
              
              {/* Summary Text */}
              <FormattedContent 
                content={chapterSummary.summary}
                className="text-sm"
              />
            </div>

            {/* Follow-up Questions Button */}
            {!followUps && (
              <button
                onClick={getFollowUpQuestions}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                {isLoading ? 'Loading Questions...' : 'Get Follow-up Questions'}
              </button>
            )}
          </div>

          {/* Follow-up Questions */}
          {followUps && followUps.questions.length > 0 && (
            <div className="bg-surface rounded-lg border border-gray-800 p-4">
              <h3 className="text-base font-semibold text-white mb-3">Follow-up Questions</h3>
              <div className="space-y-3">
                {followUps.questions.map((q) => (
                  <div key={q.id} className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleQuestion(q.id)}
                      className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-750 text-left transition-colors flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-white flex-1">{q.question}</span>
                      <span className="text-gray-400 text-xs flex-shrink-0">
                        {expandedQuestion === q.id ? '▼' : '▶'}
                      </span>
                    </button>
                    
                    {expandedQuestion === q.id && (
                      <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
                        {/* TODO: Add audio player when question audio endpoint is implemented */}
                        
                        <FormattedContent 
                          content={q.answer}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Start Over Button */}
              <button
                onClick={resetSession}
                className="w-full mt-4 px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm font-medium transition-all"
              >
                Study Another Chapter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NCERTExplainerPage;
