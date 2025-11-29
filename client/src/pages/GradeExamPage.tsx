import React, { useState } from 'react';
import ExamUpload from '../components/ExamUpload';
import GradingResult from '../components/GradingResult';

const GradeExamPage: React.FC = () => {
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

    const handleReset = () => {
        setResult(null);
        if (uploadedImageUrl) {
            URL.revokeObjectURL(uploadedImageUrl);
            setUploadedImageUrl(null);
        }
    };

    return (
        <div className="space-y-8">
            {!result ? (
                <>
                    <div className="text-center space-y-4 mb-12">
                        <h1 className="text-4xl font-bold text-white">AI Exam Grader</h1>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Upload a photo of a handwritten exam paper. Our AI will analyze the handwriting,
                            check the answers against academic standards, and provide detailed feedback.
                        </p>
                    </div>
                    <ExamUpload onUpload={handleUpload} isUploading={isUploading} />
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
