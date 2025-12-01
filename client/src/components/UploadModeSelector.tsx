import React from 'react';
import { FileText, Files, Layers } from 'lucide-react';

export type UploadMode = 'single' | 'dual' | 'multi-page';

interface UploadModeSelectorProps {
    onModeSelect: (mode: UploadMode) => void;
}

const UploadModeSelector: React.FC<UploadModeSelectorProps> = ({ onModeSelect }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">How would you like to upload your exam?</h2>
                <p className="text-gray-400">Choose the option that matches your exam format</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Single Image Mode */}
                <button
                    onClick={() => onModeSelect('single')}
                    className="group relative bg-surface border-2 border-gray-700 hover:border-primary rounded-xl p-8 transition-all hover:scale-105 text-left"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-gray-800 rounded-full group-hover:bg-primary/20 transition-colors">
                            <FileText className="w-12 h-12 text-primary" />
                        </div>
                        
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Single Image</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Questions + Answers in one image
                            </p>
                        </div>

                        <div className="text-left w-full space-y-2">
                            <p className="text-sm font-semibold text-gray-300">Best for:</p>
                            <ul className="text-sm text-gray-400 space-y-1">
                                <li>• Practice tests</li>
                                <li>• Homework assignments</li>
                                <li>• Quick checks</li>
                                <li>• Combined question-answer sheets</li>
                            </ul>
                        </div>

                        <div className="w-full pt-4">
                            <div className="btn-primary w-full text-center">
                                Select
                            </div>
                        </div>
                    </div>
                </button>

                {/* Dual Image Mode */}
                <button
                    onClick={() => onModeSelect('dual')}
                    className="group relative bg-surface border-2 border-gray-700 hover:border-primary rounded-xl p-8 transition-all hover:scale-105 text-left"
                >
                    <div className="absolute top-4 right-4">
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-bold rounded">
                            RECOMMENDED
                        </span>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-gray-800 rounded-full group-hover:bg-primary/20 transition-colors">
                            <Files className="w-12 h-12 text-primary" />
                        </div>
                        
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Two Images</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Question Paper + Answer Sheet
                            </p>
                        </div>

                        <div className="text-left w-full space-y-2">
                            <p className="text-sm font-semibold text-gray-300">Best for:</p>
                            <ul className="text-sm text-gray-400 space-y-1">
                                <li>• School exams</li>
                                <li>• Formal tests</li>
                                <li>• Separate answer sheets</li>
                                <li>• Reusable question papers</li>
                            </ul>
                        </div>

                        <div className="w-full pt-4">
                            <div className="btn-primary w-full text-center">
                                Select
                            </div>
                        </div>
                    </div>
                </button>

                {/* Multi-Page Mode */}
                <button
                    onClick={() => onModeSelect('multi-page')}
                    className="group relative bg-surface border-2 border-gray-700 hover:border-primary rounded-xl p-8 transition-all hover:scale-105 text-left"
                >
                    <div className="absolute top-4 right-4">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                            NEW
                        </span>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-gray-800 rounded-full group-hover:bg-primary/20 transition-colors">
                            <Layers className="w-12 h-12 text-primary" />
                        </div>
                        
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Multi-Page</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Multiple answer sheet pages
                            </p>
                        </div>

                        <div className="text-left w-full space-y-2">
                            <p className="text-sm font-semibold text-gray-300">Best for:</p>
                            <ul className="text-sm text-gray-400 space-y-1">
                                <li>• Long exams (2-10 pages)</li>
                                <li>• Board exams</li>
                                <li>• Detailed answers</li>
                                <li>• Multiple answer sheets</li>
                            </ul>
                        </div>

                        <div className="w-full pt-4">
                            <div className="btn-primary w-full text-center">
                                Select
                            </div>
                        </div>
                    </div>
                </button>
            </div>

            <div className="text-center">
                <p className="text-sm text-gray-500">
                    💡 Tip: Multi-page mode lets you upload all pages at once for comprehensive grading
                </p>
            </div>
        </div>
    );
};

export default UploadModeSelector;
