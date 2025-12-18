import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, RefreshCw, Users, User, Volume2, LogIn } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'solo' | 'pair';

interface ASLTask {
  id: string;
  class: 9 | 10;
  mode: 'solo' | 'pair';
  title: string;
  prompt: string;
  keywords: string[];
  duration: number;
  sampleAnswer?: string;
  tips?: string[];
}

interface ASLResult {
  score: number;
  fixes: string[];
  transcription?: string;
}

interface ASLHistory {
  id: string;
  taskTitle: string;
  score: number;
  practicedAt: string;
  class: number;
  mode: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const ASLPracticePage: React.FC = () => {
  const { languageCode } = useLanguage();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<9 | 10>(9);
  const [mode, setMode] = useState<Mode>('solo');
  const [tasks, setTasks] = useState<ASLTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ASLTask | null>(null);
  const [currentStudent, setCurrentStudent] = useState<1 | 2>(1);
  const [student1Result, setStudent1Result] = useState<ASLResult | null>(null);
  const [student2Result, setStudent2Result] = useState<ASLResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ASLResult | null>(null);
  const [isPlayingFeedback, setIsPlayingFeedback] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState<ASLHistory[]>([]);
  const [showTranscription, setShowTranscription] = useState(false);
  const [preparationTime, setPreparationTime] = useState(0);
  const [isPreparingToRecord, setIsPreparingToRecord] = useState(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  
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

  // Fetch practice history when user is available
  useEffect(() => {
    if (user) {
      fetchPracticeHistory();
    }
  }, [user]);

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

  const fetchPracticeHistory = async () => {
    try {
      const response = await fetch('/api/asl/history', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPracticeHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch practice history:', err);
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

  const startPreparation = () => {
    if (!user) {
      alert('Please login or create an account to practice ASL');
      window.location.href = '/login?redirect=/asl-practice';
      return;
    }

    setIsPreparingToRecord(true);
    setPreparationTime(15); // 15 seconds preparation time
    
    const prepTimer = window.setInterval(() => {
      setPreparationTime((prev) => {
        if (prev <= 1) {
          clearInterval(prepTimer);
          setIsPreparingToRecord(false);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    // Check authentication
    if (!user) {
      alert('Please login or create an account to practice ASL');
      window.location.href = '/login?redirect=/asl-practice';
      return;
    }
    
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
      formData.append('languageCode', languageCode);
      
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
      
      // Store result for current student in pair mode
      if (mode === 'pair') {
        if (currentStudent === 1) {
          setStudent1Result(data);
        } else {
          setStudent2Result(data);
        }
      }

      // Refresh practice history after new result
      if (user) {
        fetchPracticeHistory();
      }
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
    setChatMessages([]);
    const nextIndex = tasks.findIndex(t => t.id === selectedTask?.id) + 1;
    setSelectedTask(tasks[nextIndex % tasks.length] || tasks[0]);
    setTimeLeft(selectedTask?.duration || (mode === 'solo' ? 60 : 30));
  };

  const handleTryAgain = () => {
    setResult(null);
    setChatMessages([]);
    setTimeLeft(selectedTask?.duration || (mode === 'solo' ? 60 : 30));
    
    // Clear current student's result in pair mode
    if (mode === 'pair') {
      if (currentStudent === 1) {
        setStudent1Result(null);
      } else {
        setStudent2Result(null);
      }
    }
  };

  const switchStudent = () => {
    setCurrentStudent(currentStudent === 1 ? 2 : 1);
    setResult(currentStudent === 1 ? student2Result : student1Result);
    setTimeLeft(selectedTask?.duration || 30);
    setChatMessages([]); // Clear chat when switching students
  };

  const getSuggestions = () => {
    if (!result) return [];
    
    if (result.score >= 4) {
      return [
        "Why did I get this score?",
        "How can I get 5/5?",
        "Give me an example"
      ];
    } else if (result.score >= 3) {
      return [
        "Why this score?",
        "How to improve?",
        "Give me examples",
        "What did I do wrong?"
      ];
    } else {
      return [
        "How can I improve?",
        "Give me examples",
        "What should I say?",
        "Why low score?"
      ];
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !result || !selectedTask) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsSendingMessage(true);

    try {
      const response = await fetch('/api/asl/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          languageCode,
          context: {
            taskTitle: selectedTask.title,
            taskPrompt: selectedTask.prompt,
            score: result.score,
            fixes: result.fixes,
            transcription: result.transcription,
            mode,
            currentStudent: mode === 'pair' ? currentStudent : undefined
          },
          history: chatMessages
        })
      });

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I had trouble understanding that. Can you try asking differently?',
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const playMessageAudio = async (text: string, index: number) => {
    if (playingMessageIndex === index) return;

    setPlayingMessageIndex(index);
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('TTS failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setPlayingMessageIndex(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setPlayingMessageIndex(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setPlayingMessageIndex(null);
    }
  };

  const playSampleAudio = async (text: string) => {
    if (isPlayingSample) return;

    setIsPlayingSample(true);
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('TTS failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlayingSample(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlayingSample(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsPlayingSample(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4">
      {/* Authentication Required Message */}
      {!user && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <LogIn className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-500 mb-2">Login Required</h3>
              <p className="text-gray-300 text-sm mb-4">
                Please create an account or login to practice ASL (Assessment of Speaking and Listening).
              </p>
              <div className="flex gap-3">
                <a
                  href="/login?redirect=/asl-practice"
                  className="px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm transition-all"
                >
                  Login
                </a>
                <a
                  href="/signup?redirect=/asl-practice"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-all"
                >
                  Create Account
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Compact Controls */}
      <div className="mb-3 space-y-2">
        {/* Class, Task, and Mode in one row */}
        <div className="flex gap-2 items-center">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(Number(e.target.value) as 9 | 10)}
            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
          >
            <option value={9}>Class 9</option>
            <option value={10}>Class 10</option>
          </select>
          
          <button
            onClick={() => {
              setMode('solo');
              setCurrentStudent(1);
              setStudent1Result(null);
              setStudent2Result(null);
              setResult(null);
            }}
            className={`px-3 py-1.5 rounded border transition-all text-sm ${
              mode === 'solo'
                ? 'border-primary bg-primary/20 text-white'
                : 'border-gray-700 bg-gray-900 text-gray-400'
            }`}
          >
            <User className="inline w-4 h-4 mr-1" />
            Solo
          </button>
          <button
            onClick={() => {
              setMode('pair');
              setCurrentStudent(1);
              setStudent1Result(null);
              setStudent2Result(null);
              setResult(null);
            }}
            className={`px-3 py-1.5 rounded border transition-all text-sm ${
              mode === 'pair'
                ? 'border-primary bg-primary/20 text-white'
                : 'border-gray-700 bg-gray-900 text-gray-400'
            }`}
          >
            <Users className="inline w-4 h-4 mr-1" />
            Pair
          </button>
        </div>

        {/* Task Selection and History Button */}
        <div className="flex gap-2">
          <select
            value={selectedTask?.id || ''}
            onChange={(e) => setSelectedTask(tasks.find(t => t.id === e.target.value) || null)}
            className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm"
          >
            {tasks.map(task => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </select>
          {user && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm transition-colors"
            >
              History ({practiceHistory.length})
            </button>
          )}
        </div>

        {/* Student Selector for Pair Mode */}
        {mode === 'pair' && (
          <div className="flex gap-1.5">
            <button
              onClick={() => switchStudent()}
              disabled={isRecording || isProcessing}
              className={`flex-1 py-1 px-2 rounded border transition-all text-xs ${
                currentStudent === 1
                  ? 'border-green-500 bg-green-500/20 text-white font-semibold'
                  : 'border-gray-700 bg-gray-900 text-gray-400'
              } disabled:opacity-50`}
            >
              S1{student1Result && <span className="ml-1 text-yellow-500">★{student1Result.score}</span>}
            </button>
            <button
              onClick={() => switchStudent()}
              disabled={isRecording || isProcessing}
              className={`flex-1 py-1 px-2 rounded border transition-all text-xs ${
                currentStudent === 2
                  ? 'border-green-500 bg-green-500/20 text-white font-semibold'
                  : 'border-gray-700 bg-gray-900 text-gray-400'
              } disabled:opacity-50`}
            >
              S2{student2Result && <span className="ml-1 text-yellow-500">★{student2Result.score}</span>}
            </button>
          </div>
        )}
      </div>

      {/* Practice History */}
      {showHistory && user && (
        <div className="bg-surface rounded-lg border border-gray-800 p-3 mb-3">
          <h3 className="text-lg font-semibold text-white mb-3">Practice History</h3>
          {practiceHistory.length === 0 ? (
            <p className="text-gray-400 text-sm">No practice sessions yet. Start practicing to see your progress!</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {practiceHistory.slice(0, 10).map((practice) => (
                <div key={practice.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{practice.taskTitle}</p>
                    <p className="text-gray-400 text-xs">
                      Class {practice.class} • {practice.mode} • {new Date(practice.practicedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-white text-sm font-semibold">{practice.score}/5</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-surface rounded-lg border border-gray-800 p-3 sm:p-4">
        {!result ? (
          <>
            {/* Task Display */}
            {selectedTask && (
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-semibold text-white mb-1">
                      {selectedTask.title}
                    </h2>
                    <p className="text-gray-300 text-sm mb-1">{selectedTask.prompt}</p>
                    <p className="text-xs text-primary">
                      Duration: {selectedTask.duration}s
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs transition-colors"
                  >
                    {showSampleAnswer ? 'Hide' : 'Sample'}
                  </button>
                </div>

                {/* Sample Answer */}
                {showSampleAnswer && selectedTask.sampleAnswer && (
                  <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-green-400">Sample Answer:</h4>
                      <button
                        onClick={() => playSampleAudio(selectedTask.sampleAnswer!)}
                        disabled={isPlayingSample}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs transition-colors disabled:opacity-50"
                      >
                        {isPlayingSample ? 'Playing...' : '🔊 Listen'}
                      </button>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed italic">
                      "{selectedTask.sampleAnswer}"
                    </p>
                    {selectedTask.tips && (
                      <div className="mt-2 pt-2 border-t border-green-700/30">
                        <p className="text-xs text-green-400 mb-1">Quick Tips:</p>
                        <ul className="text-xs text-gray-400 space-y-1">
                          {selectedTask.tips.map((tip, idx) => (
                            <li key={idx}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Recording Area */}
            <div className="mb-3">
              {/* Waveform Canvas */}
              <canvas
                ref={canvasRef}
                width={600}
                height={80}
                className="w-full rounded-lg mb-3 bg-gray-900"
              />

              {/* Timer and Record Button */}
              <div className="flex flex-col items-center mb-3">
                {isPreparingToRecord ? (
                  <>
                    <div className="text-4xl sm:text-5xl font-bold mb-2 text-yellow-500">
                      {preparationTime}s
                    </div>
                    <div className="p-5 sm:p-6 rounded-full bg-yellow-500 shadow-lg">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Get ready to speak...</p>
                  </>
                ) : (
                  <>
                    <div className={`text-4xl sm:text-5xl font-bold mb-2 ${isRecording ? 'text-red-500' : 'text-gray-500'}`}>
                      {timeLeft}s
                    </div>
                    
                    <button
                      onClick={isRecording ? stopRecording : startPreparation}
                      disabled={isProcessing || isPreparingToRecord}
                      className={`relative p-5 sm:p-6 rounded-full transition-all ${
                        isRecording
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-primary hover:bg-primary-hover'
                      } disabled:opacity-50 shadow-lg`}
                    >
                      {isRecording ? (
                        <>
                          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                          <MicOff className="relative w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </>
                      ) : (
                        <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      )}
                    </button>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      {isRecording ? 'Tap to stop recording' : 'Tap to start (15s prep time)'}
                    </p>
                  </>
                )}
              </div>

              {isProcessing && (
                <div className="text-center py-2">
                  <Loader2 className="inline w-5 h-5 animate-spin text-primary" />
                  <p className="text-gray-400 text-sm mt-1">Analyzing...</p>
                </div>
              )}
            </div>

            {/* New Task Button */}
            <button
              onClick={handleNewTask}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-all text-sm"
            >
              <RefreshCw className="inline w-4 h-4 mr-1" />
              New Task
            </button>
          </>
        ) : (
          <>
            {/* Results Display */}
            <div className="text-center mb-3">
              <h2 className="text-2xl font-bold text-white mb-1">
                Score: {result.score}/5
              </h2>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-2xl ${
                      star <= result.score ? 'text-yellow-500' : 'text-gray-600'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-400">
                {result.score >= 4 ? '✅ Great job!' : result.score >= 3 ? '👍 Good effort!' : '💪 Keep practicing!'}
              </p>
            </div>

            {/* Transcription */}
            {result.transcription && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">What I heard:</h3>
                  <button
                    onClick={() => setShowTranscription(!showTranscription)}
                    className="text-xs text-primary hover:text-blue-300"
                  >
                    {showTranscription ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showTranscription && (
                  <div className="bg-gray-800 p-3 rounded text-sm">
                    <p className="text-gray-300 italic">"{result.transcription}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Feedback */}
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white mb-2">Teacher's feedback:</h3>
              <div className="space-y-2">
                {result.fixes.map((fix, index) => (
                  <div key={index} className="bg-gray-800 p-3 rounded text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-semibold text-lg">{index + 1}.</span>
                      <p className="text-gray-300 leading-relaxed">{fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mb-3">
              <button
                onClick={playFeedback}
                disabled={isPlayingFeedback}
                className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                <Volume2 className="w-4 h-4" />
                {isPlayingFeedback ? 'Playing...' : 'Hear Feedback'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleTryAgain}
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover rounded text-white transition-all text-sm"
                >
                  Try Again
                </button>
                <button
                  onClick={handleNewTask}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-all text-sm"
                >
                  <RefreshCw className="inline w-4 h-4 mr-1" />
                  New Task
                </button>
              </div>
            </div>

            {/* Follow-up Chat */}
            <div className="border-t border-gray-700 pt-3">
              <h3 className="text-sm font-semibold text-white mb-2">Ask me anything:</h3>
              
              {/* Quick Suggestions */}
              {chatMessages.length === 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {getSuggestions().map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(suggestion)}
                      disabled={isSendingMessage}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition-all disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Messages */}
              {chatMessages.length > 0 && (
                <div className="max-h-48 overflow-y-auto mb-2 space-y-2">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg p-2 text-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-800 text-gray-300'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.role === 'assistant' && (
                          <button
                            onClick={() => playMessageAudio(msg.content, idx)}
                            disabled={playingMessageIndex === idx}
                            className="mt-1 text-xs text-gray-400 hover:text-white flex items-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" />
                            {playingMessageIndex === idx ? 'Playing...' : 'Play'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && sendMessage(chatInput)}
                  placeholder="Type your question..."
                  disabled={isSendingMessage}
                  className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-sm placeholder-gray-500 disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(chatInput)}
                  disabled={isSendingMessage || !chatInput.trim()}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover rounded text-white text-sm transition-all disabled:opacity-50"
                >
                  {isSendingMessage ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ASLPracticePage;
