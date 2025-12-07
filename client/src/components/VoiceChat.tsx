import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader2, Send, BookOpen, GraduationCap } from 'lucide-react';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const VoiceChat: React.FC = () => {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const [transcript, setTranscript] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastResponseText, setLastResponseText] = useState<string>('');
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-IN'; // Default to Indian English

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                if (transcript) {
                    handleSendMessage(transcript);
                }
            };
        } else {
            console.error("Speech recognition not supported");
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            synthRef.current.cancel();
        };
    }, [transcript]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleStartSession = () => {
        if (selectedClass && selectedSubject) {
            setIsConfigured(true);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const newMessages = [...messages, { role: 'user' as const, text }];
        setMessages(newMessages);
        setTranscript('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/voice-tutor/chat', {
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

            const data = await response.json();
            const aiResponse = data.text;

            setMessages(prev => [...prev, { role: 'model' as const, text: aiResponse }]);
            setLastResponseText(aiResponse);
            
            // Start speaking immediately without waiting
            speak(aiResponse).catch(err => console.error('Speech error:', err));

        } catch (error) {
            console.error("Chat failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const stopSpeaking = () => {
        // Stop ElevenLabs audio
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
            stopSpeaking();
        } else if (lastResponseText) {
            speak(lastResponseText).catch(err => console.error('Speech error:', err));
        }
    };

    const speak = async (text: string) => {
        if (!autoPlay) {
            return; // Don't auto-play if disabled
        }

        // Stop any currently playing audio first
        stopSpeaking();

        try {
            setIsSpeaking(true);
            
            console.log('🎤 Attempting ElevenLabs TTS...');
            // Try ElevenLabs first
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            console.log('TTS Response status:', response.status);
            
            if (response.ok) {
                console.log('✅ ElevenLabs TTS success! Playing audio...');
                const audioBlob = await response.blob();
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
            } else {
                console.log('❌ ElevenLabs TTS failed with status:', response.status);
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
                <div className="bg-surface rounded-xl border border-gray-800 p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                            <GraduationCap className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            CBSE Class 10 Voice Tutor
                        </h2>
                        <p className="text-gray-400">
                            Select your subject to start learning
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Class Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Class
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                            >
                                <option value="">Select Class</option>
                                <option value="10">Class 10 (CBSE)</option>
                            </select>
                        </div>

                        {/* Subject Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Subject
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                                {['Mathematics', 'Science', 'English'].map((subject) => (
                                    <button
                                        key={subject}
                                        onClick={() => setSelectedSubject(subject)}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${
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
                            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Learning Session
                        </button>

                        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                            <p className="text-sm text-blue-300">
                                <strong>Note:</strong> This tutor is specialized for CBSE Class 10 only. 
                                It has deep knowledge of the complete syllabus, NCERT textbooks, and exam patterns.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto h-[600px] flex flex-col">
            {/* Header with subject info */}
            <div className="bg-surface rounded-t-xl border border-gray-800 border-b-0 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <div className="text-white font-semibold">Class {selectedClass} - {selectedSubject}</div>
                        <div className="text-xs text-gray-500">CBSE Curriculum</div>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setIsConfigured(false);
                        setMessages([]);
                    }}
                    className="text-sm text-gray-400 hover:text-white"
                >
                    Change Subject
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto space-y-4 p-4 mb-4 bg-surface rounded-b-xl border border-gray-800 border-t-0">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">
                        <p className="mb-2">👋 Hi! I'm your CBSE Class 10 {selectedSubject} tutor.</p>
                        <p className="text-sm">Ask me anything from your syllabus!</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                ? 'bg-primary text-white rounded-br-none'
                                : 'bg-gray-800 text-gray-200 rounded-bl-none'
                            }`}>
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
                                            // Regular text
                                            return (
                                                <div key={i} className="whitespace-pre-wrap">
                                                    {part}
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

            {/* Auto-play toggle */}
            <div className="bg-surface border border-gray-800 border-t-0 px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-400">Auto-play voice responses</span>
                <button
                    type="button"
                    onClick={() => setAutoPlay(!autoPlay)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoPlay ? 'bg-primary' : 'bg-gray-700'
                    }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoPlay ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-3 px-4 pb-4">
                <button
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={`p-4 rounded-full transition-all shadow-lg disabled:opacity-50 ${isListening
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : 'bg-primary hover:bg-primary-hover'
                        }`}
                >
                    {isListening ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
                </button>

                <div className="flex-grow relative">
                    <input
                        type="text"
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(transcript)}
                        placeholder={isListening ? "Listening..." : "Type a message..."}
                        className="input-field pr-10"
                        disabled={isListening}
                    />
                    <button
                        onClick={() => handleSendMessage(transcript)}
                        disabled={!transcript.trim() || isLoading}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>

                {(isSpeaking || lastResponseText) && (
                    <button
                        onClick={togglePlayPause}
                        className={`p-4 rounded-full transition-all shadow-lg ${
                            isSpeaking 
                                ? 'bg-yellow-500 hover:bg-yellow-600' 
                                : 'bg-green-500 hover:bg-green-600'
                        }`}
                        title={isSpeaking ? "Stop speaking" : "Play last response"}
                    >
                        {isSpeaking ? (
                            <Volume2 className="h-6 w-6 text-white" />
                        ) : (
                            <Volume2 className="h-6 w-6 text-white" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default VoiceChat;
