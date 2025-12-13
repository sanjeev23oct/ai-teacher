import { useState } from 'react';
import { Play, Pause, Volume2, Loader2 } from 'lucide-react';
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
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

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

  const playAudio = async () => {
    // Stop if already playing
    if (isPlaying) {
      currentAudio?.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
      return;
    }

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
          setIsLoading(false);
          setCurrentAudio(null);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
          setCurrentAudio(null);
          URL.revokeObjectURL(audioUrl);
          console.error('Audio playback error');
        };
        
        audio.oncanplay = () => {
          setIsLoading(false);
          setIsPlaying(true);
        };
        
        setCurrentAudio(audio);
        await audio.play();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsLoading(false);
    }
  };

  const config = sizeConfig[size];
  
  return (
    <button
      onClick={playAudio}
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
