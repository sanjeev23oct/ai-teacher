// ===========================
// Audio Player Component
// Reusable audio player with cache indicator
// ===========================

import React, { useRef, useState } from 'react';
import { Volume2, VolumeX, Loader } from 'lucide-react';
import AudioCacheBadge from './AudioCacheBadge';
import { getImageUrl } from '../config';

interface AudioPlayerProps {
  audioUrl: string;
  audioSource: 'cache' | 'elevenlabs';
  cacheKey?: string;
  timestamp?: string;
  autoPlay?: boolean;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  audioSource,
  cacheKey,
  timestamp,
  autoPlay = false,
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePlay = async () => {
    if (!audioRef.current) {
      // Create audio element if doesn't exist
      // Ensure URL is properly formatted - handle both absolute and relative URLs
      const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : getImageUrl(audioUrl);
      console.log('[AudioPlayer] Loading audio from:', fullAudioUrl);
      const audio = new Audio(fullAudioUrl);
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      audio.onloadstart = () => setIsLoading(true);
      audio.oncanplay = () => setIsLoading(false);
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsLoading(false);
    }
  };

  // Auto-play if requested
  React.useEffect(() => {
    if (autoPlay && audioUrl) {
      // Small delay to ensure component is ready
      const timer = setTimeout(() => {
        togglePlay();
      }, 300);
      return () => clearTimeout(timer);
    }
    // Cleanup on unmount only
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []); // Run only once on mount

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isLoading ? (
          <Loader size={18} className="animate-spin" />
        ) : isPlaying ? (
          <VolumeX size={18} />
        ) : (
          <Volume2 size={18} />
        )}
      </button>

      <AudioCacheBadge
        source={audioSource}
        cacheKey={cacheKey}
        timestamp={timestamp}
      />
    </div>
  );
};

export default AudioPlayer;
