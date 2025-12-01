import { ArrowRight, SkipForward, CheckCircle } from 'lucide-react';

interface WorksheetNavigatorProps {
  worksheetId: string;
  currentQuestionNumber: number;
  totalQuestions: number;
  onNext: () => void;
  onSkip: () => void;
  onComplete?: () => void;
  loading?: boolean;
}

export default function WorksheetNavigator({
  currentQuestionNumber,
  totalQuestions,
  onNext,
  onSkip,
  onComplete,
  loading = false,
}: WorksheetNavigatorProps) {
  const isLastQuestion = currentQuestionNumber >= totalQuestions;
  const progress = (currentQuestionNumber / totalQuestions) * 100;

  const handleNext = () => {
    if (isLastQuestion && onComplete) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <div className="bg-surface rounded-lg p-6 border border-gray-800">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm font-medium text-gray-300">
            Question {currentQuestionNumber} of {totalQuestions}
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      {!isLastQuestion ? (
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipForward className="w-4 h-4" />
            Skip Question
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Next Question
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            Worksheet Complete!
          </h3>
          <p className="text-gray-400 mb-4">
            You've completed all {totalQuestions} questions in this worksheet.
          </p>
          {onComplete && (
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Summary
            </button>
          )}
        </div>
      )}

      {/* Question Counter */}
      <div className="mt-4 flex justify-center gap-1">
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => (
          <div
            key={num}
            className={`w-2 h-2 rounded-full transition-colors ${
              num < currentQuestionNumber
                ? 'bg-green-500'
                : num === currentQuestionNumber
                ? 'bg-primary'
                : 'bg-gray-700'
            }`}
            title={`Question ${num}`}
          />
        ))}
      </div>
    </div>
  );
}
