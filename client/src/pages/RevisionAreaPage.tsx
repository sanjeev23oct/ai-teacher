import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookmarkX, Filter } from 'lucide-react';
import DashboardDoubtCard from '../components/DashboardDoubtCard';
import { authenticatedFetch } from '../utils/api';

export default function RevisionAreaPage() {
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [filteredDoubts, setFilteredDoubts] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevisionDoubts();
  }, []);

  useEffect(() => {
    filterDoubts();
  }, [doubts, selectedSubject, searchQuery]);

  const fetchRevisionDoubts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch('http://localhost:3001/api/revision/list');

      if (!response.ok) {
        throw new Error('Failed to fetch revision doubts');
      }

      const data = await response.json();
      setDoubts(data.doubts || []);

      // Extract unique subjects
      const uniqueSubjects = Array.from(
        new Set(data.doubts.map((d: any) => d.subject))
      ) as string[];
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error fetching revision doubts:', error);
      setError('Failed to load revision doubts');
    } finally {
      setLoading(false);
    }
  };

  const filterDoubts = () => {
    let filtered = doubts;

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter((d) => d.subject === selectedSubject);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.questionText.toLowerCase().includes(query) ||
          d.subject.toLowerCase().includes(query)
      );
    }

    setFilteredDoubts(filtered);
  };

  const handleRemoveFromRevision = async (doubtId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/revision/remove/${doubtId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove from revision');
      }

      // Remove from local state
      setDoubts((prev) => prev.filter((d) => d.id !== doubtId));
    } catch (error) {
      console.error('Error removing from revision:', error);
      alert('Failed to remove from revision');
    }
  };

  // Group doubts by subject
  const doubtsBySubject = filteredDoubts.reduce((acc, doubt) => {
    const subject = doubt.subject;
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(doubt);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading revision doubts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchRevisionDoubts}
            className="px-6 py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📚 Revision Area</h1>
          <p className="text-gray-400">
            Review and manage your saved doubts for better learning
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-surface rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doubts..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="pl-10 pr-8 py-2 bg-background border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-400">
            {filteredDoubts.length} {filteredDoubts.length === 1 ? 'doubt' : 'doubts'} in revision
          </div>
        </div>

        {/* Empty State */}
        {doubts.length === 0 && (
          <div className="bg-surface rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              No doubts in revision yet
            </h2>
            <p className="text-gray-400 mb-6">
              Start adding important doubts to your revision collection
            </p>
            <button
              onClick={() => navigate('/doubts')}
              className="px-6 py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Ask a Doubt
            </button>
          </div>
        )}

        {/* No Results */}
        {doubts.length > 0 && filteredDoubts.length === 0 && (
          <div className="bg-surface rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              No doubts found
            </h2>
            <p className="text-gray-400 mb-6">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('all');
              }}
              className="px-6 py-3 bg-gray-800 rounded-lg text-white font-medium hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Doubts by Subject */}
        {filteredDoubts.length > 0 && (
          <div className="space-y-8">
            {Object.entries(doubtsBySubject).map(([subject, subjectDoubts]) => (
              <div key={subject}>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  {subject}
                  <span className="text-sm text-gray-500 font-normal">
                    ({(subjectDoubts as any[]).length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {(subjectDoubts as any[]).map((doubt: any) => (
                    <div key={doubt.id} className="relative group">
                      <DashboardDoubtCard doubt={doubt} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromRevision(doubt.id);
                        }}
                        className="absolute top-4 right-4 p-2 bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/30"
                        title="Remove from revision"
                      >
                        <BookmarkX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
