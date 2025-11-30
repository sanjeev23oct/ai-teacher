import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Send, Loader2, Volume2 } from 'lucide-react';

interface QuestionContext {
    id: string;
    question: string;
    studentAnswer: string;
    correct: boolean;
    score: string;
    remarks: string;
    topic?: string;
    concept?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface VoiceChatModalProps {
    questionContext: QuestionContext;
    onClose: () => void;
}

const VoiceChatModal: React.FC<VoiceChatModalProps> = ({ questionContext, onClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [textInput, setTextInput] = useState('');
    const [transcript, setTranscript] = useState('');
    const [autoSpeak, setAutoSpeak] = useState(false);
    
    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load voices on mount
    useEffect(() => {
        if ('speechSynthesis' in window) {
            // Load voices (they may not be immediately available)
            const loadVoices = () => {
                window.speechSynthesis.getVoices();
            };
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result: any) => result.transcript)
                    .join('');
                
                setTranscript(transcript);

                // If final result, send message
                if (event.results[0].isFinal) {
                    handleSendMessage(transcript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                setTranscript('');
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSendMessage = async (message: string) => {
        if (!message.trim()) return;

        const userMessage: Message = {
            role: 'user',
            content: message,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setTextInput('');
        setTranscript('');
        setIsProcessing(true);

        try {
            const response = await fetch('http://localhost:3001/api/voice/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    context: {
                        questionId: questionContext.id,
                        question: questionContext.question,
                        studentAnswer: questionContext.studentAnswer,
                        feedback: questionContext.remarks,
                        topic: questionContext.topic || 'Mathematics',
                        concept: questionContext.concept
                    },
                    message: message,
                    conversationHistory: messages
                })
            });

            const data = await response.json();

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.text,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Speak the response immediately if auto-speak is enabled (no delay)
            if (autoSpeak) {
                // Start speaking immediately without waiting for state update
                speakText(data.text);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
        }
    };

    const cleanTextForSpeech = (text: string): string => {
        return text
            // Remove markdown bold/italic
            .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
            .replace(/\*\*(.+?)\*\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/_(.+?)_/g, '$1')
            // Remove markdown headers
            .replace(/^#+\s+/gm, '')
            // Remove markdown lists
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/^\s*\d+\.\s+/gm, '')
            // Remove code blocks
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`(.+?)`/g, '$1')
            // Remove links but keep text
            .replace(/\[(.+?)\]\(.+?\)/g, '$1')
            // Convert math symbols to spoken words
            .replace(/θ/g, 'theta')
            .replace(/α/g, 'alpha')
            .replace(/β/g, 'beta')
            .replace(/γ/g, 'gamma')
            .replace(/π/g, 'pi')
            .replace(/Σ/g, 'sigma')
            .replace(/Δ/g, 'delta')
            .replace(/∞/g, 'infinity')
            .replace(/√/g, 'square root of')
            .replace(/≈/g, 'approximately equals')
            .replace(/≠/g, 'not equals')
            .replace(/≤/g, 'less than or equal to')
            .replace(/≥/g, 'greater than or equal to')
            .replace(/×/g, 'times')
            .replace(/÷/g, 'divided by')
            .replace(/²/g, ' squared')
            .replace(/³/g, ' cubed')
            // Convert common math terms
            .replace(/sin\s*θ/gi, 'sine theta')
            .replace(/cos\s*θ/gi, 'cosine theta')
            .replace(/tan\s*θ/gi, 'tangent theta')
            .replace(/cosec\s*θ/gi, 'cosecant theta')
            .replace(/sec\s*θ/gi, 'secant theta')
            .replace(/cot\s*θ/gi, 'cotangent theta')
            .replace(/sin²\s*θ/gi, 'sine squared theta')
            .replace(/cos²\s*θ/gi, 'cosine squared theta')
            .replace(/\bsinθ\b/gi, 'sine theta')
            .replace(/\bcosθ\b/gi, 'cosine theta')
            .replace(/\btanθ\b/gi, 'tangent theta')
            // Remove extra whitespace
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };

    const speakText = async (text: string) => {
        const cleanText = cleanTextForSpeech(text);

        try {
            setIsSpeaking(true);
            
            console.log('🎤 Attempting ElevenLabs TTS...');
            // Try ElevenLabs first
            const response = await fetch('http://localhost:3001/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText })
            });

            console.log('TTS Response status:', response.status);
            
            if (response.ok) {
                console.log('✅ ElevenLabs TTS success! Playing audio...');
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                
                audio.onended = () => {
                    setIsSpeaking(false);
                    URL.revokeObjectURL(audioUrl);
                };
                audio.onerror = () => {
                    setIsSpeaking(false);
                    URL.revokeObjectURL(audioUrl);
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
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            // Clean the text for natural speech
            const cleanedText = cleanTextForSpeech(text);

            const utterance = new SpeechSynthesisUtterance(cleanedText);
            
            // Get available voices and select a better one
            const voices = window.speechSynthesis.getVoices();
            
            // Prefer these voices in order (more natural sounding)
            const preferredVoices = [
                'Google US English',
                'Microsoft Zira - English (United States)',
                'Samantha',
                'Alex',
                'Karen',
                'Daniel'
            ];
            
            let selectedVoice = voices.find(voice => 
                preferredVoices.some(preferred => voice.name.includes(preferred))
            );
            
            // Fallback to any English voice
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
            }
            
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            
            utterance.lang = 'en-US';
            utterance.rate = 0.95; // Slightly slower for clarity
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.speak(utterance);
        }
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (textInput.trim()) {
            handleSendMessage(textInput);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                            Ask About This Question
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2">
                            {questionContext.question}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Question Context */}
                <div className="p-4 bg-gray-900/50 border-b border-gray-700 space-y-2">
                    <div>
                        <span className="text-xs text-gray-500 uppercase">Your Answer:</span>
                        <p className="text-sm text-gray-300 mt-1">{questionContext.studentAnswer}</p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 uppercase">Feedback:</span>
                        <p className="text-sm text-red-400 mt-1">{questionContext.remarks}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            questionContext.correct 
                                ? 'bg-green-900/30 text-green-400' 
                                : 'bg-red-900/30 text-red-400'
                        }`}>
                            {questionContext.score}
                        </span>
                        {questionContext.topic && (
                            <span className="px-2 py-1 rounded text-xs bg-blue-900/30 text-blue-400">
                                {questionContext.topic}
                            </span>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            <p className="mb-2">👋 Hi! I'm here to help you understand this problem.</p>
                            <p className="text-sm">Ask me anything about this question!</p>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                    message.role === 'user'
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-800 text-gray-200'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-sm">
                                        {message.role === 'user' ? '🎤' : '🤖'}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm leading-relaxed">{message.content}</p>
                                        {message.role === 'assistant' && (
                                            <button
                                                onClick={() => speakText(message.content)}
                                                className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                            >
                                                <Volume2 className="w-3 h-3" />
                                                Play audio
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 rounded-lg p-3">
                                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Transcript Display */}
                {transcript && (
                    <div className="px-4 py-2 bg-blue-900/20 border-t border-blue-800/50">
                        <p className="text-sm text-blue-300">
                            <span className="text-blue-500">Listening:</span> {transcript}
                        </p>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-gray-700">
                    {/* Auto-speak toggle */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700">
                        <span className="text-sm text-gray-400">Auto-play responses</span>
                        <button
                            type="button"
                            onClick={() => setAutoSpeak(!autoSpeak)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                autoSpeak ? 'bg-primary' : 'bg-gray-700'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    autoSpeak ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    <form onSubmit={handleTextSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Type your question or use voice..."
                            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
                            disabled={isListening || isProcessing}
                        />
                        
                        <button
                            type="button"
                            onClick={toggleListening}
                            disabled={isProcessing}
                            className={`p-3 rounded-lg transition-all ${
                                isListening
                                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                    : 'bg-primary hover:bg-primary-hover'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isListening ? (
                                <MicOff className="w-5 h-5 text-white" />
                            ) : (
                                <Mic className="w-5 h-5 text-white" />
                            )}
                        </button>

                        {isSpeaking && (
                            <button
                                type="button"
                                onClick={stopSpeaking}
                                className="p-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors"
                            >
                                <Volume2 className="w-5 h-5 text-white" />
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={!textInput.trim() || isProcessing}
                            className="p-3 bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5 text-white" />
                        </button>
                    </form>

                    <p className="text-xs text-gray-500 mt-2 text-center">
                        {isListening ? 'Listening... Speak now' : 'Click mic to speak or type your question'}
                        {!autoSpeak && ' • Click "Play audio" on responses to hear them'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VoiceChatModal;
