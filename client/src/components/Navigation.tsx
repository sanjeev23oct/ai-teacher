import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mic, Upload } from 'lucide-react';

const Navigation: React.FC = () => {
    return (
        <nav className="bg-surface border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <GraduationCap className="h-8 w-8 text-primary" />
                            <span className="text-xl font-bold text-white">AI Teacher</span>
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Home
                            </Link>
                            <Link to="/grade" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                <Upload className="h-4 w-4" />
                                <span>Grade Exam</span>
                            </Link>
                            <Link to="/voice" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                <Mic className="h-4 w-4" />
                                <span>Voice Tutor</span>
                            </Link>
                        </div>
                    </div>
                    <div>
                        {/* Auth placeholder */}
                        <button className="btn-primary text-sm">Sign In</button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
