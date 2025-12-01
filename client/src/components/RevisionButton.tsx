import { useState } from 'react';
import { BookmarkPlus, BookmarkCheck } from 'lucide-react';

interface RevisionButtonProps {
  doubtId: string;
  isInRevision: boolean;
  onToggle: (doubtId: string) => Promise<void>;
}

export default function RevisionButton({
  doubtId,
  isInRevision: initialIsInRevision,
  onToggle,
}: RevisionButtonProps) {
  const [isInRevision, setIsInRevision] = useState(initialIsInRevision);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      // Optimistic update
      const newStatus = !isInRevision;
      setIsInRevision(newStatus);

      await onToggle(doubtId);

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      // Revert on error
      setIsInRevision(!isInRevision);
      console.error('Failed to toggle revision:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${
          isInRevision
            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
            : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${showSuccess ? 'scale-105' : 'scale-100'}
      `}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Updating...</span>
        </>
      ) : isInRevision ? (
        <>
          <BookmarkCheck className="w-4 h-4" />
          <span>Added to Revision</span>
        </>
      ) : (
        <>
          <BookmarkPlus className="w-4 h-4" />
          <span>Add to Revision</span>
        </>
      )}
    </button>
  );
}
