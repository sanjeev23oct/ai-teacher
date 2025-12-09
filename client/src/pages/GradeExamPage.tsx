import React, { useState } from 'react';
import ExamUpload from '../components/ExamUpload';
import GradingResult from '../components/GradingResult';
import UploadModeSelector from '../components/UploadModeSelector';
import DualUpload from '../components/DualUpload';
import MultiPageUpload from '../components/MultiPageUpload';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

type UploadMode = 'single' | 'dual' | 'multi-page';

const GradeExamPage: React.FC = () => {
    const [uploadMode, setUploadMode] = useState<UploadMode | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [questionPaperId, setQuestionPaperId] = useState<string | null>(null);
    const { token, user } = useAuth();

    const handleUpload = async (file: File) => {
        console.log('handleUpload called with file:', file.name);
        
        // Check authentication
        if (!user) {
            alert('Please login or create an account to grade exams');
            window.location.href = '/login?redirect=/grade-exam';
            return;
        }
        
        setIsUploading(true);
        
        // Create object URL for the uploaded image
        const imageUrl = URL.createObjectURL(file);
        setUploadedImageUrl(imageUrl);
        
        const formData = new FormData();
        formData.append('exam', file);

        try {
            console.log('Sending request to API...');
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch('/api/grade', {
                method: 'POST',
                headers,
                body: formData,
            });

            console.log('Response received:', response.status);
            const data = await response.json();
            console.log('Data:', data);
            setResult(data);
        } catch (error) {
            console.error("Upload failed", error);
            setResult({ error: "Failed to connect to the server. Please ensure the backend is running." });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDualUpload = async (questionPaper: File, answerSheet: File) => {
        console.log('handleDualUpload called');
        setIsUploading(true);
        
        // Create object URL for the answer sheet (for display)
        const imageUrl = URL.createObjectURL(answerSheet);
        setUploadedImageUrl(imageUrl);
        
        const formData = new FormData();
        formData.append('mode', 'dual');
        formData.append('questionPaper', questionPaper);
        formData.append('answerSheet', answerSheet);

        try {
            console.log('Sending dual mode request to API...');
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch('/api/grade', {
                method: 'POST',
                headers,
                body: formData,
            });

            console.log('Response received:', response.status);
            const data = await response.json();
            console.log('Data:', data);
            
            // Store question paper ID for multi-page mode
            if (data.questionPaperId) {
                setQuestionPaperId(data.questionPaperId);
            }
            
            setResult(data);
        } catch (error) {
            console.error("Upload failed", error);
            setResult({ error: "Failed to connect to the server. Please ensure the backend is running." });
        } finally {
            setIsUploading(false);
        }
    };

    const handleMultiPageComplete = (multiPageResult: any) => {
        console.log('Multi-page grading complete:', multiPageResult);
        setResult(multiPageResult);
    };

    const handleReset = () => {
        setResult(null);
        setUploadMode(null);
        if (uploadedImageUrl) {
            URL.revokeObjectURL(uploadedImageUrl);
            setUploadedImageUrl(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Authentication Required Message */}
            {!user && (
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <LogIn className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-yellow-500 mb-2">Login Required</h3>
                            <p className="text-gray-300 text-sm mb-4">
                                Please create an account or login to grade your exams.
                            </p>
                            <div className="flex gap-3">
                                <a
                                    href="/login?redirect=/grade-exam"
                                    className="px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm transition-all"
                                >
                                    Login
                                </a>
                                <a
                                    href="/signup?redirect=/grade-exam"
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-all"
                                >
                                    Create Account
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {!result ? (
                <>
                    {!uploadMode ? (
                        // Step 1: Select upload mode
                        <UploadModeSelector onModeSelect={setUploadMode} />
                    ) : (
                        // Step 2: Upload files based on mode
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-white">
                                        {uploadMode === 'single' && 'Upload Exam'}
                                        {uploadMode === 'dual' && 'Upload Question Paper & Answer Sheet'}
                                        {uploadMode === 'multi-page' && 'Upload Multi-Page Answer Sheet'}
                                    </h1>
                                    <p className="text-gray-400 mt-2">
                                        {uploadMode === 'single' && 'Upload a single image with questions and answers'}
                                        {uploadMode === 'dual' && 'Upload the question paper and answer sheet separately'}
                                        {uploadMode === 'multi-page' && 'Upload multiple pages of your answer sheet'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setUploadMode(null);
                                        setQuestionPaperId(null);
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ← Change Mode
                                </button>
                            </div>

                            {uploadMode === 'single' && (
                                <ExamUpload onUpload={handleUpload} isUploading={isUploading} />
                            )}
                            
                            {uploadMode === 'dual' && (
                                <DualUpload onUpload={handleDualUpload} isUploading={isUploading} />
                            )}
                            
                            {uploadMode === 'multi-page' && questionPaperId && (
                                <MultiPageUpload
                                    questionPaperId={questionPaperId}
                                    onGradingComplete={handleMultiPageComplete}
                                    onCancel={() => {
                                        setUploadMode(null);
                                        setQuestionPaperId(null);
                                    }}
                                />
                            )}
                            
                            {uploadMode === 'multi-page' && !questionPaperId && (
                                <div className="card">
                                    <p className="text-white mb-4">
                                        To use multi-page mode, first upload the question paper:
                                    </p>
                                    <DualUpload 
                                        onUpload={handleDualUpload} 
                                        isUploading={isUploading}
                                        showAnswerSheet={false}
                                    />
                                    <p className="text-gray-400 text-sm mt-4">
                                        💡 After uploading the question paper, you'll be able to upload multiple answer sheet pages
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </>
            ) : (
                <GradingResult 
                    result={result} 
                    imageUrl={uploadedImageUrl || undefined}
                    onReset={handleReset} 
                />
            )}
        </div>
    );
};

export default GradeExamPage;
