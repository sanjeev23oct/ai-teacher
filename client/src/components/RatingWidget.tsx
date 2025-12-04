import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingWidgetProps {
  doubtId: string;
  currentRating?: number;
  onRate: (rating: number) => Promise<void>;
}

export default function RatingWidget({
  doubtId: _doubtId,
  currentRating: initialRating,
  onRate,
}: RatingWidgetProps) {
  const [rating, setRating] = useState(initialRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRate = async (value: number) => {
    setLoading(true);
    try {
      setRating(value);
      await onRate(value);

      // Show confirmation
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } catch (error) {
      console.error('Failed to rate doubt:', error);
      // Revert on error
      setRating(initialRating || 0);
    } finally {
      setLoading(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="bg-surface rounded-lg p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">
          Rate this explanation
        </h3>
        {showConfirmation && (
          <span className="text-sm text-green-400 animate-fade-in">
            ✓ Rating saved
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => handleRate(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={loading}
            className="transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Rate ${value} stars`}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                value <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600 hover:text-gray-500'
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-gray-400">
            {rating} / 5
          </span>
        )}
      </div>

      {rating > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {rating === 5 && 'Excellent! Glad this helped.'}
          {rating === 4 && 'Great! Thanks for the feedback.'}
          {rating === 3 && 'Good. We\'ll keep improving.'}
          {rating === 2 && 'Thanks. We\'ll work on better explanations.'}
          {rating === 1 && 'Sorry this wasn\'t helpful. We\'ll do better.'}
        </p>
      )}
    </div>
  );
}
