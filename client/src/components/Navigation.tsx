import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, Upload, History, User, LogOut, HelpCircle, BookmarkCheck, Menu, X, Users, BookOpen, FileText, GraduationCap, Book } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LanguagePreferenceSelector from './LanguagePreferenceSelector';

const Navigation: React.FC = () => {
    const { user, logout, updateUserPreferences } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDesktopMenu, setShowDesktopMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
        setShowMobileMenu(false);
        navigate('/');
    };

    const closeMobileMenu = () => {
        setShowMobileMenu(false);
    };

    return (
        <nav className="bg-surface border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <span className="text-2xl">📚</span>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">StudyBuddy</span>
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {/* Primary links - NCERT first, then Smart Notes */}
                            <Link to="/ncert-explainer" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                <BookOpen className="h-4 w-4" />
                                <span>NCERT Explainer</span>
                            </Link>
                            <Link to="/smart-notes" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                <FileText className="h-4 w-4" />
                                <span>Smart Notes</span>
                            </Link>
                            <Link to="/revision-friend" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                <BookmarkCheck className="h-4 w-4" />
                                <span>Quick Revise</span>
                            </Link>
                            <Link to="/asl" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                <Mic className="h-4 w-4" />
                                <span>Speaking Practice</span>
                            </Link>
                            <Link to="/group-study" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>Group Study</span>
                            </Link>
                            
                            {/* Hamburger menu for other features */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDesktopMenu(!showDesktopMenu)}
                                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                                >
                                    <Menu className="h-4 w-4" />
                                    <span>More</span>
                                </button>
                                {showDesktopMenu && (
                                    <div className="absolute right-0 mt-2 w-56 bg-surface border border-gray-800 rounded-lg shadow-lg py-2 z-50">
                                        <Link
                                            to="/"
                                            onClick={() => setShowDesktopMenu(false)}
                                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-background"
                                        >
                                            <span>Home</span>
                                        </Link>
                                        <Link
                                            to="/grade"
                                            onClick={() => setShowDesktopMenu(false)}
                                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-background"
                                        >
                                            <Upload className="h-4 w-4" />
                                            <span>Grade Exam</span>
                                        </Link>
                                        <Link
                                            to="/doubts"
                                            onClick={() => setShowDesktopMenu(false)}
                                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-background"
                                        >
                                            <HelpCircle className="h-4 w-4" />
                                            <span>Ask Doubt</span>
                                        </Link>
                                        {user && (
                                            <>
                                                <Link
                                                    to="/history"
                                                    onClick={() => setShowDesktopMenu(false)}
                                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-background"
                                                >
                                                    <History className="h-4 w-4" />
                                                    <span>Exam History</span>
                                                </Link>
                                                <Link
                                                    to="/doubts/history"
                                                    onClick={() => setShowDesktopMenu(false)}
                                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-background"
                                                >
                                                    <HelpCircle className="h-4 w-4" />
                                                    <span>Doubt History</span>
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Language preference selector */}
                        <LanguagePreferenceSelector className="hidden md:block" />

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden text-gray-300 hover:text-white p-2"
                        >
                            {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>

                        {/* User dropdown */}
                        <div className="relative hidden md:block">
                            {user ? (
                                <>
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center space-x-2 text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        <User className="h-4 w-4" />
                                        <span>{user.name}</span>
                                        {user.grade && (
                                            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                                                Class {user.grade}
                                            </span>
                                        )}
                                    </button>
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-64 bg-surface border border-gray-700 rounded-lg shadow-lg py-1">
                                        {/* Class Selection */}
                                        <div className="px-4 py-2 border-b border-gray-700">
                                            <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                                                <GraduationCap className="h-3 w-3" />
                                                Class
                                            </label>
                                            <select
                                                value={user.grade || ''}
                                                onChange={(e) => updateUserPreferences(e.target.value, user.preferredSubject || undefined)}
                                                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                            >
                                                <option value="">Select Class</option>
                                                {[6, 7, 8, 9, 10, 11, 12].map(c => (
                                                    <option key={c} value={c.toString()}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Subject Preference */}
                                        <div className="px-4 py-2 border-b border-gray-700">
                                            <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                                                <Book className="h-3 w-3" />
                                                Preferred Subject
                                            </label>
                                            <select
                                                value={user.preferredSubject || ''}
                                                onChange={(e) => updateUserPreferences(user.grade || undefined, e.target.value)}
                                                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                            >
                                                <option value="">Select Subject</option>
                                                <option value="Math">Math</option>
                                                <option value="Science">Science</option>
                                                <option value="English">English</option>
                                                <option value="SST">SST</option>
                                                <option value="Hindi">Hindi</option>
                                            </select>
                                        </div>

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

                {/* Mobile menu */}
                {showMobileMenu && (
                    <div className="md:hidden border-t border-gray-800">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {/* User info with class badge (mobile) */}
                            {user && user.grade && (
                                <div className="px-3 py-2 border-b border-gray-700 mb-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <User className="h-4 w-4" />
                                        <span>{user.name}</span>
                                        <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                                            Class {user.grade}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Class & Subject Selection (mobile) */}
                            {user && (
                                <div className="px-3 py-2 border-b border-gray-700 mb-2 space-y-2">
                                    <div>
                                        <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                                            <GraduationCap className="h-3 w-3" />
                                            Class
                                        </label>
                                        <select
                                            value={user.grade || ''}
                                            onChange={(e) => updateUserPreferences(e.target.value, user.preferredSubject || undefined)}
                                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                        >
                                            <option value="">Select Class</option>
                                            {[6, 7, 8, 9, 10, 11, 12].map(c => (
                                                <option key={c} value={c.toString()}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                                            <Book className="h-3 w-3" />
                                            Preferred Subject
                                        </label>
                                        <select
                                            value={user.preferredSubject || ''}
                                            onChange={(e) => updateUserPreferences(user.grade || undefined, e.target.value)}
                                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                        >
                                            <option value="">Select Subject</option>
                                            <option value="Math">Math</option>
                                            <option value="Science">Science</option>
                                            <option value="English">English</option>
                                            <option value="SST">SST</option>
                                            <option value="Hindi">Hindi</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Language preference selector for mobile */}
                            <div className="px-3 py-2 border-b border-gray-700 mb-2">
                                <LanguagePreferenceSelector />
                            </div>
                            <Link to="/" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                                Home
                            </Link>
                            <Link to="/ncert-explainer" onClick={() => setShowMobileMenu(false)} className="text-gray-300 hover:text-white w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <BookOpen className="h-4 w-4" />
                                <span>NCERT Explainer</span>
                            </Link>
                            <Link to="/smart-notes" onClick={() => setShowMobileMenu(false)} className="text-gray-300 hover:text-white w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span>Smart Notes</span>
                            </Link>
                            <Link to="/revision-friend" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <BookmarkCheck className="h-4 w-4" />
                                <span>Quick Revise</span>
                            </Link>
                            <Link to="/asl" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <Mic className="h-4 w-4" />
                                <span>Speaking Practice</span>
                            </Link>
                            <Link to="/group-study" onClick={() => setShowMobileMenu(false)} className="text-gray-300 hover:text-white w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>Group Study</span>
                            </Link>
                            <Link to="/doubts" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <HelpCircle className="h-4 w-4" />
                                <span>Ask Doubt</span>
                            </Link>
                            <Link to="/grade" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <Upload className="h-4 w-4" />
                                <span>Grade Exam</span>
                            </Link>
                            {user && (
                                <>
                                    <Link to="/history" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                        <History className="h-4 w-4" />
                                        <span>Exam History</span>
                                    </Link>
                                    <Link to="/doubts/history" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                        <HelpCircle className="h-4 w-4" />
                                        <span>Doubt History</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-gray-300 hover:text-white w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Log Out</span>
                                    </button>
                                </>
                            )}
                            {!user && (
                                <>
                                    <Link to="/login" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                                        Log In
                                    </Link>
                                    <Link to="/signup" onClick={closeMobileMenu} className="text-primary hover:text-primary-hover block px-3 py-2 rounded-md text-base font-medium">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </nav>
    );
};

export default Navigation;
