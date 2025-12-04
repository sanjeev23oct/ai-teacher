import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import WorksheetNavigator from '../components/WorksheetNavigator';
import RevisionButton from '../components/RevisionButton';
import RatingWidget from '../components/RatingWidget';
import LatexRenderer from '../components/LatexRenderer';
import { authenticatedFetch } from '../utils/api';

interface WorksheetData {
  id: string;
  sessionId: string;
  totalQuestions: number;
  currentQuestion: number;
  imageUrl: string;
}

export default function WorksheetViewPage() {
  const { worksheetId } = useParams<{ worksheetId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [worksheet, setWorksheet] = useState<WorksheetData | null>(
    location.state?.worksheet || null
  );
  const [subject] = useState(location.state?.subject || 'Mathematics');
  const [language] = useState(location.state?.language || 'English');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [explanation, setExplanation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (worksheetId && !worksheet) {
      // Fetch worksheet data if not in state
      fetchWorksheet();
    }
  }, [worksheetId]);

  useEffect(() => {
    if (worksheet) {
      loadQuestion(currentQuestion);
    }
  }, [currentQuestion, worksheet]);

  const fetchWorksheet = async () => {
    try {
      const response = await authenticatedFetch(
        `http://localhost:3001/api/worksheets/${worksheetId}/progress`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch worksheet');
      }

      const data = await response.json();
      setWorksheet(data);
      setCurrentQuestion(data.currentQuestion);
    } catch (error) {
      console.error('Error fetching worksheet:', error);
      setError('Failed to load worksheet');
    }
  };

  const loadQuestion = async (questionNumber: number) => {
    if (!worksheet) return;

    setLoading(true);
    setError(null);

    try {
      // Check if question already has explanation cached
      // Skip cache check for now to force regeneration with correct question numbers
      const skipCache = true; // TODO: Remove this once AI properly targets questions
      
      if (!skipCache) {
        const questionResponse = await authenticatedFetch(
          `http://localhost:3001/api/worksheets/${worksheet.id}/question/${questionNumber}`
        );

        if (questionResponse.ok) {
          const questionData = await questionResponse.json();
          
          if (questionData.question.cachedExplanation) {
            // Use cached explanation
            setExplanation(JSON.parse(questionData.question.cachedExplanation));
            return;
          }
        }
      }

      // Generate new explanation
      const formData = new FormData();
      
      // Fetch the worksheet image
      const imageResponse = await fetch(`http://localhost:3001${worksheet.imageUrl}`);
      const imageBlob = await imageResponse.blob();
      
      formData.append('questionImage', imageBlob);
      formData.append('subject', subject);
      formData.append('language', language);
      formData.append('questionNumber', questionNumber.toString());
      formData.append('worksheetId', worksheet.id);

      const response = await authenticatedFetch('http://localhost:3001/api/doubts/explain', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to get explanation');
      }

      const data = await response.json();
      setExplanation(data);

      // Cache the explanation
      await authenticatedFetch(
        `http://localhost:3001/api/worksheets/${worksheet.id}/question/${questionNumber}/cache`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ explanation: data, doubtId: data.doubtId }),
        }
      ).catch(err => console.error('Failed to cache:', err));

    } catch (error) {
      console.error('Error loading question:', error);
      setError('Failed to load question explanation');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!worksheet) return;

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion <= worksheet.totalQuestions) {
      setCurrentQuestion(nextQuestion);
    }
  };

  const handleSkip = async () => {
    if (!worksheet) return;

    try {
      await authenticatedFetch(
        `http://localhost:3001/api/worksheets/${worksheet.id}/skip/${currentQuestion}`,
        {
          method: 'POST',
        }
      );

      const nextQuestion = currentQuestion + 1;
      if (nextQuestion <= worksheet.totalQuestions) {
        setCurrentQuestion(nextQuestion);
      }
    } catch (error) {
      console.error('Error skipping question:', error);
    }
  };

  const handleComplete = () => {
    navigate('/doubts/history');
  };

  const handleToggleRevision = async (doubtId: string) => {
    // Implementation similar to DoubtExplanationPage
    try {
      const response = await authenticatedFetch('http://localhost:3001/api/revision/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle revision');
      }
    } catch (error) {
      console.error('Error toggling revision:', error);
      throw error;
    }
  };

  const handleRate = async (rating: number) => {
    if (!explanation?.doubtId) return;

    try {
      const response = await authenticatedFetch('http://localhost:3001/api/ratings/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId: explanation.doubtId, rating }),
      });

      if (!response.ok) {
        throw new Error('Failed to rate doubt');
      }
    } catch (error) {
      console.error('Error rating doubt:', error);
      throw error;
    }
  };

  if (!worksheet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading worksheet...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/doubts')}
              className="p-2 hover:bg-background rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                Worksheet - {subject}
              </h1>
              <p className="text-sm text-gray-400">
                Question {currentQuestion} of {worksheet.totalQuestions}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="space-y-6">
          {/* Worksheet Image */}
          <div className="bg-surface rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Worksheet</h2>
            <img
              src={`http://localhost:3001${worksheet.imageUrl}`}
              alt="Worksheet"
              className="w-full rounded-lg"
            />
          </div>

          {/* Navigation */}
          <WorksheetNavigator
            worksheetId={worksheet.id}
            currentQuestionNumber={currentQuestion}
            totalQuestions={worksheet.totalQuestions}
            onNext={handleNext}
            onSkip={handleSkip}
            onComplete={handleComplete}
            loading={loading}
          />

          {/* Explanation */}
          {loading && (
            <div className="bg-surface rounded-lg p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-white text-lg">Generating explanation...</div>
            </div>
          )}

          {error && (
            <div className="bg-surface rounded-lg p-6 text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <p className="text-gray-400">{error}</p>
            </div>
          )}

          {explanation && !loading && (
            <>
              {/* Question Text */}
              <div className="bg-surface rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Question {currentQuestion}
                </h2>
                <p className="text-gray-300">{explanation.questionText}</p>
              </div>

              {/* What Question Asks */}
              <div className="bg-surface rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span>🎯</span> What the question is asking
                </h2>
                <LatexRenderer
                  content={explanation.whatQuestionAsks}
                  className="text-gray-300"
                />
              </div>

              {/* Steps */}
              <div className="bg-surface rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span>✨</span> Step-by-Step Solution
                </h2>
                <div className="space-y-4">
                  {explanation.steps.map((step: any) => (
                    <div
                      key={step.number}
                      className="border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                          <LatexRenderer
                            content={step.explanation}
                            className="text-gray-300 whitespace-pre-wrap"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Answer */}
              <div className="bg-surface rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span>🎉</span> Final Answer
                </h2>
                <LatexRenderer
                  content={explanation.finalAnswer}
                  className="text-lg text-green-400 font-semibold"
                />
              </div>

              {/* Revision and Rating */}
              {explanation.doubtId && (
                <div className="space-y-4">
                  <RevisionButton
                    doubtId={explanation.doubtId}
                    isInRevision={false}
                    onToggle={handleToggleRevision}
                  />
                  <RatingWidget
                    doubtId={explanation.doubtId}
                    currentRating={undefined}
                    onRate={handleRate}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
