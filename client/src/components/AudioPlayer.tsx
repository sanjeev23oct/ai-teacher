import React, { useState } from 'react';
import { authenticatedFetch } from '../utils/api';
import { getApiUrl } from '../config';

interface AudioPlayerProps {
  audioEndpoint: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AudioPlayer({ audioEndpoint, className = '', size = 'md' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const sizeClasses = {
    sm: 'p-1.5 text-sm',
    md: 'p-2',
    lg: 'p-3 text-lg'
  };

  const playAudio = async () => {
    // Stop if already playing
    if (isPlaying) {
      currentAudio?.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      const response = await authenticatedFetch(
        getApiUrl(audioEndpoint),
        { method: 'POST' }
      );

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
          URL.revokeObjectURL(audioUrl);
          console.error('Audio playback error');
        };
        
        setCurrentAudio(audio);
        await audio.play();
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
    }
  };

  return (
    <button
      onClick={playAudio}
      className={`${sizeClasses[size]} rounded-full transition-colors ${
        isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
      } ${className}`}
      title={isPlaying ? 'Stop' : 'Listen'}
    >
      {isPlaying ? '⏸' : '🔊'}
    </button>
  );
}
