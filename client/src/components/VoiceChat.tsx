import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Send, BookOpen, Camera, X, Menu, ChevronRight, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { nativeSTTService, type STTResult } from '../services/nativeSTTService';

interface Message {
    role: 'user' | 'model';
    text: string;
    image?: string;
}

const VoiceChat: React.FC = () => {
    const { user } = useAuth();
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastResponseText, setLastResponseText] = useState<string>('');
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [showMenu, setShowMenu] = useState(false);
    const [sttError, setSTTError] = useState<string>('');
    const [micPermission, setMicPermission] = useState<boolean | null>(null);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Simple markdown renderer for bold text
    const renderMarkdown = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    useEffect(() => {
        // Check STT support and microphone permission on component mount
        const initializeSTT = async () => {
            if (!nativeSTTService.isSTTSupported()) {
                setSTTError('Speech recognition not supported in this browser');
                return;
            }

            // Check microphone permission
            const hasPermission = await nativeSTTService.checkMicrophonePermission();
            setMicPermission(hasPermission);
            
            if (!hasPermission) {
                console.log('Microphone permission not granted');
            }
        };

        initializeSTT();

        // Cleanup on unmount
        return () => {
            nativeSTTService.cleanup();
            synthRef.current.cancel();
        };
    }, []);

    const toggleListening = async () => {
        if (isListening) {
            // Stop listening
            nativeSTTService.stopListening();
            setIsListening(false);
            setInterimTranscript('');
        } else {
            // Clear any previous errors
            setSTTError('');
            
            // Check microphone permission first
            if (micPermission === false) {
                const hasPermission = await nativeSTTService.requestMicrophonePermission();
                setMicPermission(hasPermission);
                
                if (!hasPermission) {
                    setSTTError('Microphone permission required for voice input');
                    return;
                }
            }

            // Start listening with enhanced STT service
            const success = nativeSTTService.startListening(
                {
                    language: 'en-IN',
                    continuous: false,
                    interimResults: true,
                    maxAlternatives: 1
                },
                {
                    onStart: () => {
                        setIsListening(true);
                        setTranscript('');
                        setInterimTranscript('');
                        console.log('🎤 Started listening');
                    },
                    onEnd: () => {
                        setIsListening(false);
                        setInterimTranscript('');
                        console.log('🎤 Stopped listening');
                        
                        // Send message if we have a final transcript
                        if (transcript.trim()) {
                            handleSendMessage(transcript);
                        }
                    },
                    onResult: (result: STTResult) => {
                        if (result.isFinal) {
                            console.log('🎤 Final result:', result.transcript);
                            setTranscript(result.transcript);
                            setInterimTranscript('');
                        }
                    },
                    onInterimResult: (interimText: string) => {
                        console.log('🎤 Interim result:', interimText);
                        setInterimTranscript(interimText);
                    },
                    onError: (error: string) => {
                        console.error('🎤 STT Error:', error);
                        setSTTError(error);
                        setIsListening(false);
                        setInterimTranscript('');
                    },
                    onNoMatch: () => {
                        console.log('🎤 No speech detected');
                        setSTTError('No speech detected. Please try again.');
                        setIsListening(false);
                        setInterimTranscript('');
                    }
                }
            );

            if (!success) {
                setSTTError('Failed to start speech recognition');
            }
        }
    };

    const handleStartSession = () => {
        if (selectedClass && selectedSubject) {
            setIsConfigured(true);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setUploadedImage(null);
        setImagePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() && !uploadedImage) return;

        // Check authentication
        if (!user) {
            alert('Please login or create an account to use Voice Tutor');
            window.location.href = '/login?redirect=/voice-tutor';
            return;
        }

        // Add user message with image if present
        const userMessage: Message = {
            role: 'user' as const,
            text: text || 'Please explain this image',
            image: imagePreview || undefined
        };
        
        setMessages(prev => [...prev, userMessage]);
        setTranscript('');
        setIsLoading(true);

        try {
            let response;
            
            if (uploadedImage) {
                // Send with image
                const formData = new FormData();
                formData.append('image', uploadedImage);
                formData.append('message', text || 'Please explain this question');
                formData.append('class', selectedClass);
                formData.append('subject', selectedSubject);
                formData.append('history', JSON.stringify(messages.map(m => ({
                    role: m.role,
                    parts: [{ text: m.text }]
                }))));

                response = await fetch('/api/voice-tutor/chat-with-image', {
                    method: 'POST',
                    body: formData,
                });
            } else {
                // Text only
                response = await fetch('/api/voice-tutor/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: text,
                        class: selectedClass,
                        subject: selectedSubject,
                        history: messages.map(m => ({
                            role: m.role,
                            parts: [{ text: m.text }]
                        }))
                    }),
                });
            }

            const data = await response.json();
            const aiResponse = data.text;

            setMessages(prev => [...prev, { role: 'model' as const, text: aiResponse }]);
            setLastResponseText(aiResponse);
            
            // Clear image after sending
            removeImage();
            
            // Start speaking immediately without waiting
            speak(aiResponse).catch(err => console.error('Speech error:', err));

        } catch (error) {
            console.error("Chat failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const pauseSpeaking = () => {
        // Pause ElevenLabs audio (keeps position)
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
        }
        
        // Stop browser TTS (can't pause, only stop)
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }
        
        setIsSpeaking(false);
    };

    const resumeSpeaking = () => {
        // Resume ElevenLabs audio from where it paused
        if (currentAudioRef.current) {
            currentAudioRef.current.play();
            setIsSpeaking(true);
        } else if (lastResponseText) {
            // If no audio ref, start fresh
            speak(lastResponseText).catch(err => console.error('Speech error:', err));
        }
    };

    const stopSpeaking = () => {
        // Stop and reset ElevenLabs audio
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
            currentAudioRef.current = null;
        }
        
        // Stop browser TTS
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }
        
        setIsSpeaking(false);
    };

    const togglePlayPause = () => {
        if (isSpeaking) {
            pauseSpeaking();
        } else {
            resumeSpeaking();
        }
    };

    const speak = async (text: string) => {
        if (!autoPlay) {
            return; // Don't auto-play if disabled
        }

        // Stop any currently playing audio first (reset to beginning)
        stopSpeaking();

        try {
            setIsSpeaking(true);
            
            console.log('🎤 Attempting ElevenLabs streaming TTS...');
            // Try ElevenLabs streaming first (faster response)
            const response = await fetch('/api/tts/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            console.log('TTS Response status:', response.status);
            
            if (response.ok && response.body) {
                console.log('✅ ElevenLabs streaming TTS success! Playing audio...');
                
                // Create MediaSource for streaming playback
                const mediaSource = new MediaSource();
                const audioUrl = URL.createObjectURL(mediaSource);
                const audio = new Audio(audioUrl);
                currentAudioRef.current = audio;
                
                mediaSource.addEventListener('sourceopen', async () => {
                    const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
                    const reader = response.body!.getReader();
                    
                    const pump = async () => {
                        const { done, value } = await reader.read();
                        if (done) {
                            if (!sourceBuffer.updating) {
                                mediaSource.endOfStream();
                            } else {
                                sourceBuffer.addEventListener('updateend', () => {
                                    mediaSource.endOfStream();
                                }, { once: true });
                            }
                            return;
                        }
                        
                        sourceBuffer.appendBuffer(value);
                        sourceBuffer.addEventListener('updateend', pump, { once: true });
                    };
                    
                    pump();
                });
                
                audio.onended = () => {
                    setIsSpeaking(false);
                    URL.revokeObjectURL(audioUrl);
                    currentAudioRef.current = null;
                };
                audio.onerror = () => {
                    setIsSpeaking(false);
                    URL.revokeObjectURL(audioUrl);
                    currentAudioRef.current = null;
                };
                
                await audio.play();
                return;
            } else {
                console.log('❌ ElevenLabs streaming TTS failed, trying regular TTS...');
                
                // Fallback to regular TTS
                const regularResponse = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                
                if (regularResponse.ok) {
                    const audioBlob = await regularResponse.blob();
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    currentAudioRef.current = audio;
                    
                    audio.onended = () => {
                        setIsSpeaking(false);
                        URL.revokeObjectURL(audioUrl);
                        currentAudioRef.current = null;
                    };
                    audio.onerror = () => {
                        setIsSpeaking(false);
                        URL.revokeObjectURL(audioUrl);
                        currentAudioRef.current = null;
                    };
                    
                    await audio.play();
                    return;
                }
            }
        } catch (error) {
            console.log('❌ ElevenLabs TTS error:', error);
        }

        // Fallback to browser TTS
        console.log('⚠️ Falling back to browser TTS');
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
    };

    // Configuration screen
    if (!isConfigured) {
        return (
            <div className="max-w-2xl mx-auto">
                {/* Authentication Required Message */}
                {!user && (
                    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-6">
                        <div className="flex items-start gap-4">
                            <LogIn className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-yellow-500 mb-2">Login Required</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    Please create an account or login to use Voice Tutor.
                                </p>
                                <div className="flex gap-3">
                                    <a
                                        href="/login?redirect=/voice-tutor"
                                        className="px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm transition-all"
                                    >
                                        Login
                                    </a>
                                    <a
                                        href="/signup?redirect=/voice-tutor"
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-all"
                                    >
                                        Create Account
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="bg-surface rounded-xl border border-gray-800 p-4 md:p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Choose Class & Subject</h2>
                    <div className="space-y-4">
                        {/* Class Selection - Grid */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Class
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {['6', '7', '8', '9', '10'].map((cls) => (
                                    <button
                                        key={cls}
                                        onClick={() => setSelectedClass(cls)}
                                        className={`py-2 rounded-lg border-2 transition-all font-semibold ${
                                            selectedClass === cls
                                                ? 'border-primary bg-primary/20 text-white'
                                                : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                                        }`}
                                    >
                                        {cls}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subject Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Subject
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {['Mathematics', 'Science', 'English'].map((subject) => (
                                    <button
                                        key={subject}
                                        onClick={() => setSelectedSubject(subject)}
                                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                                            selectedSubject === subject
                                                ? 'border-primary bg-primary/10 text-white'
                                                : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-5 h-5" />
                                            <div>
                                                <div className="font-semibold">{subject}</div>
                                                <div className="text-xs text-gray-500">
                                                    {subject === 'Mathematics' && 'Algebra, Geometry, Trigonometry, Statistics'}
                                                    {subject === 'Science' && 'Physics, Chemistry, Biology'}
                                                    {subject === 'English' && 'Grammar, Literature, Writing Skills'}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleStartSession}
                            disabled={!selectedClass || !selectedSubject}
                            className="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Learning Session
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-full mx-auto h-[600px] md:h-[700px] flex flex-col">
            {/* Compact Header with Breadcrumb */}
            <div className="bg-surface rounded-t-xl border border-gray-800 border-b-0 px-3 py-2 flex items-center justify-between">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1 text-sm">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-gray-400">Class {selectedClass}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                    <span className="text-white font-medium">{selectedSubject}</span>
                </div>
                
                {/* Menu Button */}
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <Menu className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Dropdown Menu */}
            {showMenu && (
                <div className="bg-gray-900 border-x border-gray-800 px-3 py-2 space-y-2">
                    {/* Auto-play toggle */}
                    <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-gray-400">Auto-play voice</span>
                        <button
                            type="button"
                            onClick={() => setAutoPlay(!autoPlay)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                autoPlay ? 'bg-primary' : 'bg-gray-700'
                            }`}
                        >
                            <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                    autoPlay ? 'translate-x-5' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                    
                    {/* Change Subject */}
                    <button
                        onClick={() => {
                            setIsConfigured(false);
                            setMessages([]);
                            setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Change Subject
                    </button>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto space-y-4 p-4 mb-4 bg-surface rounded-b-xl border border-gray-800 border-t-0">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">
                        <p className="mb-2">👋 Hi! I'm your Class {selectedClass} {selectedSubject} tutor.</p>
                        <p className="text-sm">Ask me anything from your CBSE syllabus!</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                ? 'bg-primary text-white rounded-br-none'
                                : 'bg-gray-800 text-gray-200 rounded-bl-none'
                            }`}>
                            {msg.image && (
                                <img 
                                    src={msg.image} 
                                    alt="Question" 
                                    className="max-w-full rounded mb-2 max-h-48 object-contain"
                                />
                            )}
                            {msg.role === 'model' ? (
                                <div className="space-y-2">
                                    {msg.text.split('```').map((part, i) => {
                                        if (i % 2 === 1) {
                                            // This is inside code block (ASCII art/diagram)
                                            return (
                                                <pre key={i} className="bg-gray-900 p-4 rounded border border-gray-700 overflow-x-auto">
                                                    <code className="text-green-400 font-mono text-sm leading-relaxed">
                                                        {part.trim()}
                                                    </code>
                                                </pre>
                                            );
                                        } else {
                                            // Regular text with markdown rendering
                                            return (
                                                <div key={i} className="whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                                                    {renderMarkdown(part)}
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 p-3 rounded-lg rounded-bl-none flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            <span className="text-gray-400 text-sm">Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
                <div className="bg-surface border border-gray-800 border-t-0 px-4 py-3">
                    <div className="relative inline-block">
                        <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-h-32 rounded border border-gray-700"
                        />
                        <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
            )}

            {/* STT Error Display */}
            {sttError && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mx-4 mb-2">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-400 text-sm">{sttError}</p>
                            {sttError.includes('permission') && (
                                <button
                                    onClick={async () => {
                                        const hasPermission = await nativeSTTService.requestMicrophonePermission();
                                        setMicPermission(hasPermission);
                                        if (hasPermission) {
                                            setSTTError('');
                                        }
                                    }}
                                    className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs transition-colors"
                                >
                                    Grant Permission
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setSTTError('')}
                            className="text-red-500 hover:text-red-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Controls - Mobile Optimized */}
            <div className="px-4 pb-4">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                />
                
                {/* Main Input Row */}
                <div className="flex items-center gap-2">
                    {/* Camera Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-all disabled:opacity-50 flex-shrink-0"
                        title="Upload image"
                    >
                        <Camera className="h-5 w-5 text-white" />
                    </button>

                    {/* Text Input - Takes most space */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={isListening ? interimTranscript : transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(transcript)}
                            placeholder={
                                isListening 
                                    ? "Listening..." 
                                    : micPermission === false 
                                        ? "Microphone permission required"
                                        : "Ask anything..."
                            }
                            className={`w-full px-4 py-3 bg-gray-900 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-500 pr-10 ${
                                isListening 
                                    ? 'border-primary animate-pulse' 
                                    : sttError 
                                        ? 'border-red-500' 
                                        : 'border-gray-700'
                            }`}
                            disabled={isListening}
                        />
                        <button
                            onClick={() => handleSendMessage(transcript)}
                            disabled={(!transcript.trim() && !uploadedImage) || isLoading}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-hover disabled:opacity-30 disabled:text-gray-600"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Mic Button */}
                    <button
                        onClick={toggleListening}
                        disabled={isLoading || (!nativeSTTService.isSTTSupported())}
                        className={`p-3 rounded-full transition-all disabled:opacity-50 flex-shrink-0 ${
                            isListening
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                : micPermission === false
                                    ? 'bg-yellow-500 hover:bg-yellow-600'
                                    : 'bg-primary hover:bg-primary-hover'
                        }`}
                        title={
                            !nativeSTTService.isSTTSupported()
                                ? 'Speech recognition not supported'
                                : micPermission === false
                                    ? 'Click to grant microphone permission'
                                    : isListening
                                        ? 'Stop listening'
                                        : 'Start voice input'
                        }
                    >
                        {isListening ? (
                            <MicOff className="h-5 w-5 text-white" />
                        ) : micPermission === false ? (
                            <AlertCircle className="h-5 w-5 text-white" />
                        ) : (
                            <Mic className="h-5 w-5 text-white" />
                        )}
                    </button>

                    {/* Play/Pause Button - Only show when needed */}
                    {(isSpeaking || lastResponseText) && (
                        <button
                            onClick={togglePlayPause}
                            className={`p-3 rounded-full transition-all flex-shrink-0 ${
                                isSpeaking 
                                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                                    : 'bg-green-500 hover:bg-green-600'
                            }`}
                            title={isSpeaking ? "Pause" : "Play"}
                        >
                            {isSpeaking ? (
                                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceChat;
