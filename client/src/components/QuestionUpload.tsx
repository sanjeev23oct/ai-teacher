import { useState, useRef } from 'react';
import { Camera, Upload, Type } from 'lucide-react';
import CameraCapture from './CameraCapture';

type UploadMode = 'camera' | 'file' | 'text';

interface QuestionUploadProps {
  onImageUpload: (image: File) => void;
  onTextInput: (text: string) => void;
  isLoading: boolean;
}

export default function QuestionUpload({ onImageUpload, onTextInput, isLoading }: QuestionUploadProps) {
  const [mode, setMode] = useState<UploadMode | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleFileSubmit = () => {
    if (selectedFile) {
      onImageUpload(selectedFile);
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  };

  const handleCameraCapture = (imageBlob: Blob) => {
    const file = new File([imageBlob], 'question.jpg', { type: 'image/jpeg' });
    onImageUpload(file);
    setShowCamera(false);
  };

  const handleTextSubmit = () => {
    if (questionText.trim()) {
      onTextInput(questionText.trim());
    }
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
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!mode && (
        <>
          <h2 className="text-xl font-semibold text-white mb-4">Upload Question</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Camera Option */}
          <button
            onClick={() => {
              setMode('camera');
              setShowCamera(true);
            }}
            className="p-6 bg-surface border-2 border-gray-700 rounded-lg hover:border-primary hover:bg-surface/80 transition-all duration-200 flex flex-col items-center gap-3"
          >
            <Camera className="w-12 h-12 text-primary" />
            <span className="text-white font-medium">Take Photo</span>
            <span className="text-sm text-gray-400 text-center">
              Use your camera to capture the question
            </span>
          </button>

          {/* File Upload Option */}
          <button
            onClick={() => setMode('file')}
            className="p-6 bg-surface border-2 border-gray-700 rounded-lg hover:border-primary hover:bg-surface/80 transition-all duration-200 flex flex-col items-center gap-3"
          >
            <Upload className="w-12 h-12 text-primary" />
            <span className="text-white font-medium">Upload Image</span>
            <span className="text-sm text-gray-400 text-center">
              Choose an image from your device
            </span>
          </button>

          {/* Text Input Option */}
          <button
            onClick={() => setMode('text')}
            className="p-6 bg-surface border-2 border-gray-700 rounded-lg hover:border-primary hover:bg-surface/80 transition-all duration-200 flex flex-col items-center gap-3"
          >
            <Type className="w-12 h-12 text-primary" />
            <span className="text-white font-medium">Type Question</span>
            <span className="text-sm text-gray-400 text-center">
              Type or paste your question
            </span>
          </button>
        </div>
        </>
      )}

      {mode === 'text' && (
        <div className="w-full">
          <h2 className="text-xl font-semibold text-white mb-4">Type Your Question</h2>
          <div className="space-y-4">
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type or paste your question here..."
              className="w-full h-48 p-4 bg-surface border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none resize-none"
              disabled={isLoading}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMode(null);
                  setQuestionText('');
                }}
                className="px-6 py-3 bg-surface border border-gray-700 rounded-lg text-white hover:bg-surface/80 transition-colors"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleTextSubmit}
                disabled={!questionText.trim() || isLoading}
                className="flex-1 px-6 py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Getting Explanation...' : 'Get Explanation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'file' && (
        <div className="w-full">
          <h2 className="text-xl font-semibold text-white mb-4">Upload Question Image</h2>
          <div className="space-y-4">
            {!selectedFile ? (
              <div className="p-8 bg-surface border-2 border-dashed border-gray-700 rounded-lg text-center">
                <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
                <p className="text-white mb-2">Click to select an image</p>
                <p className="text-sm text-gray-400 mb-4">Supports JPG, PNG, or other image formats</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors"
                  disabled={isLoading}
                >
                  Choose File
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-surface border-2 border-gray-700 rounded-lg p-4">
                  <p className="text-white mb-2">Selected Image:</p>
                  {previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-96 mx-auto rounded-lg"
                    />
                  )}
                  <p className="text-sm text-gray-400 mt-2">{selectedFile.name}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="px-6 py-3 bg-surface border border-gray-700 rounded-lg text-white hover:bg-surface/80 transition-colors"
                    disabled={isLoading}
                  >
                    Choose Different Image
                  </button>
                  <button
                    onClick={handleFileSubmit}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Getting Explanation...' : 'Get Explanation'}
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setMode(null);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="w-full px-6 py-3 bg-surface border border-gray-700 rounded-lg text-white hover:bg-surface/80 transition-colors"
              disabled={isLoading}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
