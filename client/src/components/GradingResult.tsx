import React, { useState } from 'react';
import { AlertCircle, BookOpen, Languages, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import AnnotatedExamViewer from './AnnotatedExamViewer';
import VoiceChatModal from './VoiceChatModal';

interface DetailedAnalysis {
    id?: string;
    question: string;
    studentAnswer: string;
    correct: boolean;
    score: string;
    remarks: string;
    topic?: string;
    concept?: string;
    position?: { x: number; y: number };
}

interface Annotation {
    id: string;
    type: 'checkmark' | 'cross' | 'score' | 'comment';
    position: { x: number; y: number };
    color: 'green' | 'red' | 'yellow';
    text?: string;
    questionId: string;
    clickable: boolean;
}

interface GradingResultProps {
    result: {
        subject: string;
        language: string;
        gradeLevel?: string;
        totalScore: string;
        feedback: string;
        detailedAnalysis: DetailedAnalysis[];
        imageDimensions?: { width: number; height: number };
        annotations?: Annotation[];
        rawResponse?: string;
        error?: string;
    };
    imageUrl?: string;
    onReset: () => void;
}

const GradingResult: React.FC<GradingResultProps> = ({ result, imageUrl, onReset }) => {
    const [selectedQuestion, setSelectedQuestion] = useState<DetailedAnalysis | null>(null);
    const { user } = useAuth();

    const handleAnnotationClick = (_annotation: Annotation, question: DetailedAnalysis) => {
        // Ensure question has an ID
        const questionWithId = {
            ...question,
            id: question.id || `q-${Date.now()}`
        };
        setSelectedQuestion(questionWithId);
    };

    const handleCloseVoiceChat = () => {
        setSelectedQuestion(null);
    };

    if (result.error) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-red-900/20 border border-red-700 rounded-xl text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-400 mb-2">Grading Failed</h2>
                <p className="text-gray-300 mb-4">{result.error}</p>
                {result.rawResponse && (
                    <pre className="text-left bg-black/50 p-4 rounded text-xs overflow-auto max-h-60 text-gray-500">
                        {result.rawResponse}
                    </pre>
                )}
                <button onClick={onReset} className="btn-primary mt-4">Try Again</button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Annotated Exam Viewer (if image available) */}
            {imageUrl && result.annotations && (
                <AnnotatedExamViewer
                    imageUrl={imageUrl}
                    gradingResult={result}
                    onAnnotationClick={handleAnnotationClick}
                />
            )}

            {/* Header Card */}
            <div className="card bg-surface border-l-4 border-l-primary">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Exam Results</h2>
                        <div className="flex items-center space-x-4 text-gray-400">
                            <div className="flex items-center space-x-1">
                                <BookOpen className="h-4 w-4" />
                                <span>{result.subject}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Languages className="h-4 w-4" />
                                <span>{result.language}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Total Score</div>
                        <div className="text-4xl font-black text-primary">{result.totalScore}</div>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="text-2xl">💬</span>
                        <span>Your Teacher's Feedback</span>
                    </h3>
                    <div className="bg-gradient-to-br from-primary/10 via-purple-600/10 to-pink-600/10 rounded-xl p-6 border border-primary/30 shadow-lg">
                        <div className="text-gray-100 leading-relaxed space-y-3 feedback-content">
                            {result.feedback.split('\n').map((line, i) => {
                                if (!line.trim()) return null;
                                
                                // Check if line starts with emoji or bullet
                                const isHeader = /^[🎯✨💪🚀💡🌟👏🔥💯]/.test(line);
                                const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
                                const isSubHeader = line.includes(':') && (isHeader || /^[A-Z]/.test(line));
                                
                                if (isHeader || isSubHeader) {
                                    return (
                                        <div key={i} className="font-bold text-white text-lg mt-5 first:mt-0 flex items-start gap-2">
                                            <span>{line}</span>
                                        </div>
                                    );
                                } else if (isBullet) {
                                    return (
                                        <div key={i} className="ml-6 text-gray-100 flex items-start gap-2">
                                            <span className="text-primary mt-1">•</span>
                                            <span>{line.replace(/^[•\-]\s*/, '')}</span>
                                        </div>
                                    );
                                } else {
                                    return <div key={i} className="text-gray-100 text-base">{line}</div>;
                                }
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Signup Prompt for Guest Users */}
            {!user && (
                <div className="card bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/30">
                    <div className="flex items-start gap-4">
                        <UserPlus className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-white mb-2">Save Your Progress!</h3>
                            <p className="text-gray-300 mb-4">
                                Create a free account to save this result, track your exam history, and see your progress over time.
                            </p>
                            <div className="flex gap-3">
                                <Link to="/signup" className="btn-primary">
                                    Sign Up Free
                                </Link>
                                <Link to="/login" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors font-medium border border-gray-700">
                                    Log In
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-center pt-8">
                <button onClick={onReset} className="btn-primary px-8">Grade Another Exam</button>
            </div>

            {/* Voice Chat Modal */}
            {selectedQuestion && (
                <VoiceChatModal
                    questionContext={selectedQuestion as any}
                    onClose={handleCloseVoiceChat}
                />
            )}
        </div>
    );
};

export default GradingResult;
