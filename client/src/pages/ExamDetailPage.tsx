import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react';
import AnnotatedExamViewer from '../components/AnnotatedExamViewer';

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
  annotations?: string;
  imageDimensions?: string;
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
  const { token, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete exam');
      }

      navigate('/history');
    } catch (err: any) {
      alert(err.message || 'Failed to delete exam');
    }
  };

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('Waiting for auth to load...');
      return;
    }

    console.log('ExamDetailPage - token:', token ? 'exists' : 'missing', 'id:', id);
    if (!token || !id) {
      console.log('Redirecting to login - token:', !!token, 'id:', !!id);
      navigate('/login');
      return;
    }

    fetchExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id, authLoading]);

  const fetchExam = async () => {
    try {
      const response = await fetch(`/api/exams/${id}`, {
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

  // Parse annotations if available
  const annotations = exam.annotations ? JSON.parse(exam.annotations) : null;
  const imageDimensions = exam.imageDimensions ? JSON.parse(exam.imageDimensions) : null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Back to History
          </button>
          
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>

        {/* Show annotated exam viewer if we have annotations */}
        {annotations && exam.answerSheetUrl && (
          <div className="mb-6">
            <AnnotatedExamViewer
              imageUrl={`/${exam.answerSheetUrl}`}
              gradingResult={{
                subject: exam.subject,
                language: exam.language,
                gradeLevel: exam.gradeLevel,
                totalScore: exam.totalScore,
                feedback: exam.feedback,
                annotations: annotations,
                imageDimensions: imageDimensions,
                detailedAnalysis: exam.answers.map((a: any) => ({
                  id: a.questionNumber,
                  question: exam.questionPaper?.questions.find((q: any) => q.questionNumber === a.questionNumber)?.questionText || `Question ${a.questionNumber}`,
                  studentAnswer: a.studentAnswer || 'Not attempted',
                  correct: a.correct,
                  score: a.score,
                  remarks: a.remarks,
                  position: a.positionX && a.positionY ? { x: a.positionX, y: a.positionY } : undefined
                }))
              }}
              onAnnotationClick={() => {}}
            />
          </div>
        )}

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
