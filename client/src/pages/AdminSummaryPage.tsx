import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Filter, BarChart3, CheckCircle, Circle, Shield } from 'lucide-react';
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

interface SummaryFormData {
  chapterId: string;
  chapterName: string;
  content: string;
  title: string;
  subject: string;
  class: string;
}

const AdminSummaryPage: React.FC = () => {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<ChapterCacheStatus[]>([]);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterCacheStatus | null>(null);
  const [formData, setFormData] = useState<SummaryFormData>({
    chapterId: '',
    chapterName: '',
    content: '',
    title: '',
    subject: '',
    class: '',
  });

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

  const openAddModal = (chapter: ChapterCacheStatus) => {
    setEditingChapter(chapter);
    setFormData({
      chapterId: chapter.chapterId,
      chapterName: chapter.chapterName,
      content: '',
      title: chapter.chapterName,
      subject: chapter.subject,
      class: chapter.class,
    });
    setShowModal(true);
  };

  const openEditModal = async (chapter: ChapterCacheStatus) => {
    if (!chapter.cacheId) return;
    
    setEditingChapter(chapter);
    // TODO: Fetch existing content
    setFormData({
      chapterId: chapter.chapterId,
      chapterName: chapter.chapterName,
      content: '', // Would fetch from API
      title: chapter.chapterName,
      subject: chapter.subject,
      class: chapter.class,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await authenticatedFetch(
        getApiUrl('/api/admin/content-cache'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setShowModal(false);
        fetchChapters();
        fetchStats();
        alert('Summary saved successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to save summary:', error);
      alert('Failed to save summary');
    }
  };

  const handleDelete = async (chapter: ChapterCacheStatus) => {
    if (!chapter.cacheId) return;
    
    if (!confirm(`Delete cached summary for "${chapter.chapterName}"?`)) return;

    try {
      const response = await authenticatedFetch(
        getApiUrl(`/api/admin/content-cache/${chapter.cacheId}`),
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchChapters();
        fetchStats();
        alert('Summary deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete summary:', error);
      alert('Failed to delete summary');
    }
  };

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
                          <button
                            onClick={() => openEditModal(chapter)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                            title="Edit Summary"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(chapter)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                            title="Delete Summary"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openAddModal(chapter)}
                          className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                        >
                          <Plus size={14} />
                          Add Summary
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg border border-gray-800 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingChapter?.cached ? 'Edit' : 'Add'} Summary: {editingChapter?.chapterName}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                  placeholder="Leave empty to use chapter name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Summary Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                  rows={15}
                  placeholder="Paste your chapter summary here (from ChatGPT, etc.)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: You can copy summaries from ChatGPT, Claude, or other AI tools and paste them here.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Save Summary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSummaryPage;