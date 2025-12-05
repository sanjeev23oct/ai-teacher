import React, { useState, useRef } from 'react';
import { Upload, X, GripVertical, Plus, Loader2 } from 'lucide-react';

interface PageFile {
    id: string;
    file: File;
    preview: string;
    order: number;
    status: 'pending' | 'uploading' | 'uploaded' | 'error';
}

interface MultiPageUploadProps {
    questionPaperId: string;
    onGradingComplete: (result: any) => void;
    onCancel: () => void;
}

const MultiPageUpload: React.FC<MultiPageUploadProps> = ({ questionPaperId, onGradingComplete, onCancel }) => {
    const [pages, setPages] = useState<PageFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newPages: PageFile[] = [];
        const maxPages = 10;

        if (pages.length + files.length > maxPages) {
            setError(`Maximum ${maxPages} pages allowed`);
            return;
        }

        Array.from(files).forEach((file, index) => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError(`File ${file.name} is not an image`);
                return;
            }

            // Validate file size (5MB max per image)
            if (file.size > 5 * 1024 * 1024) {
                setError(`File ${file.name} is too large (max 5MB)`);
                return;
            }

            const id = `page-${Date.now()}-${index}`;
            const preview = URL.createObjectURL(file);

            newPages.push({
                id,
                file,
                preview,
                order: pages.length + index,
                status: 'pending'
            });
        });

        setPages([...pages, ...newPages]);
        setError(null);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemovePage = (pageId: string) => {
        const page = pages.find(p => p.id === pageId);
        if (page) {
            URL.revokeObjectURL(page.preview);
        }
        setPages(pages.filter(p => p.id !== pageId).map((p, index) => ({ ...p, order: index })));
    };

    const handleReorder = (fromIndex: number, toIndex: number) => {
        const newPages = [...pages];
        const [movedPage] = newPages.splice(fromIndex, 1);
        newPages.splice(toIndex, 0, movedPage);
        setPages(newPages.map((p, index) => ({ ...p, order: index })));
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', index.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/html'));
        if (dragIndex !== dropIndex) {
            handleReorder(dragIndex, dropIndex);
        }
    };

    const handleGradeAll = async () => {
        if (pages.length === 0) return;

        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('questionPaperId', questionPaperId);
            formData.append('mode', 'dual');

            // Add all pages in order
            pages.forEach((page) => {
                formData.append('answerSheetPages', page.file);
            });

            const response = await fetch('/api/grade/multi-page', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to grade pages');
            }

            const result = await response.json();
            onGradingComplete(result);

            // Cleanup previews
            pages.forEach(page => URL.revokeObjectURL(page.preview));
        } catch (err: any) {
            console.error('Grading error:', err);
            setError(err.message || 'Failed to grade pages');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Upload Answer Sheet Pages</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Upload multiple pages of your answer sheet (max 10 pages)
                    </p>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* File Selector */}
            <div className="card">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="multi-page-input"
                />
                <label
                    htmlFor="multi-page-input"
                    className="flex flex-col items-center justify-center py-12 cursor-pointer hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                    <Upload className="w-12 h-12 text-primary mb-4" />
                    <p className="text-white font-medium mb-2">Click to select images</p>
                    <p className="text-gray-400 text-sm">or drag and drop multiple files</p>
                    <p className="text-gray-500 text-xs mt-2">JPG, PNG (max 5MB per image)</p>
                </label>
            </div>

            {/* Page Previews */}
            {pages.length > 0 && (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">
                            {pages.length} Page{pages.length !== 1 ? 's' : ''} Selected
                        </h3>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add More
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {pages.map((page, index) => (
                            <div
                                key={page.id}
                                draggable={!isProcessing}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                                className="relative group bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-primary transition-colors cursor-move"
                            >
                                {/* Page Number */}
                                <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded z-10">
                                    Page {index + 1}
                                </div>

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemovePage(page.id)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    disabled={isProcessing}
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>

                                {/* Preview Image */}
                                <img
                                    src={page.preview}
                                    alt={`Page ${index + 1}`}
                                    className="w-full h-48 object-cover"
                                />

                                {/* Drag Handle */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 p-1 bg-gray-800/90 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="w-4 h-4 text-gray-300" />
                                </div>
                                
                                {/* Drag Indicator */}
                                <div className="absolute inset-0 bg-primary/20 border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        ))}
                    </div>

                    <p className="text-gray-500 text-xs mt-4">
                        💡 Tip: Drag and drop to reorder pages • Make sure they're in the correct order before grading
                    </p>
                </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
                <div className="card">
                    <div className="flex items-center gap-4">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <div className="flex-grow">
                            <p className="text-white font-medium">Processing pages...</p>
                            <p className="text-gray-400 text-sm">
                                Grading {pages.length} page{pages.length !== 1 ? 's' : ''}...
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-primary h-full transition-all duration-300 animate-pulse"
                            style={{ width: '50%' }}
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
                <button
                    onClick={handleGradeAll}
                    disabled={pages.length === 0 || isProcessing}
                    className="flex-1 btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Grading...
                        </span>
                    ) : (
                        `Grade ${pages.length} Page${pages.length !== 1 ? 's' : ''}`
                    )}
                </button>
            </div>
        </div>
    );
};

export default MultiPageUpload;
