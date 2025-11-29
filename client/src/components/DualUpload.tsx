import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';

interface DualUploadProps {
    onUpload: (questionPaper: File, answerSheet: File) => void;
    isUploading: boolean;
}

const DualUpload: React.FC<DualUploadProps> = ({ onUpload, isUploading }) => {
    const [questionPaper, setQuestionPaper] = useState<File | null>(null);
    const [answerSheet, setAnswerSheet] = useState<File | null>(null);
    const [dragActiveQP, setDragActiveQP] = useState(false);
    const [dragActiveAS, setDragActiveAS] = useState(false);

    const handleDragQP = useCallback((e: React.DragEvent, active: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActiveQP(active);
    }, []);

    const handleDragAS = useCallback((e: React.DragEvent, active: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActiveAS(active);
    }, []);

    const handleDropQP = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActiveQP(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setQuestionPaper(e.dataTransfer.files[0]);
        }
    }, []);

    const handleDropAS = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActiveAS(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setAnswerSheet(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChangeQP = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setQuestionPaper(e.target.files[0]);
        }
    }, []);

    const handleChangeAS = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAnswerSheet(e.target.files[0]);
        }
    }, []);

    const handleSubmit = () => {
        if (questionPaper && answerSheet) {
            onUpload(questionPaper, answerSheet);
        }
    };

    const canSubmit = questionPaper && answerSheet && !isUploading;

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            {/* Question Paper Upload */}
            <div className="space-y-2">
                <label className="block text-lg font-semibold text-white">
                    Step 1: Upload Question Paper
                </label>
                <p className="text-sm text-gray-400 mb-3">
                    The printed or written question paper with all the questions
                </p>
                
                <div
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                        dragActiveQP
                            ? 'border-primary bg-primary/10'
                            : questionPaper
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-gray-700 hover:border-gray-500 bg-surface'
                    }`}
                    onDragEnter={(e) => handleDragQP(e, true)}
                    onDragLeave={(e) => handleDragQP(e, false)}
                    onDragOver={(e) => handleDragQP(e, true)}
                    onDrop={handleDropQP}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleChangeQP}
                        accept="image/*,.pdf"
                        disabled={isUploading}
                    />

                    {!questionPaper ? (
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="p-3 bg-gray-800 rounded-full">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="text-base font-medium text-white">
                                    Drag & drop question paper here
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    or click to browse
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                                <div>
                                    <p className="text-white font-medium">{questionPaper.name}</p>
                                    <p className="text-sm text-gray-400">
                                        {(questionPaper.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setQuestionPaper(null);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                                disabled={isUploading}
                            >
                                <X className="h-5 w-5 text-gray-400 hover:text-red-400" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Answer Sheet Upload */}
            <div className="space-y-2">
                <label className="block text-lg font-semibold text-white">
                    Step 2: Upload Answer Sheet
                </label>
                <p className="text-sm text-gray-400 mb-3">
                    Your handwritten answers with question numbers
                </p>
                
                <div
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                        dragActiveAS
                            ? 'border-primary bg-primary/10'
                            : answerSheet
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-gray-700 hover:border-gray-500 bg-surface'
                    }`}
                    onDragEnter={(e) => handleDragAS(e, true)}
                    onDragLeave={(e) => handleDragAS(e, false)}
                    onDragOver={(e) => handleDragAS(e, true)}
                    onDrop={handleDropAS}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleChangeAS}
                        accept="image/*,.pdf"
                        disabled={isUploading}
                    />

                    {!answerSheet ? (
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="p-3 bg-gray-800 rounded-full">
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="text-base font-medium text-white">
                                    Drag & drop answer sheet here
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    or click to browse
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                                <div>
                                    <p className="text-white font-medium">{answerSheet.name}</p>
                                    <p className="text-sm text-gray-400">
                                        {(answerSheet.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAnswerSheet(null);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                                disabled={isUploading}
                            >
                                <X className="h-5 w-5 text-gray-400 hover:text-red-400" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tip */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                    💡 <strong>Tip:</strong> Make sure your answer sheet has question numbers (1, 2, 3... or Q1, Q2, Q3...) 
                    so we can match them to the questions.
                </p>
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isUploading ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Grading...</span>
                    </>
                ) : (
                    <span>Start Grading</span>
                )}
            </button>
        </div>
    );
};

export default DualUpload;
