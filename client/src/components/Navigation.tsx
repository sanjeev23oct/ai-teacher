import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, Upload, History, User, LogOut, HelpCircle, BookmarkCheck, Menu, X, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LanguagePreferenceSelector from './LanguagePreferenceSelector';

const Navigation: React.FC = () => {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDesktopMenu, setShowDesktopMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const navigate = useNavigate();
    
    const handleComingSoon = () => {
        setShowComingSoon(true);
        setShowMobileMenu(false);
    };

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
                            {/* Primary 3 links */}
                            <Link to="/revision-friend" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                <BookmarkCheck className="h-4 w-4" />
                                <span>Quick Revise</span>
                            </Link>
                            <Link to="/asl" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                <Mic className="h-4 w-4" />
                                <span>Speaking Practice</span>
                            </Link>
                            <button onClick={handleComingSoon} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>Group Study</span>
                            </button>
                            
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

                {/* Mobile menu */}
                {showMobileMenu && (
                    <div className="md:hidden border-t border-gray-800">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {/* Language preference selector for mobile */}
                            <div className="px-3 py-2 border-b border-gray-700 mb-2">
                                <LanguagePreferenceSelector />
                            </div>
                            <Link to="/" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                                Home
                            </Link>
                            <Link to="/grade" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <Upload className="h-4 w-4" />
                                <span>Grade Exam</span>
                            </Link>
                            <Link to="/doubts" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <HelpCircle className="h-4 w-4" />
                                <span>Ask Doubt</span>
                            </Link>
                            <Link to="/revision-friend" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <BookmarkCheck className="h-4 w-4" />
                                <span>Quick Revise</span>
                            </Link>
                            <Link to="/asl" onClick={closeMobileMenu} className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <Mic className="h-4 w-4" />
                                <span>Speaking Practice</span>
                            </Link>
                            <button onClick={handleComingSoon} className="text-gray-300 hover:text-white w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>Group Study</span>
                            </button>
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

            {/* Coming Soon Modal */}
            {showComingSoon && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowComingSoon(false)}>
                    <div className="bg-surface rounded-xl p-6 max-w-md w-full border border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-4">
                            <div className="text-5xl mb-3">👥</div>
                            <h3 className="text-2xl font-bold text-white mb-2">Group Study - Coming Soon!</h3>
                            <p className="text-gray-400">We're building something amazing for you!</p>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                                <span className="text-2xl">🎯</span>
                                <div>
                                    <h4 className="text-white font-medium">Study with Friends</h4>
                                    <p className="text-gray-400 text-sm">Create study rooms and revise together in real-time</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                                <span className="text-2xl">🏆</span>
                                <div>
                                    <h4 className="text-white font-medium">Quiz Battles</h4>
                                    <p className="text-gray-400 text-sm">Compete with classmates on topic quizzes</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                                <span className="text-2xl">💬</span>
                                <div>
                                    <h4 className="text-white font-medium">Voice Discussions</h4>
                                    <p className="text-gray-400 text-sm">Discuss doubts together with AI moderation</p>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-center text-primary font-medium mb-4">Watch this space! 🚀</p>
                        
                        <button
                            onClick={() => setShowComingSoon(false)}
                            className="w-full py-2 bg-primary hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navigation;
