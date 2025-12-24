import React, { useState, useRef } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
import { getApiUrl } from '../config';

interface AudioPlayerProps {
  audioEndpoint: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  method?: 'GET' | 'POST';
}

export default function AudioPlayer({ audioEndpoint, className = '', size = 'md', method = 'GET' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const sizeConfig = {
    sm: { 
      button: 'p-1.5 w-8 h-8', 
      icon: 'w-3.5 h-3.5',
      text: 'text-xs'
    },
    md: { 
      button: 'p-2 w-10 h-10', 
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: { 
      button: 'p-3 w-12 h-12', 
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  };

  const loadAudio = async () => {
    if (isLoaded && audioRef.current) return;

    try {
      setIsLoading(true);
      const response = await authenticatedFetch(
        getApiUrl(audioEndpoint),
        { method }
      );

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlaying(false);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
          setIsLoaded(false);
          console.error('Audio playback error');
          // Clean up on error
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          audioRef.current = null;
        };
        
        audio.oncanplay = () => {
          setIsLoading(false);
          setIsLoaded(true);
        };
        
        audioRef.current = audio;
        audioUrlRef.current = audioUrl;
      } else {
        setIsLoading(false);
        throw new Error('Failed to load audio');
      }
    } catch (error) {
      console.error('Failed to load audio:', error);
      setIsLoading(false);
      setIsLoaded(false);
    }
  };

  const togglePlayPause = async () => {
    // If audio is not loaded yet, load it first
    if (!isLoaded || !audioRef.current) {
      await loadAudio();
      // After loading, start playing
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Failed to play audio:', error);
        }
      }
      return;
    }

    // If audio is loaded, toggle play/pause
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
  };

  // Cleanup function to revoke blob URL when component unmounts
  const cleanup = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
    setIsLoaded(false);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return cleanup;
  }, []);

  const config = sizeConfig[size];
  
  return (
    <button
      onClick={togglePlayPause}
      disabled={isLoading}
      className={`${config.button} rounded-full transition-all duration-200 flex items-center justify-center ${
        isPlaying 
          ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25' 
          : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25'
      } ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105'} ${className}`}
      title={isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play Audio'}
    >
      {isLoading ? (
        <Loader2 className={`${config.icon} animate-spin text-white`} />
      ) : isPlaying ? (
        <Pause className={`${config.icon} text-white`} />
      ) : (
        <Play className={`${config.icon} text-white ml-0.5`} />
      )}
    </button>
  );
}
