import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader2, Send } from 'lucide-react';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const VoiceChat: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

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

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const newMessages = [...messages, { role: 'user' as const, text }];
        setMessages(newMessages);
        setTranscript('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: text,
                    history: messages.map(m => ({
                        role: m.role,
                        parts: [{ text: m.text }]
                    }))
                }),
            });

            const data = await response.json();
            const aiResponse = data.text;

            setMessages(prev => [...prev, { role: 'model' as const, text: aiResponse }]);
            
            // Start speaking immediately without waiting
            speak(aiResponse).catch(err => console.error('Speech error:', err));

        } catch (error) {
            console.error("Chat failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const speak = async (text: string) => {
        try {
            setIsSpeaking(true);
            
            console.log('🎤 Attempting ElevenLabs TTS...');
            // Try ElevenLabs first
            const response = await fetch('http://localhost:3001/api/tts', {
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
        console.log('⚠️ Falling back to browser TTS');
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
    };

    return (
        <div className="max-w-2xl mx-auto h-[600px] flex flex-col">
            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto space-y-4 p-4 mb-4 bg-surface rounded-xl border border-gray-800">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">
                        <p>Tap the microphone to start talking to your AI Teacher.</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                ? 'bg-primary text-white rounded-br-none'
                                : 'bg-gray-800 text-gray-200 rounded-bl-none'
                            }`}>
                            {msg.text}
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

            {/* Controls */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={toggleListening}
                    className={`p-4 rounded-full transition-all shadow-lg ${isListening
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

                {isSpeaking && (
                    <div className="animate-pulse text-primary">
                        <Volume2 className="h-6 w-6" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceChat;
