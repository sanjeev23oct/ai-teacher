import React, { useState } from 'react';
import { X, Copy, Check, Share2, Users, Globe } from 'lucide-react';

interface ShareNoteModalProps {
  note: {
    id: string;
    title: string;
    shareLink?: string;
    shareCount?: number;
  };
  friends: Array<{ id: string; name: string; email: string }>;
  onClose: () => void;
  onShare: (noteId: string, visibility: string, friendIds?: string[]) => Promise<void>;
}

export default function ShareNoteModal({ note, friends, onClose, onShare }: ShareNoteModalProps) {
  const [shareMode, setShareMode] = useState<'public' | 'friends'>('public');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState(note.shareLink || '');

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await onShare(note.id, shareMode, shareMode === 'friends' ? selectedFriends : undefined);
      // Generate share link
      const link = `${window.location.origin}/smart-notes/shared/${note.id}`;
      setShareLink(link);
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl max-w-md w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Share2 size={20} className="text-blue-400" />
            Share Note
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Note Title */}
        <div className="p-4 border-b border-gray-700">
          <p className="text-sm text-gray-400">Sharing:</p>
          <p className="text-white font-medium line-clamp-2">{note.title}</p>
          {note.shareCount !== undefined && note.shareCount > 0 && (
            <p className="text-xs text-green-400 mt-1">📊 Shared {note.shareCount} times</p>
          )}
        </div>

        {/* Share Mode Selection */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-400 mb-2">Who can see this?</p>
          
          {/* Public Option */}
          <button
            onClick={() => setShareMode('public')}
            className={`w-full p-3 rounded-lg border transition-all text-left ${
              shareMode === 'public'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe className={shareMode === 'public' ? 'text-blue-400' : 'text-gray-400'} size={20} />
              <div className="flex-1">
                <p className="text-white font-medium">Public</p>
                <p className="text-xs text-gray-400">Anyone with the link can view</p>
              </div>
            </div>
          </button>

          {/* Friends Option */}
          <button
            onClick={() => setShareMode('friends')}
            className={`w-full p-3 rounded-lg border transition-all text-left ${
              shareMode === 'friends'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className={shareMode === 'friends' ? 'text-purple-400' : 'text-gray-400'} size={20} />
              <div className="flex-1">
                <p className="text-white font-medium">Specific Friends</p>
                <p className="text-xs text-gray-400">Only selected friends can view</p>
              </div>
            </div>
          </button>
        </div>

        {/* Friend Selection (if friends mode) */}
        {shareMode === 'friends' && (
          <div className="px-4 pb-4 max-h-48 overflow-y-auto">
            <p className="text-sm text-gray-400 mb-2">Select friends:</p>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No friends yet. Add friends first!</p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriends.includes(friend.id)}
                      onChange={() => toggleFriend(friend.id)}
                      className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white">{friend.name}</p>
                      <p className="text-xs text-gray-400">{friend.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {selectedFriends.length > 0 && (
              <p className="text-xs text-blue-400 mt-2">✓ {selectedFriends.length} friend(s) selected</p>
            )}
          </div>
        )}

        {/* Share Link (if already shared) */}
        {shareLink && (
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-400 mb-2">Share link:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              💡 Share this link on WhatsApp, Email, or anywhere!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || (shareMode === 'friends' && selectedFriends.length === 0)}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSharing ? 'Sharing...' : shareLink ? 'Update Share' : 'Generate Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
