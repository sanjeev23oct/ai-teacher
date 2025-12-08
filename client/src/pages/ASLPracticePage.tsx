import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, RefreshCw, Users, User, Volume2 } from 'lucide-react';

type Mode = 'solo' | 'pair';

interface ASLTask {
  id: string;
  class: 9 | 10;
  mode: 'solo' | 'pair';
  title: string;
  prompt: string;
  keywords: string[];
  duration: number;
}

interface ASLResult {
  score: number;
  fixes: string[];
  transcription?: string;
}

const ASLPracticePage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<9 | 10>(9);
  const [mode, setMode] = useState<Mode>('solo');
  const [tasks, setTasks] = useState<ASLTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ASLTask | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ASLResult | null>(null);
  const [isPlayingFeedback, setIsPlayingFeedback] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Fetch tasks when class or mode changes
  useEffect(() => {
    fetchTasks();
  }, [selectedClass, mode]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/asl/tasks?class=${selectedClass}&mode=${mode}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
        setSelectedTask(data[0] || null);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

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
      const duration = selectedTask?.duration || (mode === 'solo' ? 60 : 30);
      setTimeLeft(duration);
      
      // Start countdown timer
      timerRef.current = window.setInterval(() => {
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
    if (!selectedTask) return;

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('taskId', selectedTask.id);
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

  const playFeedback = async () => {
    if (!result || isPlayingFeedback) return;

    setIsPlayingFeedback(true);
    
    try {
      const feedbackText = `You scored ${result.score} out of 5. Here are three ways to improve: ${result.fixes.join('. ')}`;
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: feedbackText })
      });

      if (!response.ok) throw new Error('TTS failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingFeedback(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlayingFeedback(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsPlayingFeedback(false);
    }
  };

  const handleNewTask = () => {
    setResult(null);
    const nextIndex = tasks.findIndex(t => t.id === selectedTask?.id) + 1;
    setSelectedTask(tasks[nextIndex % tasks.length] || tasks[0]);
    setTimeLeft(selectedTask?.duration || (mode === 'solo' ? 60 : 30));
  };

  const handleTryAgain = () => {
    setResult(null);
    setTimeLeft(selectedTask?.duration || (mode === 'solo' ? 60 : 30));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Class and Task Selection */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-2">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(Number(e.target.value) as 9 | 10)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
          >
            <option value={9}>Class 9</option>
            <option value={10}>Class 10</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-2">Task</label>
          <select
            value={selectedTask?.id || ''}
            onChange={(e) => setSelectedTask(tasks.find(t => t.id === e.target.value) || null)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
          >
            {tasks.map(task => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </select>
        </div>
      </div>

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
            {selectedTask && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {selectedTask.title}
                </h2>
                <p className="text-gray-300 text-lg mb-2">{selectedTask.prompt}</p>
                <p className="text-sm text-primary mt-2">
                  Duration: {selectedTask.duration} seconds
                </p>
              </div>
            )}

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
            <div className="flex gap-3 mb-4">
              <button
                onClick={playFeedback}
                disabled={isPlayingFeedback}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Volume2 className="w-5 h-5" />
                {isPlayingFeedback ? 'Playing...' : 'Hear Feedback'}
              </button>
            </div>
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
