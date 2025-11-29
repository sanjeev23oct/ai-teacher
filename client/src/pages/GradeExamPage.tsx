import React, { useState } from 'react';
import ExamUpload from '../components/ExamUpload';
import GradingResult from '../components/GradingResult';
import UploadModeSelector from '../components/UploadModeSelector';
import DualUpload from '../components/DualUpload';

type UploadMode = 'single' | 'dual';

const GradeExamPage: React.FC = () => {
    const [uploadMode, setUploadMode] = useState<UploadMode | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

    const handleUpload = async (file: File) => {
        console.log('handleUpload called with file:', file.name);
        setIsUploading(true);
        
        // Create object URL for the uploaded image
        const imageUrl = URL.createObjectURL(file);
        setUploadedImageUrl(imageUrl);
        
        const formData = new FormData();
        formData.append('exam', file);

        try {
            console.log('Sending request to API...');
            const response = await fetch('http://localhost:3001/api/grade', {
                method: 'POST',
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
            const response = await fetch('http://localhost:3001/api/grade', {
                method: 'POST',
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
            {!result ? (
                <>
                    {!uploadMode ? (
                        // Step 1: Select upload mode
                        <>
                            <div className="text-center space-y-4 mb-8">
                                <h1 className="text-4xl font-bold text-white">AI Exam Grader</h1>
                                <p className="text-gray-400 max-w-2xl mx-auto">
                                    Upload your exam and get instant AI-powered grading with detailed feedback
                                </p>
                            </div>
                            <UploadModeSelector onModeSelect={setUploadMode} />
                        </>
                    ) : (
                        // Step 2: Upload files based on mode
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-white">
                                        {uploadMode === 'single' ? 'Upload Exam' : 'Upload Question Paper & Answer Sheet'}
                                    </h1>
                                    <p className="text-gray-400 mt-2">
                                        {uploadMode === 'single' 
                                            ? 'Upload a single image with questions and answers'
                                            : 'Upload the question paper and answer sheet separately'
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={() => setUploadMode(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ← Change Mode
                                </button>
                            </div>

                            {uploadMode === 'single' ? (
                                <ExamUpload onUpload={handleUpload} isUploading={isUploading} />
                            ) : (
                                <DualUpload onUpload={handleDualUpload} isUploading={isUploading} />
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
