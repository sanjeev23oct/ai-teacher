import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, MessageCircle } from 'lucide-react';

interface Annotation {
    id: string;
    type: 'checkmark' | 'cross' | 'score' | 'comment';
    position: { x: number; y: number };
    color: 'green' | 'red' | 'yellow';
    text?: string;
    questionId: string;
    clickable: boolean;
}

interface QuestionAnalysis {
    id?: string;
    questionNumber?: string;
    question: string;
    studentAnswer: string;
    correct: boolean;
    score: string;
    remarks: string;
    topic?: string;
    concept?: string;
    position?: { x: number; y: number };
}

interface GradingResult {
    subject: string;
    language: string;
    gradeLevel?: string;
    totalScore: string;
    feedback: string;
    imageDimensions?: { width: number; height: number };
    annotations?: Annotation[];
    detailedAnalysis: QuestionAnalysis[];
}

interface AnnotatedExamViewerProps {
    imageUrl: string;
    gradingResult: GradingResult;
    onAnnotationClick: (annotation: Annotation, question: QuestionAnalysis) => void;
}

const AnnotatedExamViewer: React.FC<AnnotatedExamViewerProps> = ({
    imageUrl,
    gradingResult,
    onAnnotationClick
}) => {
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (imageRef.current) {
            const updateDimensions = () => {
                if (imageRef.current) {
                    setImageDimensions({
                        width: imageRef.current.offsetWidth,
                        height: imageRef.current.offsetHeight
                    });
                }
            };

            // Update dimensions when image loads
            imageRef.current.addEventListener('load', updateDimensions);
            
            // Update dimensions on window resize
            window.addEventListener('resize', updateDimensions);

            // Initial update
            updateDimensions();

            return () => {
                window.removeEventListener('resize', updateDimensions);
            };
        }
    }, [imageUrl]);

    const handleAnnotationClick = (annotation: Annotation, e: React.MouseEvent) => {
        e.stopPropagation();
        
        // For incorrect marks (cross, red score, red comment), show feedback tooltip
        if (annotation.type === 'cross' || 
            (annotation.type === 'score' && annotation.color === 'red') ||
            (annotation.type === 'comment' && annotation.color === 'red')) {
            setSelectedAnnotation(annotation);
        } else {
            // For correct marks, open voice chat
            const question = gradingResult.detailedAnalysis.find(
                q => q.id === annotation.questionId
            );
            if (question) {
                onAnnotationClick(annotation, question);
            }
        }
    };

    const closeFeedback = () => {
        setSelectedAnnotation(null);
    };

    const renderAnnotation = (annotation: Annotation) => {
        const x = (annotation.position.x / 100) * imageDimensions.width;
        const y = (annotation.position.y / 100) * imageDimensions.height;

        const style: React.CSSProperties = {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            cursor: annotation.clickable ? 'pointer' : 'default',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            transition: 'transform 0.2s',
        };

        switch (annotation.type) {
            case 'checkmark':
                return (
                    <div
                        key={annotation.id}
                        style={style}
                        onClick={(e) => handleAnnotationClick(annotation, e)}
                        className="hover:scale-110 transition-transform"
                        title="Click to ask about this"
                    >
                        <CheckCircle className="w-8 h-8 text-green-500 drop-shadow-lg" strokeWidth={3} />
                    </div>
                );

            case 'cross':
                return (
                    <div
                        key={annotation.id}
                        style={style}
                        onClick={(e) => handleAnnotationClick(annotation, e)}
                        className="hover:scale-110 transition-transform animate-pulse"
                        title="Click to see what went wrong"
                    >
                        <XCircle className="w-8 h-8 text-red-500 drop-shadow-lg" strokeWidth={3} />
                    </div>
                );

            case 'score':
                return (
                    <div
                        key={annotation.id}
                        style={style}
                        onClick={(e) => handleAnnotationClick(annotation, e)}
                        className="hover:scale-110 transition-transform"
                        title={annotation.color === 'red' ? 'Click to see feedback' : 'Great job!'}
                    >
                        <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center
                            font-bold text-sm border-2 drop-shadow-lg
                            ${annotation.color === 'green' 
                                ? 'bg-green-500 border-green-600 text-white' 
                                : 'bg-red-500 border-red-600 text-white'
                            }
                        `}>
                            {annotation.text}
                        </div>
                    </div>
                );

            case 'comment':
                return (
                    <div
                        key={annotation.id}
                        style={style}
                        onClick={(e) => handleAnnotationClick(annotation, e)}
                        className="hover:scale-105 transition-transform"
                    >
                        <div className="relative">
                            <div className={`
                                max-w-xs px-3 py-2 rounded-lg text-sm font-medium
                                flex items-start gap-2 drop-shadow-lg
                                ${annotation.color === 'red' 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-yellow-500 text-gray-900'
                                }
                            `}>
                                <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>{annotation.text}</span>
                            </div>
                            {/* Pointer arrow */}
                            <div className={`
                                absolute -left-2 top-1/2 -translate-y-1/2
                                w-0 h-0 border-t-8 border-b-8 border-r-8
                                border-transparent
                                ${annotation.color === 'red' 
                                    ? 'border-r-red-500' 
                                    : 'border-r-yellow-500'
                                }
                            `} />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="bg-surface p-4 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {gradingResult.subject} - {gradingResult.gradeLevel}
                        </h2>
                        <p className="text-gray-400">{gradingResult.language}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                            {gradingResult.totalScore}
                        </div>
                        <p className="text-sm text-gray-400">Total Score</p>
                    </div>
                </div>
            </div>

            {/* Annotated Image */}
            <div 
                ref={containerRef}
                className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-800"
            >
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Graded exam"
                    className="w-full h-auto"
                />
                
                {/* Annotations Overlay */}
                {imageDimensions.width > 0 && gradingResult.annotations && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="relative w-full h-full pointer-events-auto">
                            {gradingResult.annotations.map(annotation => 
                                renderAnnotation(annotation)
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Hint */}
            <div className="text-center text-gray-400 text-sm">
                💡 Tap ✓ to ask questions • Tap ✗ to see what went wrong
            </div>

            {/* Compact Feedback Tooltip for Incorrect Annotations */}
            {selectedAnnotation && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={closeFeedback}
                >
                    <div 
                        className="bg-surface border border-red-500/30 rounded-xl p-5 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(() => {
                            const question = gradingResult.detailedAnalysis.find(
                                q => q.id === selectedAnnotation.questionId
                            );
                            
                            return (
                                <>
                                    {/* Compact Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" strokeWidth={2.5} />
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-bold text-white">
                                                {selectedAnnotation.text || 'What Went Wrong'}
                                            </h3>
                                            {question && (
                                                <span className="text-xs text-gray-400">
                                                    Question {question.questionNumber || ''} • {question.score}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Compact Feedback */}
                                    <div className="mb-4 p-3 bg-gradient-to-r from-red-900/20 to-orange-900/10 rounded-lg border-l-4 border-red-500">
                                        <div className="text-gray-200 text-sm leading-relaxed">
                                            {question ? question.remarks : 'Review this part of your answer.'}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                        
                        {/* Compact Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={closeFeedback}
                                className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm font-medium transition-colors"
                            >
                                Got it!
                            </button>
                            <button
                                onClick={() => {
                                    const question = gradingResult.detailedAnalysis.find(
                                        q => q.id === selectedAnnotation.questionId
                                    );
                                    if (question) {
                                        closeFeedback();
                                        onAnnotationClick(selectedAnnotation, question);
                                    }
                                }}
                                className="flex-1 px-3 py-2 bg-primary hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-colors"
                            >
                                Ask AI Tutor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overall Feedback */}
            <div className="bg-gradient-to-br from-primary/10 via-purple-600/10 to-pink-600/10 rounded-xl p-6 border border-primary/30 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    <span>Your Teacher's Feedback</span>
                </h3>
                <div className="text-gray-100 leading-relaxed space-y-3">
                    {gradingResult.feedback.split('\n').map((line, i) => {
                        if (!line.trim()) return null;
                        
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
    );
};

export default AnnotatedExamViewer;
