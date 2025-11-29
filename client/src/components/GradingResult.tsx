import React from 'react';
import { CheckCircle, XCircle, AlertCircle, BookOpen, Languages } from 'lucide-react';

interface DetailedAnalysis {
    question: string;
    studentAnswer: string;
    correct: boolean;
    score: string;
    remarks: string;
}

interface GradingResultProps {
    result: {
        subject: string;
        language: string;
        totalScore: string;
        feedback: string;
        detailedAnalysis: DetailedAnalysis[];
        rawResponse?: string;
        error?: string;
    };
    onReset: () => void;
}

const GradingResult: React.FC<GradingResultProps> = ({ result, onReset }) => {
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
                    <h3 className="text-lg font-semibold text-white mb-2">Teacher's Feedback</h3>
                    <p className="text-gray-300 leading-relaxed">{result.feedback}</p>
                </div>
            </div>

            {/* Detailed Analysis */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white px-2">Detailed Analysis</h3>
                {result.detailedAnalysis.map((item, index) => (
                    <div key={index} className="card hover:border-gray-600 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className="mt-1">
                                {item.correct ? (
                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-red-500" />
                                )}
                            </div>
                            <div className="flex-grow space-y-2">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-white text-lg">{item.question}</h4>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.correct ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                        {item.score}
                                    </span>
                                </div>

                                <div className="bg-black/30 p-3 rounded-md border border-gray-800">
                                    <span className="text-xs text-gray-500 uppercase block mb-1">Student Answer</span>
                                    <p className="text-gray-300 font-mono text-sm">{item.studentAnswer}</p>
                                </div>

                                <div className="text-sm text-gray-400">
                                    <span className="text-primary font-medium">Remarks: </span>
                                    {item.remarks}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-8">
                <button onClick={onReset} className="btn-primary px-8">Grade Another Exam</button>
            </div>
        </div>
    );
};

export default GradingResult;
