import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, FileText, Star, Trash2, Search, BookOpen, Users, Heart, Bookmark, Share2, UserPlus, Copy, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/api';
import { getApiUrl } from '../config';
import CameraCapture from '../components/CameraCapture';
import ShareNoteModal from '../components/ShareNoteModal';

interface SmartNote {
  id: string;
  sourceType: 'text' | 'image';
  originalText?: string;
  extractedText?: string;
  enhancedNote: string;
  title: string;
  summary: string;
  subject?: string;
  class?: string;
  chapter?: string;
  tags: string[];
  isFavorite: boolean;
  viewCount: number;
  createdAt: string;
  cacheHit?: boolean;
  visibility?: string;
  likeCount?: number;
  bookmarkCount?: number;
  shareCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  shareLink?: string;
  user?: {
    id: string;
    name: string;
    grade: string;
    school: string;
  };
}

interface NoteProgress {
  totalNotes: number;
  currentStreak: number;
  longestStreak: number;
  mathNotes: number;
  scienceNotes: number;
  englishNotes: number;
  sstNotes: number;
  otherNotes: number;
}

export default function SmartNotesPage() {
  const navigate = useNavigate();
  const { id: sharedNoteId } = useParams();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'notes' | 'community' | 'shared' | 'friends' | 'create' | 'revision'>('notes');
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [showCamera, setShowCamera] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState<'private' | 'friends' | 'class' | 'public'>('private');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<SmartNote[]>([]);
  const [communityNotes, setCommunityNotes] = useState<SmartNote[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SmartNote[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<SmartNote | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [noteToShare, setNoteToShare] = useState<SmartNote | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [progress, setProgress] = useState<NoteProgress | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewingSharedNote, setViewingSharedNote] = useState<SmartNote | null>(null);
  const [loadingSharedNote, setLoadingSharedNote] = useState(false);
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  useEffect(() => {
    if (sharedNoteId) {
      fetchSharedNote(sharedNoteId);
    }
  }, [sharedNoteId]);

  useEffect(() => {
    if (!user) {
      return; // Don't navigate, let AuthContext handle it
    }
    fetchNotes();
    fetchProgress();
    if (activeTab === 'community') {
      fetchCommunityNotes();
    }
    if (activeTab === 'shared') {
      fetchSharedWithMe();
    }
    if (activeTab === 'friends') {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [user, activeTab]);

  useEffect(() => {
    applyFilters();
  }, [notes, searchQuery, filterSubject, showFavoritesOnly]);

  const fetchNotes = async () => {
    try {
      console.log('[SMART NOTES] Fetching notes...');
      const response = await authenticatedFetch(getApiUrl('/api/smart-notes'));
      if (response.ok) {
        const data = await response.json();
        console.log('[SMART NOTES] Received notes:', data.notes?.length || 0, 'notes');
        setNotes(data.notes || []);
      } else {
        console.error('[SMART NOTES] Fetch failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/api/smart-notes/progress/stats'));
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const fetchSharedNote = async (noteId: string) => {
    setLoadingSharedNote(true);
    try {
      const response = await fetch(getApiUrl(`/api/smart-notes/shared/${noteId}`));
      if (response.ok) {
        const data = await response.json();
        setViewingSharedNote(data.note);
      } else {
        console.error('Failed to fetch shared note:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch shared note:', error);
    } finally {
      setLoadingSharedNote(false);
    }
  };

  const fetchCommunityNotes = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/api/smart-notes/community?sortBy=recent&limit=20'));
      if (response.ok) {
        const data = await response.json();
        setCommunityNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to fetch community notes:', error);
    }
  };

  const fetchSharedWithMe = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/api/smart-notes/shared-with-me'));
      if (response.ok) {
        const data = await response.json();
        setSharedWithMe(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to fetch shared notes:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/api/friends'));
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/api/friends/requests'));
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...notes];

    if (searchQuery) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.enhancedNote.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterSubject !== 'all') {
      filtered = filtered.filter(note => note.subject?.toLowerCase() === filterSubject.toLowerCase());
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(note => note.isFavorite);
    }

    setFilteredNotes(filtered);
  };

  const handleTextSubmit = async () => {
    if (!noteText.trim()) return;

    setIsProcessing(true);
    try {
      const response = await authenticatedFetch(getApiUrl('/api/smart-notes/create-text'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: noteText,
          subject: user?.preferredSubject || undefined,
          class: user?.grade,
          chapter: selectedChapter || undefined,
          visibility: selectedVisibility,
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]);
        setNoteText('');
        setSelectedChapter('');
        setSelectedVisibility('private');
        setActiveTab('notes');
        
        if (newNote.cacheHit) {
          console.log('📦 Note enhancement loaded from cache!');
        } else {
          console.log('✨ Note enhanced by AI');
        }
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (user?.preferredSubject) formData.append('subject', user.preferredSubject);
      if (user?.grade) formData.append('class', user.grade);
      if (selectedChapter) formData.append('chapter', selectedChapter);
      formData.append('visibility', selectedVisibility);

      const response = await authenticatedFetch(getApiUrl('/api/smart-notes/create-image'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]);
        setSelectedChapter('');
        setSelectedVisibility('private');
        setActiveTab('notes');
        
        if (newNote.cacheHit) {
          console.log('📦 Image OCR loaded from cache!');
        } else {
          console.log('🔍 Image processed with OCR');
        }
      }
    } catch (error) {
      console.error('Failed to process image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = (imageBlob: Blob) => {
    const file = new File([imageBlob], `note-${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });
    handleImageUpload(file);
    setShowCamera(false);
  };

  const handleLike = async (noteId: string) => {
    try {
      const note = [...notes, ...communityNotes].find(n => n.id === noteId);
      if (!note) return;

      if (note.isLiked) {
        await authenticatedFetch(getApiUrl(`/api/smart-notes/${noteId}/like`), { method: 'DELETE' });
      } else {
        await authenticatedFetch(getApiUrl(`/api/smart-notes/${noteId}/like`), { method: 'POST' });
      }
      
      // Refresh appropriate list
      if (activeTab === 'community') {
        fetchCommunityNotes();
      } else {
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleBookmark = async (noteId: string) => {
    try {
      const note = [...notes, ...communityNotes].find(n => n.id === noteId);
      if (!note) return;

      if (note.isBookmarked) {
        await authenticatedFetch(getApiUrl(`/api/smart-notes/${noteId}/bookmark`), { method: 'DELETE' });
      } else {
        await authenticatedFetch(getApiUrl(`/api/smart-notes/${noteId}/bookmark`), { method: 'POST' });
      }
      
      // Refresh appropriate list
      if (activeTab === 'community') {
        fetchCommunityNotes();
      } else {
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const changeNoteVisibility = async (noteId: string, newVisibility: string) => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/api/smart-notes/${noteId}/visibility`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to change visibility:', error);
    }
  };

  const handleShareNote = async (noteId: string, visibility: string, friendIds?: string[]) => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/api/smart-notes/${noteId}/share`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility, friendIds }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the note with share link
        setNotes(notes.map(n => n.id === noteId ? { ...n, shareLink: data.shareLink, shareCount: (n.shareCount || 0) + 1 } : n));
      }
    } catch (error) {
      console.error('Failed to share note:', error);
      throw error;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const toggleFavorite = async (noteId: string) => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/api/smart-notes/${noteId}/favorite`), {
        method: 'PATCH',
      });

      if (response.ok) {
        const updated = await response.json();
        setNotes(notes.map(n => n.id === noteId ? updated : n));
        if (selectedNote?.id === noteId) {
          setSelectedNote(updated);
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await authenticatedFetch(getApiUrl(`/api/smart-notes/${noteId}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(notes.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const viewNote = async (note: SmartNote) => {
    setSelectedNote(note);
    setActiveTab('revision');
  };

  if (!user) {
    return null;
  }

  // Show camera capture if active
  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Viewing Shared Note */}
      {sharedNoteId && viewingSharedNote && (
        <div className="mb-6">
          <button
            onClick={() => navigate('/smart-notes')}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2"
          >
            ← Back to My Notes
          </button>
          <div className="bg-surface rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{viewingSharedNote.title}</h2>
                <p className="text-sm text-gray-400">
                  Shared by {viewingSharedNote.user?.name} • Class {viewingSharedNote.class} • {viewingSharedNote.subject}
                </p>
              </div>
              <span className="bg-green-500/20 px-3 py-1 rounded text-xs text-green-300">
                {viewingSharedNote.visibility === 'public' ? '🌐 Public' : '👥 Shared'}
              </span>
            </div>
            <div className="prose prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: viewingSharedNote.enhancedNote.replace(/\n/g, '<br>') }} />
            </div>
            {viewingSharedNote.tags && viewingSharedNote.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-4">
                {viewingSharedNote.tags.map((tag) => (
                  <span key={tag} className="bg-blue-500/20 px-2 py-1 rounded text-xs text-blue-300">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {loadingSharedNote && (
        <div className="text-center py-12">
          <div className="text-gray-400">Loading shared note...</div>
        </div>
      )}

      {/* Normal Notes View */}
      {!sharedNoteId && (
        <>
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          <FileText className="text-purple-500" size={32} />
          Smart Notes
        </h1>
        <p className="text-gray-300 text-sm sm:text-base">Transform messy notes into organized study material</p>
      </div>

      <div>
        {/* Progress Stats */}
        {progress && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-surface rounded-xl p-4 border border-gray-700">
              <div className="text-2xl sm:text-3xl font-bold text-white">{progress.totalNotes}</div>
              <div className="text-xs sm:text-sm text-gray-400">Total Notes</div>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-gray-700">
              <div className="text-2xl sm:text-3xl font-bold text-orange-400">{progress.currentStreak} 🔥</div>
              <div className="text-xs sm:text-sm text-gray-400">Day Streak</div>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-gray-700">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400">{progress.mathNotes}</div>
              <div className="text-xs sm:text-sm text-gray-400">Math</div>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-gray-700">
              <div className="text-2xl sm:text-3xl font-bold text-green-400">{progress.scienceNotes}</div>
              <div className="text-xs sm:text-sm text-gray-400">Science</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'create' ? 'bg-primary text-white' : 'bg-surface text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            ✍️ Create
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'notes' ? 'bg-primary text-white' : 'bg-surface text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            📚 My Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'community' ? 'bg-primary text-white' : 'bg-surface text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            🌐 Public
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'shared' ? 'bg-primary text-white' : 'bg-surface text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            📨 Shared with Me
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'friends' ? 'bg-primary text-white' : 'bg-surface text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            👥 Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('revision')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'revision' ? 'bg-primary text-white' : 'bg-surface text-gray-300 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            📖 Revision
          </button>
        </div>

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="bg-surface rounded-xl p-4 sm:p-6 border border-gray-700">
            {/* Input Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 py-2 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  inputMode === 'text' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <FileText size={18} />
                Type Text
              </button>
              <button
                onClick={() => setInputMode('image')}
                className={`flex-1 py-2 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  inputMode === 'image' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Camera size={18} />
                Photo
              </button>
            </div>

            {/* Context Fields - Chapter and Visibility */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                placeholder="Chapter (optional)"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <select
                value={selectedVisibility}
                onChange={(e) => setSelectedVisibility(e.target.value as any)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="private">🔒 Private</option>
                <option value="friends">👥 Friends Only</option>
                <option value="class">🏫 Class ({user?.grade})</option>
                <option value="public">🌐 Public</option>
              </select>
            </div>

            {/* Text Input */}
            {inputMode === 'text' && (
              <div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type or paste your messy notes here...&#10;&#10;AI will organize them into a clean, well-structured format!"
                  className="w-full h-48 bg-gray-700 border border-gray-600 rounded-lg p-4 resize-none mb-4 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!noteText.trim() || isProcessing}
                  className="w-full bg-primary hover:bg-primary-hover py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? '✨ Enhancing...' : '✨ Create Smart Note'}
                </button>
              </div>
            )}

            {/* Image Input */}
            {inputMode === 'image' && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => setShowCamera(true)}
                  disabled={isProcessing}
                  className="w-full bg-primary hover:bg-primary-hover py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <Camera size={20} />
                  {isProcessing ? 'Processing...' : 'Take Photo'}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 border border-gray-600 disabled:opacity-50 transition-colors"
                >
                  <FileText size={20} />
                  {isProcessing ? 'Processing...' : 'Upload Image'}
                </button>
                <p className="text-xs text-gray-400 text-center">AI will extract text and organize it automatically</p>
              </div>
            )}
          </div>
        )}

        {/* Notes List Tab */}
        {activeTab === 'notes' && (
          <div>
            {/* Search & Filters */}
            <div className="bg-surface rounded-xl p-4 mb-4 border border-gray-700">
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Subjects</option>
                  <option value="math">Math</option>
                  <option value="science">Science</option>
                  <option value="english">English</option>
                  <option value="sst">SST</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                  className="rounded"
                />
                <Star size={16} className="text-yellow-400" />
                Favorites only
              </label>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  className="bg-surface rounded-xl p-4 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700"
                  onClick={() => viewNote(note)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm flex-1 line-clamp-2">{note.title}</h3>
                    <div className="flex gap-1 ml-2">
                      {note.visibility && note.visibility !== 'private' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          {note.visibility === 'public' ? '🌐' : note.visibility === 'class' ? '🏫' : '👥'}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(note.id);
                        }}
                      >
                        <Star size={16} className={note.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2 mb-2">{note.summary}</p>
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex gap-1 flex-wrap">
                      {note.subject && (
                        <span className="bg-purple-500/30 px-2 py-0.5 rounded">{note.subject}</span>
                      )}
                      {note.class && (
                        <span className="bg-blue-500/30 px-2 py-0.5 rounded">Class {note.class}</span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      {/* Share button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToShare(note);
                          setShowShareModal(true);
                        }}
                        className="text-xs bg-blue-600 hover:bg-blue-700 rounded px-2 py-1 flex items-center gap-1"
                        title="Share note"
                      >
                        <Share2 size={12} />
                        {note.shareCount ? note.shareCount : 'Share'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        className="text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredNotes.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p>No notes found. Create your first smart note!</p>
              </div>
            )}
          </div>
        )}

        {/* Revision Tab */}
        {activeTab === 'revision' && selectedNote && (
          <div className="bg-surface rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl sm:text-2xl font-bold">{selectedNote.title}</h2>
                  {selectedNote.user?.id === user?.id && (
                    <select
                      value={selectedNote.visibility || 'private'}
                      onChange={(e) => changeNoteVisibility(selectedNote.id, e.target.value)}
                      className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="private">🔒 Private</option>
                      <option value="friends">👥 Friends</option>
                      <option value="class">🏫 Class</option>
                      <option value="public">🌐 Public</option>
                    </select>
                  )}
                </div>
                <p className="text-sm text-gray-300 mb-3">{selectedNote.summary}</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {selectedNote.tags.map(tag => (
                    <span key={tag} className="bg-purple-500/30 px-3 py-1 rounded text-xs">#{tag}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(selectedNote.id)}
                className="ml-4"
              >
                <Star size={24} className={selectedNote.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} />
              </button>
            </div>

            {/* Enhanced Note Content */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-200 whitespace-pre-wrap">
              {selectedNote.enhancedNote}
            </div>

            {/* Original Content (if from image) */}
            {selectedNote.sourceType === 'image' && selectedNote.extractedText && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                  View Original Extracted Text
                </summary>
                <div className="mt-2 bg-black/20 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">
                  {selectedNote.extractedText}
                </div>
              </details>
            )}
          </div>
        )}

        {activeTab === 'revision' && !selectedNote && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select a note from "My Notes" to start revising</p>
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="space-y-4">
            <div className="bg-surface rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Share2 size={20} className="text-purple-400" />
                Community Notes
              </h3>
              <p className="text-sm text-gray-400 mb-4">Discover notes shared by students</p>
              {communityNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No community notes available yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {communityNotes.map((note) => (
                    <div key={note.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{note.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {note.user?.name} • Class {note.class} • {note.subject}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLike(note.id)}
                            className="flex items-center gap-1 text-sm"
                          >
                            <Heart
                              size={18}
                              className={note.isLiked ? 'text-red-400 fill-red-400' : 'text-gray-400'}
                            />
                            <span className={note.isLiked ? 'text-red-400' : 'text-gray-400'}>
                              {note.likeCount || 0}
                            </span>
                          </button>
                          <button
                            onClick={() => handleBookmark(note.id)}
                            className="text-gray-400 hover:text-yellow-400"
                          >
                            <Bookmark
                              size={18}
                              className={note.isBookmarked ? 'text-yellow-400 fill-yellow-400' : ''}
                            />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{note.summary}</p>
                      <div className="flex gap-2 flex-wrap">
                        {note.tags.map((tag) => (
                          <span key={tag} className="bg-purple-500/20 px-2 py-1 rounded text-xs text-purple-300">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shared with Me Tab */}
        {activeTab === 'shared' && (
          <div className="space-y-4">
            <div className="bg-surface rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Share2 size={20} className="text-green-400" />
                Notes Shared with Me
              </h3>
              <p className="text-sm text-gray-400 mb-4">Notes that friends shared specifically with you</p>
              {sharedWithMe.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No shared notes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sharedWithMe.map((note) => (
                    <div key={note.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-green-500 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{note.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {note.user?.name} • Class {note.class} • {note.subject}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLike(note.id)}
                            className="flex items-center gap-1 text-sm"
                          >
                            <Heart
                              size={18}
                              className={note.isLiked ? 'text-red-400 fill-red-400' : 'text-gray-400'}
                            />
                            <span className={note.isLiked ? 'text-red-400' : 'text-gray-400'}>
                              {note.likeCount || 0}
                            </span>
                          </button>
                          <button
                            onClick={() => handleBookmark(note.id)}
                            className="text-gray-400 hover:text-yellow-400"
                          >
                            <Bookmark
                              size={18}
                              className={note.isBookmarked ? 'text-yellow-400 fill-yellow-400' : ''}
                            />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{note.summary}</p>
                      <div className="flex gap-2 flex-wrap">
                        {note.tags.map((tag) => (
                          <span key={tag} className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-300">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {/* Add Friend Form */}
            <div className="bg-surface rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <UserPlus size={20} className="text-blue-400" />
                Add Friend
              </h3>
              <p className="text-sm text-gray-400 mb-3">Search for users to add as friends</p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearchQuery}
                  onChange={async (e) => {
                    setUserSearchQuery(e.target.value);
                    if (e.target.value.trim()) {
                      try {
                        const response = await authenticatedFetch(
                          getApiUrl(`/api/users/search?query=${encodeURIComponent(e.target.value)}`)
                        );
                        if (response.ok) {
                          const data = await response.json();
                          setSearchUsers(data.users || []);
                        }
                      } catch (error) {
                        console.error('Search failed:', error);
                      }
                    } else {
                      setSearchUsers([]);
                    }
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
                {searchUsers.length > 0 && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 max-h-60 overflow-y-auto">
                    {searchUsers.map((user) => (
                      <div key={user.id} className="p-3 hover:bg-gray-700 flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                          <p className="text-xs text-gray-500">Class {user.grade} • {user.school}</p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const response = await authenticatedFetch(getApiUrl('/api/friends/create'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: user.email }),
                              });
                              if (response.ok) {
                                setUserSearchQuery('');
                                setSearchUsers([]);
                                fetchFriends();
                              } else {
                                const error = await response.json();
                                alert(error.error || 'Failed to add friend');
                              }
                            } catch (error) {
                              console.error('Failed to add friend:', error);
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="bg-surface rounded-xl p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <UserPlus size={20} className="text-blue-400" />
                  Friend Requests ({friendRequests.length})
                </h3>
                <div className="space-y-2">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{request.from.name}</p>
                        <p className="text-xs text-gray-400">
                          Class {request.from.grade} • {request.from.school}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await authenticatedFetch(getApiUrl(`/api/friends/accept/${request.id}`), {
                                method: 'POST',
                              });
                              fetchFriendRequests();
                              fetchFriends();
                            } catch (error) {
                              console.error('Failed to accept request:', error);
                            }
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white"
                        >
                          Accept
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await authenticatedFetch(getApiUrl(`/api/friends/reject/${request.id}`), {
                                method: 'DELETE',
                              });
                              fetchFriendRequests();
                            } catch (error) {
                              console.error('Failed to reject request:', error);
                            }
                          }}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className="bg-surface rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Users size={20} className="text-purple-400" />
                My Friends ({friends.length})
              </h3>
              {friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No friends yet. Send friend requests to connect!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div key={friend.id} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{friend.name}</p>
                        <p className="text-xs text-gray-400">
                          Class {friend.grade} • {friend.school}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm(`Remove ${friend.name} from friends?`)) {
                            try {
                              await authenticatedFetch(getApiUrl(`/api/friends/${friend.id}`), {
                                method: 'DELETE',
                              });
                              fetchFriends();
                            } catch (error) {
                              console.error('Failed to remove friend:', error);
                            }
                          }
                        }}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && noteToShare && (
        <ShareNoteModal
          note={noteToShare}
          friends={friends}
          onClose={() => {
            setShowShareModal(false);
            setNoteToShare(null);
            setSelectedFriends([]);
          }}
          onShare={handleShareNote}
        />
      )}
      </>
      )}

      {/* Share Modal */}
      {showShareModal && noteToShare && (
        <ShareNoteModal
          note={noteToShare}
          friends={friends}
          onClose={() => {
            setShowShareModal(false);
            setNoteToShare(null);
            setSelectedFriends([]);
          }}
          onShare={handleShareNote}
        />
      )}
    </div>
  );
}
