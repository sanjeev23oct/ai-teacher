import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2, Camera } from 'lucide-react';
import CameraCapture from './CameraCapture';

interface ExamUploadProps {
    onUpload: (file: File) => void;
    isUploading: boolean;
}

const ExamUpload: React.FC<ExamUploadProps> = ({ onUpload, isUploading }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [showCamera, setShowCamera] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    }, []);

    const handleSubmit = () => {
        console.log('handleSubmit called, file:', file);
        if (file) {
            console.log('Calling onUpload with file:', file.name);
            onUpload(file);
        } else {
            console.log('No file selected');
        }
    };

    const removeFile = () => {
        setFile(null);
    };

    const handleCameraCapture = (imageBlob: Blob) => {
        // Convert blob to File
        const file = new File([imageBlob], `camera-capture-${Date.now()}.jpg`, {
            type: 'image/jpeg'
        });
        setFile(file);
        setShowCamera(false);
    };

    if (showCamera) {
        return (
            <CameraCapture
                onCapture={handleCameraCapture}
                onCancel={() => setShowCamera(false)}
            />
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                className={`relative border-2 border-dashed rounded-xl p-10 transition-all duration-300 ease-in-out text-center ${dragActive
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-700 hover:border-gray-500 bg-surface'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
                    onChange={handleChange}
                    accept="image/*,.pdf"
                    disabled={isUploading || !!file}
                    style={{ pointerEvents: file ? 'none' : 'auto' }}
                />

                {!file ? (
                    <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="p-4 bg-gray-800 rounded-full">
                            <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-white">
                                Drag & drop your exam paper here
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                or click to browse (Images or PDF)
                            </p>
                        </div>

                        {/* Camera Button */}
                        <div className="flex items-center gap-4 w-full max-w-xs">
                            <div className="flex-1 h-px bg-gray-700" />
                            <span className="text-gray-500 text-sm">or</span>
                            <div className="flex-1 h-px bg-gray-700" />
                        </div>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Camera button clicked!');
                                setShowCamera(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors z-10 relative"
                            style={{ pointerEvents: 'auto' }}
                        >
                            <Camera className="w-5 h-5" />
                            Use Camera
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="flex items-center space-x-3 bg-gray-800 px-4 py-3 rounded-lg border border-gray-700">
                            <FileText className="h-6 w-6 text-blue-400" />
                            <span className="text-white font-medium truncate max-w-xs">{file.name}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent opening file dialog
                                    removeFile();
                                }}
                                className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                                disabled={isUploading}
                            >
                                <X className="h-4 w-4 text-gray-400 hover:text-red-400" />
                            </button>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                console.log('Button clicked!');
                                handleSubmit();
                            }}
                            disabled={isUploading}
                            className="btn-primary w-full max-w-xs flex items-center justify-center space-x-2 mt-4 relative z-10"
                            style={{ pointerEvents: 'auto' }}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Grading...</span>
                                </>
                            ) : (
                                <>
                                    <span>Start Grading</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamUpload;
