import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCcw, Zap, ZapOff, Check, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
    onCapture: (imageBlob: Blob) => void;
    onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

    useEffect(() => {
        checkCameras();
        startCamera();
        return () => {
            stopCamera();
        };
    }, [facingMode]); // Restart camera when facing mode changes

    const checkCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setHasMultipleCameras(videoDevices.length > 1);
        } catch (err) {
            console.error('Error checking cameras:', err);
        }
    };

    const startCamera = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported. Please use HTTPS or localhost.');
            }

            console.log('Requesting camera access...');

            // Request camera access with specified facing mode
            // Try exact facing mode first, fallback to any camera if not available
            let mediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { exact: facingMode },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                });
            } catch (exactError) {
                console.log('Exact facing mode not available, trying ideal...');
                // Fallback to ideal (not exact) - will use any available camera
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: facingMode },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                });
            }

            console.log('Camera access granted!');
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
                console.log('Video playing');
            }

            setIsLoading(false);
        } catch (err: any) {
            console.error('Camera access error:', err);
            let errorMessage = 'Unable to access camera. ';
            
            if (err.name === 'NotAllowedError') {
                errorMessage += 'Please allow camera access in your browser settings.';
            } else if (err.name === 'NotFoundError') {
                errorMessage += 'No camera found on this device.';
            } else if (err.name === 'NotReadableError') {
                errorMessage += 'Camera is already in use by another application.';
            } else if (err.message.includes('HTTPS')) {
                errorMessage += 'Camera requires HTTPS. Please use https:// or localhost.';
            } else {
                errorMessage += err.message || 'Unknown error occurred.';
            }
            
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    const imageUrl = URL.createObjectURL(blob);
                    setCapturedImage(imageUrl);
                    stopCamera();
                }
            }, 'image/jpeg', 0.9);
        }
    };

    const handleRetake = () => {
        if (capturedImage) {
            URL.revokeObjectURL(capturedImage);
        }
        setCapturedImage(null);
        startCamera();
    };

    const handleUseImage = () => {
        if (!canvasRef.current) return;

        canvasRef.current.toBlob((blob) => {
            if (blob) {
                onCapture(blob);
            }
        }, 'image/jpeg', 0.9);
    };

    const toggleFlash = async () => {
        if (!stream) return;

        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;

        if (capabilities.torch) {
            try {
                await track.applyConstraints({
                    advanced: [{ torch: !flashEnabled } as any]
                });
                setFlashEnabled(!flashEnabled);
            } catch (err) {
                console.error('Flash toggle error:', err);
            }
        }
    };

    if (error) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
                <div className="bg-surface rounded-xl p-6 max-w-md w-full text-center">
                    <Camera className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Camera Access Required</h2>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={startCamera}
                            className="w-full btn-primary"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                        💡 Make sure you've allowed camera access in your browser settings
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-50">
            {/* Camera View */}
            {!capturedImage ? (
                <>
                    {/* Video Preview */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />

                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="text-center">
                                <Camera className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" />
                                <p className="text-white">Starting camera...</p>
                            </div>
                        </div>
                    )}

                    {/* Camera Controls */}
                    {!isLoading && (
                        <>
                            {/* Top Bar */}
                            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
                                <button
                                    onClick={onCancel}
                                    className="p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="flex items-center gap-2">
                                    {hasMultipleCameras && (
                                        <button
                                            onClick={() => {
                                                stopCamera();
                                                setFacingMode(facingMode === 'user' ? 'environment' : 'user');
                                            }}
                                            className="p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                            title={facingMode === 'user' ? 'Switch to Rear Camera' : 'Switch to Front Camera'}
                                        >
                                            <RefreshCw className="w-6 h-6" />
                                        </button>
                                    )}

                                    <button
                                        onClick={toggleFlash}
                                        className="p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                        title="Toggle Flash"
                                    >
                                        {flashEnabled ? (
                                            <Zap className="w-6 h-6 text-yellow-400" />
                                        ) : (
                                            <ZapOff className="w-6 h-6" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Grid Overlay (optional) */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className="border border-white/10" />
                                    ))}
                                </div>
                            </div>

                            {/* Bottom Controls */}
                            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/50 to-transparent">
                                <div className="flex items-center justify-center">
                                    <button
                                        onClick={handleCapture}
                                        className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
                                    >
                                        <div className="w-full h-full rounded-full border-2 border-black" />
                                    </button>
                                </div>
                                <p className="text-white text-center mt-4 text-sm">
                                    Tap to capture
                                </p>
                            </div>
                        </>
                    )}
                </>
            ) : (
                /* Preview Captured Image */
                <>
                    <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-full h-full object-contain"
                    />

                    {/* Preview Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={handleRetake}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Retake
                            </button>
                            <button
                                onClick={handleUseImage}
                                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-blue-600 rounded-lg text-white font-medium transition-colors"
                            >
                                <Check className="w-5 h-5" />
                                Use This
                            </button>
                        </div>
                        <p className="text-white text-center mt-4 text-sm">
                            Make sure the image is clear and readable
                        </p>
                    </div>
                </>
            )}

            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraCapture;
