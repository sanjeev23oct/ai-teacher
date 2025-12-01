import { Star, BookmarkCheck, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardDoubtCardProps {
  doubt: {
    id: string;
    questionText: string;
    subject: string;
    createdAt: string;
    rating?: number;
    isInRevision: boolean;
    messageCount?: number;
  };
}

export default function DashboardDoubtCard({ doubt }: DashboardDoubtCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/doubts/${doubt.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-surface border border-gray-800 rounded-lg p-4 hover:border-primary transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Subject Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded">
              {doubt.subject}
            </span>
            {doubt.isInRevision && (
              <BookmarkCheck className="w-4 h-4 text-green-400" title="In Revision" />
            )}
          </div>

          {/* Question Text */}
          <p className="text-gray-300 text-sm line-clamp-2 mb-2 group-hover:text-white transition-colors">
            {doubt.questionText}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{formatDate(doubt.createdAt)}</span>
            {doubt.messageCount !== undefined && doubt.messageCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {doubt.messageCount}
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        {doubt.rating && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">{doubt.rating}</span>
          </div>
        )}
      </div>
    </div>
  );
}
