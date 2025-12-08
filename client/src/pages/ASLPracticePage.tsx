import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, RefreshCw, Users, User } from 'lucide-react';

// Import task data
const getRandomTask = () => {
  // This will be replaced with actual import once we move files
  return {
    id: 1,
    prompt: "What will schools be like in 2157? Describe how technology might change education.",
    duration: 60,
    citation: "From NCERT Beehive Ch 1"
  };
};

type Mode = 'solo' | 'pair';

interface ASLResult {
  score: number;
  fixes: string[];
  transcription?: string;
}

const ASLPracticePage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('solo');
  const [currentTask, setCurrentTask] = useState(getRandomTask());
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ASLResult | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for waveform
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Start waveform visualization
      drawWaveform();
      
      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = handleRecordingStop;
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTimeLeft(mode === 'solo' ? 60 : 30);
      
      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to record');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!analyserRef.current) return;
      
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(dataArray);
      
      ctx.fillStyle = '#1a1a23';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2563eb';
      ctx.beginPath();
      
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    
    draw();
  };

  const handleRecordingStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('taskId', currentTask.id.toString());
      formData.append('mode', mode);
      
      const response = await fetch('/api/asl/score', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Scoring failed');
      }
      
      const data = await response.json();
      console.log('Scoring result:', data);
      setResult(data);
    } catch (error) {
      console.error('Error scoring:', error);
      alert(`Failed to score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTask = () => {
    setResult(null);
    setCurrentTask(getRandomTask());
    setTimeLeft(mode === 'solo' ? 60 : 30);
  };

  const handleTryAgain = () => {
    setResult(null);
    setTimeLeft(mode === 'solo' ? 60 : 30);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('solo')}
          className={`flex-1 py-3 rounded-lg border-2 transition-all ${
            mode === 'solo'
              ? 'border-primary bg-primary/20 text-white'
              : 'border-gray-700 bg-gray-900 text-gray-400'
          }`}
        >
          <User className="inline w-5 h-5 mr-2" />
          Solo Practice
        </button>
        <button
          onClick={() => setMode('pair')}
          className={`flex-1 py-3 rounded-lg border-2 transition-all ${
            mode === 'pair'
              ? 'border-primary bg-primary/20 text-white'
              : 'border-gray-700 bg-gray-900 text-gray-400'
          }`}
        >
          <Users className="inline w-5 h-5 mr-2" />
          Pair Discussion
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-surface rounded-xl border border-gray-800 p-6">
        {!result ? (
          <>
            {/* Task Display */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                {mode === 'solo' ? 'Speaking Task' : 'Discussion Topic'}
              </h2>
              <p className="text-gray-300 text-lg mb-2">{currentTask.prompt}</p>
              <p className="text-sm text-gray-500">{currentTask.citation}</p>
              <p className="text-sm text-primary mt-2">
                Duration: {mode === 'solo' ? '60' : '30'} seconds
              </p>
            </div>

            {/* Recording Area */}
            <div className="mb-6">
              {/* Waveform Canvas */}
              <canvas
                ref={canvasRef}
                width={600}
                height={100}
                className="w-full rounded-lg mb-4 bg-gray-900"
              />

              {/* Timer */}
              <div className="text-center mb-4">
                <div className={`text-6xl font-bold ${isRecording ? 'text-red-500' : 'text-gray-500'}`}>
                  {timeLeft}s
                </div>
              </div>

              {/* Record Button */}
              <div className="flex justify-center">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`p-8 rounded-full transition-all ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-primary hover:bg-primary-hover'
                  } disabled:opacity-50`}
                >
                  {isRecording ? (
                    <MicOff className="w-12 h-12 text-white" />
                  ) : (
                    <Mic className="w-12 h-12 text-white" />
                  )}
                </button>
              </div>

              {isProcessing && (
                <div className="text-center mt-4">
                  <Loader2 className="inline w-6 h-6 animate-spin text-primary" />
                  <p className="text-gray-400 mt-2">Analyzing your response...</p>
                </div>
              )}
            </div>

            {/* New Task Button */}
            <button
              onClick={handleNewTask}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all"
            >
              <RefreshCw className="inline w-5 h-5 mr-2" />
              New Task
            </button>
          </>
        ) : (
          <>
            {/* Results Display */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                Score: {result.score}/5
              </h2>
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-3xl ${
                      star <= result.score ? 'text-yellow-500' : 'text-gray-600'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                {result.score >= 4 ? '✅ Great job!' : result.score >= 3 ? '👍 Good effort!' : '💪 Keep practicing!'}
              </h3>
              <div className="space-y-2">
                {result.fixes.map((fix, index) => (
                  <div key={index} className="bg-gray-800 p-3 rounded-lg">
                    <span className="text-primary font-semibold">{index + 1}. </span>
                    <span className="text-gray-300">{fix}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleTryAgain}
                className="flex-1 py-3 bg-primary hover:bg-primary-hover rounded-lg text-white transition-all"
              >
                Try Again
              </button>
              <button
                onClick={handleNewTask}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all"
              >
                <RefreshCw className="inline w-5 h-5 mr-2" />
                New Task
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ASLPracticePage;
