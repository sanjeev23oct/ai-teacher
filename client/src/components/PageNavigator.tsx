import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import AnnotatedExamViewer from './AnnotatedExamViewer';

interface PageData {
    pageNumber: number;
    imageUrl: string;
    annotations: any[];
    imageDimensions?: { width: number; height: number };
    detailedAnalysis: any[];
}

interface PageNavigatorProps {
    pages: PageData[];
    subject: string;
    language: string;
    gradeLevel: string;
    totalScore: string;
    overallFeedback: string;
    onAnnotationClick: (annotation: any, question: any) => void;
}

const PageNavigator: React.FC<PageNavigatorProps> = ({
    pages,
    subject,
    language,
    gradeLevel,
    totalScore,
    overallFeedback,
    onAnnotationClick
}) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [zoom, setZoom] = useState(1);

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && currentPage > 0) {
                setCurrentPage(currentPage - 1);
                setZoom(1);
            } else if (e.key === 'ArrowRight' && currentPage < pages.length - 1) {
                setCurrentPage(currentPage + 1);
                setZoom(1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, pages.length]);

    const handlePrevious = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
            setZoom(1); // Reset zoom when changing pages
        }
    };

    const handleNext = () => {
        if (currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
            setZoom(1); // Reset zoom when changing pages
        }
    };

    const handleThumbnailClick = (index: number) => {
        setCurrentPage(index);
        setZoom(1);
    };

    const currentPageData = pages[currentPage];

    // Transform page data to match AnnotatedExamViewer format
    const gradingResult = {
        subject,
        language,
        gradeLevel,
        totalScore,
        feedback: overallFeedback,
        annotations: currentPageData.annotations,
        imageDimensions: currentPageData.imageDimensions,
        detailedAnalysis: currentPageData.detailedAnalysis
    };

    return (
        <div className="space-y-6">
            {/* Header with Score */}
            <div className="card bg-surface border-l-4 border-l-primary">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Multi-Page Exam Results
                        </h2>
                        <div className="flex items-center gap-4 text-gray-400">
                            <span>{subject}</span>
                            <span>•</span>
                            <span>{language}</span>
                            <span>•</span>
                            <span>{pages.length} pages</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-400 uppercase tracking-wider">Total Score</div>
                        <div className="text-4xl font-black text-primary">{totalScore}</div>
                    </div>
                </div>
            </div>

            {/* Main Content: Thumbnails + Current Page */}
            <div className="grid lg:grid-cols-[200px_1fr] gap-6">
                {/* Thumbnail Sidebar */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Pages</h3>
                    <div className="space-y-2">
                        {pages.map((page, index) => (
                            <button
                                key={page.pageNumber}
                                onClick={() => handleThumbnailClick(index)}
                                className={`w-full group relative rounded-lg overflow-hidden border-2 transition-all ${
                                    currentPage === index
                                        ? 'border-primary ring-2 ring-primary/50'
                                        : 'border-gray-700 hover:border-gray-600'
                                }`}
                            >
                                {/* Page Number Badge */}
                                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold z-10 ${
                                    currentPage === index
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-800 text-gray-300'
                                }`}>
                                    {page.pageNumber}
                                </div>

                                {/* Thumbnail Image */}
                                <img
                                    src={page.imageUrl}
                                    alt={`Page ${page.pageNumber}`}
                                    className="w-full h-32 object-cover"
                                />

                                {/* Hover Overlay */}
                                <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                                    currentPage === index ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                                }`}>
                                    <span className="text-white text-sm font-medium">View</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Current Page View */}
                <div className="space-y-4">
                    {/* Page Controls */}
                    <div className="flex items-center justify-between bg-surface rounded-lg p-4">
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Previous
                        </button>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                                Page {currentPage + 1} of {pages.length}
                            </div>
                            <div className="text-sm text-gray-400">
                                {currentPageData.detailedAnalysis.length} question(s) on this page
                            </div>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={currentPage === pages.length - 1}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <span className="text-gray-400 text-sm min-w-[60px] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Annotated Page View */}
                    <div 
                        className="transition-transform origin-top"
                        style={{ transform: `scale(${zoom})` }}
                    >
                        <AnnotatedExamViewer
                            imageUrl={currentPageData.imageUrl}
                            gradingResult={gradingResult}
                            onAnnotationClick={onAnnotationClick}
                        />
                    </div>
                </div>
            </div>

            {/* Overall Feedback (shown once at bottom) */}
            <div className="card bg-gradient-to-br from-primary/10 via-purple-600/10 to-pink-600/10 border border-primary/30">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    <span>Overall Feedback (All Pages)</span>
                </h3>
                <div className="text-gray-100 leading-relaxed space-y-3">
                    {overallFeedback.split('\n').map((line, i) => {
                        if (!line.trim()) return null;
                        
                        const isHeader = /^[🎯✨💪🚀💡🌟👏🔥💯]/.test(line);
                        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
                        
                        if (isHeader) {
                            return (
                                <div key={i} className="font-bold text-white text-lg mt-4 first:mt-0">
                                    {line}
                                </div>
                            );
                        } else if (isBullet) {
                            return (
                                <div key={i} className="ml-6 flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{line.replace(/^[•\-]\s*/, '')}</span>
                                </div>
                            );
                        } else {
                            return <div key={i}>{line}</div>;
                        }
                    })}
                </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="text-center text-gray-500 text-sm">
                💡 Tip: Use ← → arrow keys to navigate between pages
            </div>
        </div>
    );
};

export default PageNavigator;
