import React from 'react';
import Navigation from './Navigation';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-text flex flex-col">
            <Navigation />
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {children}
            </main>
            <footer className="bg-surface border-t border-gray-800 py-6">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} StudyBuddy. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Layout;
