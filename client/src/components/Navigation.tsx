import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mic, Upload, History, User, LogOut, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
        navigate('/');
    };

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
                            <Link to="/doubts" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                <HelpCircle className="h-4 w-4" />
                                <span>Ask Doubt</span>
                            </Link>
                            {user && (
                                <Link to="/history" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                    <History className="h-4 w-4" />
                                    <span>History</span>
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="relative">
                        {user ? (
                            <>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center space-x-2 text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    <User className="h-4 w-4" />
                                    <span>{user.name}</span>
                                </button>
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-gray-700 rounded-lg shadow-lg py-1">
                                        <Link
                                            to="/history"
                                            onClick={() => setShowDropdown(false)}
                                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-background"
                                        >
                                            <History className="h-4 w-4" />
                                            <span>Exam History</span>
                                        </Link>
                                        <Link
                                            to="/doubts/history"
                                            onClick={() => setShowDropdown(false)}
                                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-background"
                                        >
                                            <HelpCircle className="h-4 w-4" />
                                            <span>Doubt History</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-background"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>Log Out</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link to="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Log In
                                </Link>
                                <Link to="/signup" className="btn-primary text-sm">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
