import React, { useState, useEffect } from 'react';
import { BookOpen, Filter, BarChart3, CheckCircle, Circle, Shield, Eye, Edit3, X, Copy, FileText, Sparkles, Download } from 'lucide-react';
import { getApiUrl } from '../config';
import { authenticatedFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { isCurrentUserAdmin } from '../utils/admin';
import FormattedContent from '../components/FormattedContent';

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

// Add interface for cached content
interface CachedContent {
  id: string;
  content: string;
  title?: string;
  source: 'manual' | 'llm' | 'import';
  accessCount: number;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

// Simplified admin page - view only

const AdminSummaryPage: React.FC = () => {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<ChapterCacheStatus[]>([]);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // View/Edit state
  const [viewContent, setViewContent] = useState<CachedContent | null>(null);
  const [editMode, setEditMode] = useState<'view' | 'edit'>('view');
  const [rawContent, setRawContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');

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

  // Add function to view cached content
  const viewCachedContent = async (cacheId: string) => {
    try {
      const response = await authenticatedFetch(
        getApiUrl(`/api/admin/content-cache/${cacheId}`)
      );

      if (response.ok) {
        const data = await response.json();
        setViewContent(data.content);
        setRawContent(data.content.content);
        setContentTitle(data.content.title || '');
        setEditMode('view');
      } else {
        const errorData = await response.json();
        alert(`Failed to fetch cached content: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to fetch cached content:', error);
      alert('Failed to fetch cached content. Please try again.');
    }
  };

  // Add function to update cached content
  const updateCachedContent = async () => {
    if (!viewContent) return;

    // Clean the content before saving
    const cleanedContent = cleanExternalContent(rawContent);

    try {
      const response = await authenticatedFetch(
        getApiUrl(`/api/admin/content-cache/${viewContent.id}`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: cleanedContent,
            title: contentTitle,
          }),
        }
      );

      if (response.ok) {
        alert('Content updated successfully!');
        // Refresh the chapter list
        fetchChapters();
        // Close the modal
        setViewContent(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to update content: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update cached content:', error);
      alert('Failed to update content. Please try again.');
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

  // Add state for creating new content
  const [creatingContent, setCreatingContent] = useState<{
    chapterId: string;
    chapterName: string;
    subject: string;
    class: string;
  } | null>(null);
  const [newContent, setNewContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [contentPreview, setContentPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Content templates for different subjects
  const getContentTemplate = (subject: string, chapterName: string, className: string) => {
    const templates = {
      English: `# Class ${className} ${subject} Chapter: ${chapterName}

## 📖 Story/Chapter Overview
- [Main plot/storyline in 2-3 lines]
- [Setting and time period]
- [Central conflict or problem]
- [Key turning points in the story]
- [Resolution and conclusion]
- [Author background if relevant for CBSE exams]

## 🎭 Character Analysis (CBSE Important)
- [Character Name]: 
  - [Plain trait]: [Plain example]
  - [Plain trait]: [Plain example]
  - [Plain growth]: [Plain description]
  - [Plain role]: [Plain significance]
  - [Plain relationships]: [Plain details]
- [Supporting Character]: [Plain description]
- [Supporting Character]: [Plain description]

## 🎯 Key Themes (Board Exam Focus)
- [Plain theme]: [Plain explanation]
- [Plain theme]: [Plain analysis]
- [Plain theme]: [Plain description]
- [Plain theme]: [Plain analysis]

## 📝 Important Events & Timeline
- Event 1: [Plain description]
- Event 2: [Plain description]
- Event 3: [Plain description]
- Event 4: [Plain description]
- Event 5: [Plain description]
- Event 6: [Plain description]

## 🎨 Literary Devices (CBSE Syllabus)
- [Plain device]: [Plain examples]
- [Plain device]: [Plain examples]
- [Plain device]: [Plain examples]

## 💡 CBSE Exam Important Points
- [Plain point 1]
- [Plain point 2]
- [Plain point 3]
- [Plain quote 1]
- [Plain quote 2]
- [Plain comparison]
- [Plain moral]
- [Plain devices]

## 📚 Values & Life Lessons (CBSE Focus)
- [Plain value 1]: [Plain explanation]
- [Plain value 2]: [Plain explanation]
- [Plain value 3]: [Plain explanation]
- [Plain value 4]: [Plain explanation]
- [Plain relevance]: [Plain explanation]

## 🎓 Board Exam Question Types
- [Plain type 1]: [Plain description]
- [Plain type 2]: [Plain description]
- [Plain type 3]: [Plain description]
- [Plain type 4]: [Plain description]
- [Plain type 5]: [Plain description]`,

      Science: `# Class ${className} ${subject} Chapter: ${chapterName}

## 🔬 Chapter Overview
[Brief introduction to the scientific concepts covered]

## 🧪 Key Concepts
### Concept 1
[Detailed explanation]

### Concept 2
[Detailed explanation]

### Concept 3
[Detailed explanation]

## ⚗️ Important Definitions
- **Term 1**: [Definition]
- **Term 2**: [Definition]
- **Term 3**: [Definition]

## 🔍 Experiments & Activities
1. **Experiment 1**: [Description and learning outcome]
2. **Experiment 2**: [Description and learning outcome]

## 📊 Formulas & Equations
- [Formula 1]: [Explanation]
- [Formula 2]: [Explanation]

## 🎯 Real-Life Applications
- [Application 1]
- [Application 2]
- [Application 3]

## 💡 Key Points to Remember
1. [Important point 1]
2. [Important point 2]
3. [Important point 3]`,

      Math: `# Class ${className} ${subject} Chapter: ${chapterName}

## 📐 Chapter Overview
[Brief introduction to the mathematical concepts]

## 🔢 Key Concepts
### Concept 1
[Detailed explanation with examples]

### Concept 2
[Detailed explanation with examples]

## 📊 Formulas & Rules
- **Formula 1**: [Formula] - [When to use]
- **Formula 2**: [Formula] - [When to use]

## 🎯 Problem-Solving Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Step 4]

## 💡 Important Properties
- [Property 1]: [Explanation]
- [Property 2]: [Explanation]

## 🔍 Common Mistakes to Avoid
- [Mistake 1]: [How to avoid]
- [Mistake 2]: [How to avoid]

## 📝 Practice Tips
- [Tip 1]
- [Tip 2]
- [Tip 3]`,

      SST: `# Class ${className} ${subject} Chapter: ${chapterName}

## 🌍 Chapter Overview
[Brief introduction to the historical/geographical/civic topic]

## 📅 Timeline (if applicable)
- **[Year/Period]**: [Event]
- **[Year/Period]**: [Event]
- **[Year/Period]**: [Event]

## 🏛️ Key Figures
- **[Name]**: [Role and contribution]
- **[Name]**: [Role and contribution]

## 🗺️ Important Places
- **[Place]**: [Significance]
- **[Place]**: [Significance]

## 🎯 Main Events/Concepts
### Event/Concept 1
[Detailed explanation]

### Event/Concept 2
[Detailed explanation]

## 💡 Causes and Effects
### Causes
- [Cause 1]
- [Cause 2]

### Effects
- [Effect 1]
- [Effect 2]

## 📚 Key Terms
- **[Term]**: [Definition]
- **[Term]**: [Definition]

## 🔍 Significance
[Why this topic is important and its relevance today]`
    };

    return templates[subject as keyof typeof templates] || templates.English;
  };

  // Function to clean and format content from external sources
  const cleanExternalContent = (content: string): string => {
    let cleaned = content;
    
    // Remove common unwanted patterns from ChatGPT/Perplexity
    cleaned = cleaned.replace(/^(ChatGPT|Perplexity|AI Assistant):\s*/gm, '');
    cleaned = cleaned.replace(/^(Human|User):\s*/gm, '');
    cleaned = cleaned.replace(/\*\*Note:\*\*.*$/gm, '');
    cleaned = cleaned.replace(/\*\*Disclaimer:\*\*.*$/gm, '');
    
    // Decode HTML entities
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&#39;/g, "'");
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    
    // Remove malformed HTML tags and attributes
    cleaned = cleaned.replace(/<[^>]*>/g, ''); // Remove all HTML tags
    cleaned = cleaned.replace(/\[(\d+)\]/g, ''); // Remove reference numbers like [1], [2]
    
    // Fix common formatting issues
    cleaned = cleaned.replace(/"\s*>/g, '"'); // Remove orphaned > after quotes
    cleaned = cleaned.replace(/>\s*"/g, '"'); // Remove orphaned > before quotes
    cleaned = cleaned.replace(/"\s*-\s*>/g, ' - '); // Fix arrow formatting
    cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between lowercase and uppercase
    cleaned = cleaned.replace(/([.!?])([A-Z])/g, '$1 $2'); // Add space after punctuation
    
    // Fix title issues - split merged titles
    cleaned = cleaned.replace(/^#\s*([^#\n]+?)([A-Z][a-z]+.*)/gm, '# $1\n\n## $2');
    
    // Clean up excessive spacing and line breaks
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/\s{3,}/g, ' ');
    cleaned = cleaned.trim();
    
    // Fix common markdown issues
    cleaned = cleaned.replace(/^##([^#\s])/gm, '## $1'); // Add space after ##
    cleaned = cleaned.replace(/^###([^#\s])/gm, '### $1'); // Add space after ###
    cleaned = cleaned.replace(/^\*\*([^*]+)\*\*([A-Za-z])/gm, '**$1**\n\n$2'); // Fix bold formatting
    
    // Clean up bullet points
    cleaned = cleaned.replace(/^-([^\s])/gm, '- $1'); // Add space after dash
    cleaned = cleaned.replace(/^\*([^\s*])/gm, '- $1'); // Convert * to - for bullets
    
    // Ensure proper title if missing
    if (!cleaned.startsWith('#')) {
      if (creatingContent) {
        cleaned = `# Class ${creatingContent.class} ${creatingContent.subject} Chapter: ${creatingContent.chapterName}\n\n${cleaned}`;
      }
    }
    
    return cleaned;
  };

  // Function to copy template to clipboard
  const copyTemplate = (subject: string) => {
    if (!creatingContent) return;
    
    const template = getContentTemplate(subject, creatingContent.chapterName, creatingContent.class);
    navigator.clipboard.writeText(template).then(() => {
      alert('Template copied to clipboard! You can now paste it into ChatGPT or Perplexity.');
    });
  };

  // Function to use template directly
  const useTemplate = (subject: string) => {
    if (!creatingContent) return;
    
    const template = getContentTemplate(subject, creatingContent.chapterName, creatingContent.class);
    setNewContent(template);
    setNewTitle(`${creatingContent.chapterName} - Chapter Summary`);
    setShowTemplates(false);
  };

  // Add function to create new cached content
  const createCachedContent = async () => {
    if (!creatingContent) return;

    // Clean the content before saving
    const cleanedContent = cleanExternalContent(newContent);

    try {
      const response = await authenticatedFetch(
        getApiUrl('/api/admin/content-cache'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chapterId: creatingContent.chapterId,
            content: cleanedContent,
            title: newTitle,
            subject: creatingContent.subject,
            class: creatingContent.class,
          }),
        }
      );

      if (response.ok) {
        alert('Content created and cached successfully!');
        // Refresh the chapter list
        fetchChapters();
        // Close the modal
        setCreatingContent(null);
        setNewContent('');
        setNewTitle('');
        setContentPreview(false);
        setShowTemplates(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to create content: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create cached content:', error);
      alert('Failed to create content. Please try again.');
    }
  };

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
        <p className="text-gray-400 mb-4">
          Manage cached chapter summaries and reduce LLM costs
        </p>
        
        {/* Quick Guide */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 text-left max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Quick Guide: Adding Content with AI
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">📝 Step 1: Generate Content</h4>
              <ul className="space-y-1 text-xs">
                <li>• Use ChatGPT, Perplexity, or Claude</li>
                <li>• Click "Create" on any uncached chapter</li>
                <li>• Use provided templates or AI prompts</li>
                <li>• Copy generated content and paste here</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">🛠️ Step 2: Clean & Format</h4>
              <ul className="space-y-1 text-xs">
                <li>• Click "Clean Content" to remove AI artifacts</li>
                <li>• Use Preview mode to check formatting</li>
                <li>• Add emojis and markdown for better UX</li>
                <li>• Save to cache for instant loading</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="bg-surface rounded-lg border border-gray-800 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-500" />
              Cache Statistics
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Cost Savings:</span>
              <span className="text-green-400 font-medium">
                ~${((stats.totalAccesses * 0.002) - (stats.totalCached * 0.001)).toFixed(2)}
              </span>
            </div>
          </div>
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
                            onClick={() => viewCachedContent(chapter.cacheId!)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors flex items-center gap-1"
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button
                            onClick={() => deleteCachedContent(chapter.cacheId!, chapter.chapterName)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-500 text-sm">Not Cached</span>
                          <button
                            onClick={() => setCreatingContent({
                              chapterId: chapter.chapterId,
                              chapterName: chapter.chapterName,
                              subject: chapter.subject,
                              class: chapter.class
                            })}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-colors flex items-center gap-1"
                          >
                            <Edit3 size={16} />
                            Create
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View/Edit Modal */}
      {viewContent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg border border-gray-800 w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">
                {viewContent.title || 'Cached Content'}
              </h3>
              <button
                onClick={() => setViewContent(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tab Navigation with Action Buttons */}
            <div className="flex items-center justify-between border-b border-gray-800">
              <div className="flex">
                <button
                  onClick={() => setEditMode('view')}
                  className={`px-4 py-2 text-sm font-medium ${
                    editMode === 'view'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  View (Formatted)
                </button>
                <button
                  onClick={() => setEditMode('edit')}
                  className={`px-4 py-2 text-sm font-medium ${
                    editMode === 'edit'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Edit (Raw Text)
                </button>
              </div>
              
              {/* Action Buttons for Edit Mode */}
              {editMode === 'edit' && (
                <div className="flex items-center gap-2 p-2">
                  <button
                    onClick={() => {
                      const cleaned = cleanExternalContent(rawContent);
                      setRawContent(cleaned);
                      alert('Content cleaned and formatted!');
                    }}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-colors flex items-center gap-2"
                  >
                    <FileText size={14} />
                    Clean
                  </button>
                  <button
                    onClick={() => {
                      // Advanced cleaning for problematic content
                      let cleaned = rawContent;
                      
                      // Remove all HTML tags and entities
                      cleaned = cleaned.replace(/<[^>]*>/g, '');
                      cleaned = cleaned.replace(/&[a-zA-Z0-9#]+;/g, '');
                      cleaned = cleaned.replace(/\[(\d+)\]/g, '');
                      
                      // Fix spacing issues
                      cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');
                      cleaned = cleaned.replace(/([.!?])([A-Z])/g, '$1 $2');
                      cleaned = cleaned.replace(/\s+/g, ' ');
                      cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
                      
                      setRawContent(cleaned.trim());
                      alert('Advanced cleaning applied! Check the content and preview.');
                    }}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-white text-sm transition-colors flex items-center gap-2"
                  >
                    <Sparkles size={14} />
                    Deep Clean
                  </button>
                </div>
              )}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              {editMode === 'view' ? (
                // Formatted View Mode using the same component as NCERT Explainer
                <div>
                  <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded">
                    <p className="text-sm text-blue-300">
                      <strong>Preview Mode:</strong> This shows exactly how students will see the content in NCERT Explainer.
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <FormattedContent 
                      content={viewContent.content}
                      className="text-sm"
                    />
                  </div>
                </div>
              ) : (
                // Raw Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={contentTitle}
                      onChange={(e) => setContentTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                      placeholder="Enter title"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-400">
                        Content (Raw Text - Markdown Supported)
                      </label>
                      <div className="text-xs text-gray-500">
                        {rawContent.length} characters
                      </div>
                    </div>
                    <textarea
                      value={rawContent}
                      onChange={(e) => setRawContent(e.target.value)}
                      className="w-full h-96 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white font-mono text-sm resize-none"
                      placeholder="Enter content in Markdown format"
                    />
                    <div className="mt-2 text-xs text-gray-400 space-y-1">
                      <p><strong>💡 Editing Tips:</strong></p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Use "Clean" for basic cleanup, "Deep Clean" for problematic content</li>
                        <li>Markdown formatting: # Headers, **Bold**, *Italic*, - Lists</li>
                        <li>Switch to "View" tab to see exactly how students will see it</li>
                        <li>Content is processed by the same component as NCERT Explainer</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-4 border-t border-gray-800">
              <div className="text-sm text-gray-400">
                {editMode === 'edit' && rawContent.length > 0 ? (
                  <span className="text-green-400">✓ Content ready</span>
                ) : (
                  <span>Switch between View and Edit modes</span>
                )}
              </div>
              <div className="flex gap-3">
                {editMode === 'edit' && (
                  <button
                    onClick={updateCachedContent}
                    disabled={!rawContent.trim() || !contentTitle.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white transition-colors"
                  >
                    Save Changes
                  </button>
                )}
                <button
                  onClick={() => setViewContent(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Content Modal */}
      {creatingContent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg border border-gray-800 w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Create Content for "{creatingContent.chapterName}"
                </h3>
                <p className="text-sm text-gray-400">
                  {creatingContent.subject} • Class {creatingContent.class}
                </p>
              </div>
              <button
                onClick={() => {
                  setCreatingContent(null);
                  setNewContent('');
                  setNewTitle('');
                  setContentPreview(false);
                  setShowTemplates(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 p-4 border-b border-gray-800 bg-gray-900/50">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm transition-colors flex items-center gap-2"
              >
                <Sparkles size={16} />
                {showTemplates ? 'Hide Templates' : 'Show Templates'}
              </button>
              <button
                onClick={() => setContentPreview(!contentPreview)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors flex items-center gap-2"
              >
                <Eye size={16} />
                {contentPreview ? 'Edit Mode' : 'Preview Mode'}
              </button>
              <button
                onClick={() => {
                  const cleaned = cleanExternalContent(newContent);
                  setNewContent(cleaned);
                  alert('Content cleaned and formatted!');
                }}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-colors flex items-center gap-2"
              >
                <FileText size={16} />
                Clean Content
              </button>
              <button
                onClick={() => {
                  // Advanced cleaning for problematic content
                  let cleaned = newContent;
                  
                  // Remove all HTML tags and entities
                  cleaned = cleaned.replace(/<[^>]*>/g, '');
                  cleaned = cleaned.replace(/&[a-zA-Z0-9#]+;/g, '');
                  cleaned = cleaned.replace(/\[(\d+)\]/g, '');
                  
                  // Fix spacing issues
                  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');
                  cleaned = cleaned.replace(/([.!?])([A-Z])/g, '$1 $2');
                  cleaned = cleaned.replace(/\s+/g, ' ');
                  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
                  
                  // Ensure proper structure
                  if (!cleaned.startsWith('#') && creatingContent) {
                    cleaned = `# Class ${creatingContent.class} ${creatingContent.subject} Chapter: ${creatingContent.chapterName}\n\n${cleaned}`;
                  }
                  
                  setNewContent(cleaned.trim());
                  alert('Advanced cleaning applied! Check the content and preview.');
                }}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-white text-sm transition-colors flex items-center gap-2"
              >
                <Sparkles size={16} />
                Deep Clean
              </button>
            </div>

            {/* Templates Section */}
            {showTemplates && (
              <div className="p-4 border-b border-gray-800 bg-gray-900/30">
                <h4 className="text-sm font-semibold text-white mb-3">Content Templates & AI Prompts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-400 uppercase">Quick Templates</h5>
                    <div className="flex flex-wrap gap-2">
                      {['English', 'Science', 'Math', 'SST'].map((subject) => (
                        <div key={subject} className="flex gap-1">
                          <button
                            onClick={() => useTemplate(subject)}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
                          >
                            Use {subject}
                          </button>
                          <button
                            onClick={() => copyTemplate(subject)}
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white transition-colors flex items-center gap-1"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                    <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-400 uppercase">AI Prompt Suggestions</h5>
                    <div className="text-xs text-gray-300 space-y-1">
                      <p><strong>Perplexity/ChatGPT Prompt (Recommended):</strong></p>
                      <div className="bg-gray-800 p-2 rounded font-mono text-xs">
                        Create a comprehensive and detailed summary for CBSE Class {creatingContent.class} {creatingContent.subject} chapter "{creatingContent.chapterName}" from NCERT textbook.
                        <br/><br/>
                        **CRITICAL FORMATTING RULES (MUST FOLLOW):**<br/>
                        - Use clean markdown ONLY<br/>
                        - NO **bold** inside bullet points (plain text only)<br/>
                        - Every bullet: "- " (dash + space)<br/>
                        - Sub-bullets: "  - " (2 spaces + dash + space)<br/>
                        - **Bold ONLY in headings/titles**, never in bullet content<br/>
                        - NO citations, NO HTML, NO special chars<br/>
                        <br/>
                        **Student-friendly Hinglish, 300-500 words, CBSE exam focus, NO bold in bullets!**
                      </div>
                      <p className="text-yellow-300 text-xs mt-2">
                        ⚠️ <strong>Important:</strong> Copy this exact prompt to get properly formatted content that works with our system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Content */}
            <div className="flex-1 overflow-auto">
              {contentPreview ? (
                /* Preview Mode */
                <div className="p-4">
                  <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded">
                    <p className="text-sm text-blue-300">
                      <strong>Preview Mode:</strong> This shows exactly how students will see the content in NCERT Explainer.
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <FormattedContent 
                      content={newContent}
                      className="text-sm"
                    />
                  </div>
                  
                  {/* Content Quality Check */}
                  <div className="mt-4 p-3 bg-gray-800 rounded">
                    <h4 className="text-sm font-medium text-white mb-2">Content Quality Check:</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className={newContent.includes('# ') ? 'text-green-400' : 'text-red-400'}>
                          {newContent.includes('# ') ? '✓' : '✗'} Has main title
                        </span>
                      </div>
                      <div>
                        <span className={newContent.includes('## ') ? 'text-green-400' : 'text-red-400'}>
                          {newContent.includes('## ') ? '✓' : '✗'} Has sections
                        </span>
                      </div>
                      <div>
                        <span className={newContent.length > 500 ? 'text-green-400' : 'text-yellow-400'}>
                          {newContent.length > 500 ? '✓' : '⚠'} Content length ({newContent.length} chars)
                        </span>
                      </div>
                      <div>
                        <span className={!newContent.includes('<') && !newContent.includes('&gt;') ? 'text-green-400' : 'text-red-400'}>
                          {!newContent.includes('<') && !newContent.includes('&gt;') ? '✓' : '✗'} No HTML artifacts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                      placeholder="Enter title (e.g., The Little Girl - Chapter Summary)"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-400">
                        Content (Markdown/HTML Supported)
                      </label>
                      <div className="text-xs text-gray-500">
                        {newContent.length} characters
                      </div>
                    </div>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full h-96 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white font-mono text-sm resize-none"
                      placeholder="Paste content from ChatGPT/Perplexity here, or use a template..."
                    />
                    <div className="mt-2 text-xs text-gray-400 space-y-1">
                      <p><strong>💡 Pro Tips:</strong></p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Copy content from ChatGPT/Perplexity and paste here</li>
                        <li>Use "Clean Content" for basic cleanup, "Deep Clean" for problematic content</li>
                        <li>Markdown formatting: # Headers, **Bold**, *Italic*, - Lists</li>
                        <li>Emojis are supported and make content more engaging</li>
                        <li>Preview mode shows how students will see the content</li>
                        <li><strong>If content looks broken:</strong> Try "Deep Clean" first, then manual editing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-4 border-t border-gray-800">
              <div className="text-sm text-gray-400">
                {newContent.length > 0 ? (
                  <span className="text-green-400">✓ Content ready</span>
                ) : (
                  <span>Enter content to continue</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={createCachedContent}
                  disabled={!newContent.trim() || !newTitle.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Create & Cache Content
                </button>
                <button
                  onClick={() => {
                    setCreatingContent(null);
                    setNewContent('');
                    setNewTitle('');
                    setContentPreview(false);
                    setShowTemplates(false);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simplified admin page - no editing for now */}
    </div>
  );
};

export default AdminSummaryPage;
