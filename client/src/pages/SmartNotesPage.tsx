import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, FileText, Star, Trash2, Search, Filter, BookOpen, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/api';
import { getApiUrl } from '../config';

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
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'create' | 'notes' | 'revision'>('create');
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [noteText, setNoteText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<SmartNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<SmartNote | null>(null);
  const [progress, setProgress] = useState<NoteProgress | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchNotes();
    fetchProgress();
  }, [user, navigate]);

  useEffect(() => {
    applyFilters();
  }, [notes, searchQuery, filterSubject, showFavoritesOnly]);

  const fetchNotes = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/api/smart-notes'));
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
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
          subject: selectedSubject || undefined,
          class: selectedClass || undefined,
          chapter: selectedChapter || undefined,
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]);
        setNoteText('');
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
      if (selectedSubject) formData.append('subject', selectedSubject);
      if (selectedClass) formData.append('class', selectedClass);
      if (selectedChapter) formData.append('chapter', selectedChapter);

      const response = await authenticatedFetch(getApiUrl('/api/smart-notes/create-image'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">📝 Smart Notes</h1>
          <p className="text-gray-300 text-sm sm:text-base">Transform messy notes into organized study material</p>
        </div>

        {/* Progress Stats */}
        {progress && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold">{progress.totalNotes}</div>
              <div className="text-xs text-gray-300">Total Notes</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-400">{progress.currentStreak} 🔥</div>
              <div className="text-xs text-gray-300">Day Streak</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">{progress.mathNotes}</div>
              <div className="text-xs text-gray-300">Math</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{progress.scienceNotes}</div>
              <div className="text-xs text-gray-300">Science</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              activeTab === 'create' ? 'bg-purple-600' : 'bg-white/10'
            }`}
          >
            ✍️ Create
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              activeTab === 'notes' ? 'bg-purple-600' : 'bg-white/10'
            }`}
          >
            📚 My Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('revision')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              activeTab === 'revision' ? 'bg-purple-600' : 'bg-white/10'
            }`}
          >
            📖 Revision
          </button>
        </div>

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
            {/* Input Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                  inputMode === 'text' ? 'bg-purple-600' : 'bg-white/10'
                }`}
              >
                <FileText size={18} />
                Type Text
              </button>
              <button
                onClick={() => setInputMode('image')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                  inputMode === 'image' ? 'bg-purple-600' : 'bg-white/10'
                }`}
              >
                <Camera size={18} />
                Photo
              </button>
            </div>

            {/* Context Fields */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-white/10 rounded px-3 py-2 text-sm"
              >
                <option value="">Subject</option>
                <option value="Math">Math</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="SST">SST</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-white/10 rounded px-3 py-2 text-sm"
              >
                <option value="">Class</option>
                {[6, 7, 8, 9, 10].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Chapter"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="bg-white/10 rounded px-3 py-2 text-sm"
              />
            </div>

            {/* Text Input */}
            {inputMode === 'text' && (
              <div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type or paste your messy notes here...&#10;&#10;AI will organize them into a clean, well-structured format!"
                  className="w-full h-48 bg-white/10 rounded-lg p-4 resize-none mb-4 text-sm"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!noteText.trim() || isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-semibold disabled:opacity-50"
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
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Camera size={20} />
                  {isProcessing ? 'Processing...' : 'Take Photo'}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full bg-white/10 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
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
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 rounded-lg pl-10 pr-4 py-2 text-sm"
                  />
                </div>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="bg-white/10 rounded-lg px-3 py-2 text-sm"
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
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer"
                  onClick={() => viewNote(note)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm flex-1 line-clamp-2">{note.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(note.id);
                      }}
                      className="ml-2"
                    >
                      <Star size={16} className={note.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2 mb-2">{note.summary}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-1 flex-wrap">
                      {note.subject && (
                        <span className="bg-purple-500/30 px-2 py-0.5 rounded">{note.subject}</span>
                      )}
                      {note.class && (
                        <span className="bg-blue-500/30 px-2 py-0.5 rounded">Class {note.class}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                    </button>
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
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">{selectedNote.title}</h2>
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
            <div className="bg-black/20 rounded-lg p-4 text-sm whitespace-pre-wrap">
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
      </div>
    </div>
  );
}
