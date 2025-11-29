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
    id: string;
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
    gradeLevel: string;
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

    const handleAnnotationClick = (annotation: Annotation) => {
        const question = gradingResult.detailedAnalysis.find(
            q => q.id === annotation.questionId
        );
        if (question) {
            onAnnotationClick(annotation, question);
        }
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
                        onClick={() => handleAnnotationClick(annotation)}
                        className="hover:scale-110 transition-transform"
                    >
                        <CheckCircle className="w-8 h-8 text-green-500 drop-shadow-lg" strokeWidth={3} />
                    </div>
                );

            case 'cross':
                return (
                    <div
                        key={annotation.id}
                        style={style}
                        onClick={() => handleAnnotationClick(annotation)}
                        className="hover:scale-110 transition-transform"
                    >
                        <XCircle className="w-8 h-8 text-red-500 drop-shadow-lg" strokeWidth={3} />
                    </div>
                );

            case 'score':
                return (
                    <div
                        key={annotation.id}
                        style={style}
                        onClick={() => handleAnnotationClick(annotation)}
                        className="hover:scale-110 transition-transform"
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
                        onClick={() => handleAnnotationClick(annotation)}
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
                💡 Tap any mark to ask questions about that problem
            </div>

            {/* Overall Feedback */}
            <div className="bg-surface p-4 rounded-lg border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-2">Overall Feedback</h3>
                <p className="text-gray-300">{gradingResult.feedback}</p>
            </div>
        </div>
    );
};

export default AnnotatedExamViewer;
