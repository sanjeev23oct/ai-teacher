import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface VoiceExplanationPlayerProps {
  text: string;
  autoPlay?: boolean;
}

export default function VoiceExplanationPlayer({ 
  text, 
  autoPlay = true 
}: VoiceExplanationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    // Auto-play on mount if enabled and hasn't played yet
    if (autoPlay && !hasPlayed && text) {
      playAudio();
    }

    // Cleanup audio on unmount
    return () => {
      if (audioElement) {
        audioElement.pause();
        URL.revokeObjectURL(audioElement.src);
      }
    };
  }, []);

  const playAudio = async () => {
    if (isPlaying || isLoading) return;

    setIsLoading(true);
    setHasPlayed(true);

    try {
      // Call TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onplay = () => {
          setIsPlaying(true);
          setIsLoading(false);
        };

        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
          URL.revokeObjectURL(audioUrl);
          console.error('Audio playback error');
        };

        setAudioElement(audio);
        await audio.play();
      } else {
        // TTS not available, fail silently
        console.log('TTS service not available');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <button
      onClick={isPlaying ? stopAudio : playAudio}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
      title={isPlaying ? 'Stop audio' : 'Play audio explanation'}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </>
      ) : isPlaying ? (
        <>
          <VolumeX className="w-5 h-5" />
          <span>Stop</span>
        </>
      ) : (
        <>
          <Volume2 className="w-5 h-5" />
          <span>Listen</span>
        </>
      )}
    </button>
  );
}
