import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react';

interface ExamDetail {
  id: string;
  createdAt: string;
  subject: string;
  language: string;
  gradeLevel: string;
  totalScore: string;
  feedback: string;
  answerSheetUrl: string;
  matchingMode: string;
  answers: Array<{
    id: string;
    questionNumber: string;
    studentAnswer: string | null;
    correct: boolean;
    score: string;
    remarks: string;
    positionX?: number;
    positionY?: number;
  }>;
  questionPaper?: {
    id: string;
    title: string;
    subject: string;
    questions: Array<{
      questionNumber: string;
      questionText: string;
      maxScore?: number;
    }>;
  };
}

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !id) {
      navigate('/login');
      return;
    }

    fetchExam();
  }, [token, id, navigate]);

  const fetchExam = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/exams/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exam');
      }

      const data = await response.json();
      setExam(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load exam');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
          {error || 'Exam not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to History
        </button>

        <div className="bg-surface rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{exam.subject}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(exam.createdAt)}
                </span>
                <span>{exam.language}</span>
                <span>{exam.gradeLevel}</span>
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                  {exam.matchingMode}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white">{exam.totalScore}</div>
            </div>
          </div>

          {exam.questionPaper && (
            <div className="mt-4 p-4 bg-background rounded-lg">
              <div className="flex items-center gap-2 text-gray-300 mb-2">
                <BookOpen size={16} />
                <span className="font-medium">Question Paper:</span>
                <span>{exam.questionPaper.title || exam.questionPaper.subject}</span>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-background rounded-lg">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Overall Feedback</h3>
            <p className="text-white">{exam.feedback}</p>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Detailed Analysis</h2>
          <div className="space-y-4">
            {exam.answers.map((answer) => {
              const question = exam.questionPaper?.questions.find(q => q.questionNumber === answer.questionNumber);
              return (
                <div key={answer.id} className="p-4 bg-background rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium text-white">
                      Question {answer.questionNumber}
                    </h3>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      answer.correct ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {answer.score}
                    </span>
                  </div>
                  
                  {question && (
                    <p className="text-gray-400 mb-2 text-sm">{question.questionText}</p>
                  )}
                  
                  <div className="mb-2">
                    <span className="text-gray-500 text-sm">Your Answer: </span>
                    <span className="text-white">{answer.studentAnswer || 'Not attempted'}</span>
                  </div>
                  
                  <div className="p-3 bg-surface rounded border-l-4 border-primary">
                    <span className="text-gray-500 text-sm">Feedback: </span>
                    <span className="text-gray-300">{answer.remarks}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
