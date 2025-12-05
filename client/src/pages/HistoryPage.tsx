import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Clock, BookOpen, TrendingUp } from 'lucide-react';

interface Exam {
  id: string;
  date: string;
  subject: string;
  language: string;
  gradeLevel: string;
  totalScore: string;
  questionPaperId?: string;
  questionPaperTitle?: string;
  mode: string;
}

interface Stats {
  totalExams: number;
  averageScore: number;
  bySubject: Record<string, { count: number; avgScore: number }>;
  recentExams: Array<{ id: string; date: string; subject: string; totalScore: string }>;
}

export default function HistoryPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async (examId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete exam');
      }

      // Refresh the list
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete exam');
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    try {
      const [historyRes, statsRes] = await Promise.all([
        fetch('/api/exams/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/exams/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!historyRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const historyData = await historyRes.json();
      const statsData = await statsRes.json();

      setExams(historyData.exams);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load exam history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Exam History</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="text-primary" size={24} />
                <h3 className="text-gray-400 text-sm">Total Exams</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalExams}</p>
            </div>

            <div className="bg-surface rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-green-500" size={24} />
                <h3 className="text-gray-400 text-sm">Average Score</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.averageScore.toFixed(1)}%</p>
            </div>

            <div className="bg-surface rounded-lg p-6">
              <h3 className="text-gray-400 text-sm mb-3">By Subject</h3>
              <div className="space-y-2">
                {Object.entries(stats.bySubject).map(([subject, data]) => (
                  <div key={subject} className="flex justify-between items-center">
                    <span className="text-white text-sm">{subject}</span>
                    <span className="text-gray-400 text-sm">
                      {data.avgScore.toFixed(1)}% ({data.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Exam List */}
        <div className="bg-surface rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">All Exams</h2>
          </div>

          {exams.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-4">No exams yet</p>
              <button
                onClick={() => navigate('/grade')}
                className="btn-primary"
              >
                Grade Your First Exam
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => navigate(`/exams/${exam.id}`)}
                  className="p-6 hover:bg-background/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {exam.subject}
                        </h3>
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                          {exam.mode}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(exam.date)}
                        </span>
                        <span>{exam.language}</span>
                        <span>{exam.gradeLevel}</span>
                      </div>
                      {exam.questionPaperTitle && (
                        <p className="text-sm text-gray-500 mt-1">
                          {exam.questionPaperTitle}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {exam.totalScore}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(exam.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                        title="Delete exam"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
