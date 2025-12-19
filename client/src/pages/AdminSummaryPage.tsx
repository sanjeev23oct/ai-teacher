import React, { useState, useEffect } from 'react';
import { BookOpen, Filter, BarChart3, CheckCircle, Circle, Shield } from 'lucide-react';
import { getApiUrl } from '../config';
import { authenticatedFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { isCurrentUserAdmin } from '../utils/admin';

interface ChapterCacheStatus {
  chapterId: string;
  chapterName: string;
  subject: string;
  class: string;
  cached: boolean;
  cacheId?: string;
  source?: 'manual' | 'llm' | 'import';
  lastUpdated?: string;
}

interface CacheStats {
  totalCached: number;
  manualEntries: number;
  llmGenerated: number;
  totalAccesses: number;
}

// Removed unused SummaryFormData interface since editing functionality was removed

// Simplified admin page - view only

const AdminSummaryPage: React.FC = () => {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<ChapterCacheStatus[]>([]);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Removed editing functionality for simplicity

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [cacheFilter, setCacheFilter] = useState<string>(''); // 'cached', 'not-cached', ''

  useEffect(() => {
    fetchChapters();
    fetchStats();
  }, [selectedSubject, selectedClass]);

  const fetchChapters = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubject) params.append('subject', selectedSubject);
      if (selectedClass) params.append('class', selectedClass);

      const response = await authenticatedFetch(
        getApiUrl(`/api/admin/content-cache/chapters?${params.toString()}`)
      );
      
      if (response.ok) {
        const data = await response.json();
        setChapters(data.chapters || []);
      }
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add delete function
  const deleteCachedContent = async (cacheId: string, chapterName: string) => {
    if (!window.confirm(`Are you sure you want to delete the cached content for "${chapterName}"? This will force regeneration of the content.`)) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        getApiUrl(`/api/admin/content-cache/${cacheId}`),
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        // Refresh the chapter list
        fetchChapters();
        alert('Cached content deleted successfully. Fresh content will be generated on next request.');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete cached content: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete cached content:', error);
      alert('Failed to delete cached content. Please try again.');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await authenticatedFetch(
        getApiUrl('/api/admin/content-cache/stats?module=ncert')
      );
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Simplified - no editing functionality for now

  const filteredChapters = chapters.filter(chapter => {
    if (cacheFilter === 'cached' && !chapter.cached) return false;
    if (cacheFilter === 'not-cached' && chapter.cached) return false;
    return true;
  });

  const groupedChapters = filteredChapters.reduce((acc, chapter) => {
    const key = `${chapter.subject} - Class ${chapter.class}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(chapter);
    return acc;
  }, {} as Record<string, ChapterCacheStatus[]>);

  // Check if user is admin
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-500 mb-2">Authentication Required</h3>
              <p className="text-gray-300">Please login to access admin features.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isCurrentUserAdmin(user.email)) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-500 mb-2">Admin Access Required</h3>
              <p className="text-gray-300 mb-4">
                You do not have permission to access admin features. Only authorized administrators can manage chapter summaries.
              </p>
              <p className="text-sm text-gray-400">
                If you believe you should have admin access, please contact your system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
          <BookOpen className="w-8 h-8 text-blue-500" />
          Admin: Chapter Summary Management
        </h1>
        <p className="text-gray-400">
          Manage cached chapter summaries and reduce LLM costs
        </p>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="bg-surface rounded-lg border border-gray-800 p-4 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-500" />
            Cache Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.totalCached}</p>
              <p className="text-sm text-gray-400">Total Cached</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.manualEntries}</p>
              <p className="text-sm text-gray-400">Manual Entries</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.llmGenerated}</p>
              <p className="text-sm text-gray-400">LLM Generated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{stats.totalAccesses}</p>
              <p className="text-sm text-gray-400">Total Accesses</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface rounded-lg border border-gray-800 p-4 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            >
              <option value="">All Subjects</option>
              <option value="English">English</option>
              <option value="Science">Science</option>
              <option value="Math">Math</option>
              <option value="SST">SST</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            >
              <option value="">All Classes</option>
              <option value="6">Class 6</option>
              <option value="7">Class 7</option>
              <option value="8">Class 8</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Cache Status</label>
            <select
              value={cacheFilter}
              onChange={(e) => setCacheFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            >
              <option value="">All Chapters</option>
              <option value="cached">Cached Only</option>
              <option value="not-cached">Not Cached Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading chapters...</div>
          </div>
        ) : Object.keys(groupedChapters).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400">No chapters found</div>
          </div>
        ) : (
          Object.entries(groupedChapters).map(([groupName, groupChapters]) => (
            <div key={groupName} className="bg-surface rounded-lg border border-gray-800 p-4">
              <h3 className="text-lg font-semibold text-white mb-4">{groupName}</h3>
              <div className="space-y-2">
                {groupChapters.map((chapter) => (
                  <div
                    key={chapter.chapterId}
                    className="flex items-center justify-between py-3 px-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {chapter.cached ? (
                        <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle size={20} className="text-gray-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{chapter.chapterName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>ID: {chapter.chapterId}</span>
                          {chapter.cached && (
                            <>
                              <span>Source: {chapter.source}</span>
                              {chapter.lastUpdated && (
                                <span>Updated: {new Date(chapter.lastUpdated).toLocaleDateString()}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {chapter.cached ? (
                        <>
                          <span className="text-green-400 text-sm">✓ Cached</span>
                          <button
                            onClick={() => deleteCachedContent(chapter.cacheId!, chapter.chapterName)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-500 text-sm">Not Cached</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Simplified admin page - no editing for now */}
    </div>
  );
};

export default AdminSummaryPage;
