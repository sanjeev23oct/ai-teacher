import React from 'react';
import { FileText, Files, Layers } from 'lucide-react';

export type UploadMode = 'single' | 'dual' | 'multi-page';

interface UploadModeSelectorProps {
    onModeSelect: (mode: UploadMode) => void;
}

const UploadModeSelector: React.FC<UploadModeSelectorProps> = ({ onModeSelect }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-4 px-4">
            <div className="text-center">
                <p className="text-sm text-gray-400">Choose upload format</p>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-6">
                {/* Single Image Mode */}
                <button
                    onClick={() => onModeSelect('single')}
                    className="group relative bg-surface border-2 border-gray-700 hover:border-primary rounded-xl p-4 md:p-8 transition-all hover:scale-105 text-left"
                >
                    <div className="flex md:flex-col items-center md:text-center space-x-4 md:space-x-0 md:space-y-4">
                        <div className="p-3 md:p-4 bg-gray-800 rounded-full group-hover:bg-primary/20 transition-colors">
                            <FileText className="w-8 h-8 md:w-12 md:h-12 text-primary" />
                        </div>
                        
                        <div className="flex-grow text-left md:text-center">
                            <h3 className="text-base md:text-xl font-bold text-white">Single</h3>
                            <p className="text-gray-400 text-xs md:hidden">
                                Questions + Answers in one image
                            </p>
                            <p className="text-gray-400 text-xs hidden md:block">
                                Q+A in one
                            </p>
                        </div>

                        <div className="hidden md:block text-left w-full space-y-2">
                            <p className="text-sm font-semibold text-gray-300">Best for:</p>
                            <ul className="text-sm text-gray-400 space-y-1">
                                <li>• Practice tests</li>
                                <li>• Homework assignments</li>
                                <li>• Quick checks</li>
                            </ul>
                        </div>

                        <div className="md:w-full md:pt-4">
                            <div className="btn-primary px-6 md:w-full text-center text-sm md:text-base py-2 md:py-3">
                                Select
                            </div>
                        </div>
                    </div>
                </button>

                {/* Dual Image Mode */}
                <button
                    onClick={() => onModeSelect('dual')}
                    className="group relative bg-surface border-2 border-gray-700 hover:border-primary rounded-xl p-4 md:p-8 transition-all hover:scale-105 text-left"
                >
                    <div className="absolute top-2 left-2 md:top-4 md:right-4 md:left-auto">
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-bold rounded">
                            ⭐
                        </span>
                    </div>

                    <div className="flex md:flex-col items-center md:text-center space-x-4 md:space-x-0 md:space-y-4">
                        <div className="p-3 md:p-4 bg-gray-800 rounded-full group-hover:bg-primary/20 transition-colors">
                            <Files className="w-8 h-8 md:w-12 md:h-12 text-primary" />
                        </div>
                        
                        <div className="flex-grow text-left md:text-center">
                            <h3 className="text-base md:text-xl font-bold text-white">Dual</h3>
                            <p className="text-gray-400 text-xs md:hidden">
                                Question paper + Answer sheet
                            </p>
                            <p className="text-gray-400 text-xs hidden md:block">
                                Q+A separate
                            </p>
                        </div>

                        <div className="hidden md:block text-left w-full space-y-2">
                            <p className="text-sm font-semibold text-gray-300">Best for:</p>
                            <ul className="text-sm text-gray-400 space-y-1">
                                <li>• School exams</li>
                                <li>• Formal tests</li>
                                <li>• Separate answer sheets</li>
                            </ul>
                        </div>

                        <div className="md:w-full md:pt-4">
                            <div className="btn-primary px-6 md:w-full text-center text-sm md:text-base py-2 md:py-3">
                                Select
                            </div>
                        </div>
                    </div>
                </button>

                {/* Multi-Page Mode */}
                <button
                    onClick={() => onModeSelect('multi-page')}
                    className="group relative bg-surface border-2 border-gray-700 hover:border-primary rounded-xl p-4 md:p-8 transition-all hover:scale-105 text-left"
                >
                    <div className="absolute top-2 left-2 md:top-4 md:right-4 md:left-auto">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                            ✨
                        </span>
                    </div>

                    <div className="flex md:flex-col items-center md:text-center space-x-4 md:space-x-0 md:space-y-4">
                        <div className="p-3 md:p-4 bg-gray-800 rounded-full group-hover:bg-primary/20 transition-colors">
                            <Layers className="w-8 h-8 md:w-12 md:h-12 text-primary" />
                        </div>
                        
                        <div className="flex-grow text-left md:text-center">
                            <h3 className="text-base md:text-xl font-bold text-white">Multi-Page</h3>
                            <p className="text-gray-400 text-xs md:hidden">
                                Multiple answer sheet pages (2-10)
                            </p>
                            <p className="text-gray-400 text-xs hidden md:block">
                                2-10 pages
                            </p>
                        </div>

                        <div className="hidden md:block text-left w-full space-y-2">
                            <p className="text-sm font-semibold text-gray-300">Best for:</p>
                            <ul className="text-sm text-gray-400 space-y-1">
                                <li>• Long exams (2-10 pages)</li>
                                <li>• Board exams</li>
                                <li>• Detailed answers</li>
                            </ul>
                        </div>

                        <div className="md:w-full md:pt-4">
                            <div className="btn-primary px-6 md:w-full text-center text-sm md:text-base py-2 md:py-3">
                                Select
                            </div>
                        </div>
                    </div>
                </button>
            </div>


        </div>
    );
};

export default UploadModeSelector;
