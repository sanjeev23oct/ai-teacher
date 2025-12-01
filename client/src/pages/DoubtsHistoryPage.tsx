import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MessageCircle, ArrowLeft } from 'lucide-react';

import type { Subject } from '../components/SubjectSelector';

interface DoubtHistoryItem {
  id: string;
  questionThumbnail?: string;
  questionPreview: string;
  subject: Subject;
  language: string;
  timestamp: number;
  isFavorite: boolean;
  messageCount: number;
}

export default function DoubtsHistoryPage() {
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState<DoubtHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, [page, selectedSubject, searchQuery]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (selectedSubject !== 'all') {
        params.append('subject', selectedSubject);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`http://localhost:3001/api/doubts/history?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setDoubts(data.doubts);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const subjects: (Subject | 'all')[] = [
    'all',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Social Studies',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-background rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Doubt History</h1>
              <p className="text-sm text-gray-400">{total} doubts</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search doubts..."
              className="w-full pl-10 pr-4 py-3 bg-background border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex gap-2 overflow-x-auto mt-4 pb-2">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => {
                  setSelectedSubject(subject);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSubject === subject
                    ? 'bg-primary text-white'
                    : 'bg-background text-gray-400 hover:text-white'
                }`}
              >
                {subject === 'all' ? 'All Subjects' : subject}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-white">Loading...</div>
          </div>
        ) : doubts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No doubts found</p>
            <button
              onClick={() => navigate('/doubts')}
              className="px-6 py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Ask Your First Doubt
            </button>
          </div>
        ) : (
          <>
            {/* Doubts List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doubts.map((doubt) => (
                <div
                  key={doubt.id}
                  onClick={() => navigate(`/doubts/${doubt.id}`)}
                  className="bg-surface rounded-lg p-4 hover:border-primary border-2 border-transparent transition-all cursor-pointer"
                >
                  <div className="flex gap-4">
                    {doubt.questionThumbnail && (
                      <img
                        src={`http://localhost:3001${doubt.questionThumbnail}`}
                        alt="Question"
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-medium line-clamp-2">
                            {doubt.questionPreview}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">{doubt.subject}</span>
                            <span className="text-xs text-gray-600">•</span>
                            <span className="text-xs text-gray-400">{doubt.language}</span>
                          </div>
                        </div>
                        {doubt.isFavorite && (
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(doubt.timestamp)}
                        </span>
                        {doubt.messageCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <MessageCircle className="w-3 h-3" />
                            <span>{doubt.messageCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-surface rounded-lg text-white hover:bg-surface/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-white">
                  Page {page} of {Math.ceil(total / 20)}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / 20)}
                  className="px-4 py-2 bg-surface rounded-lg text-white hover:bg-surface/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
