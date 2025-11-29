import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import GradeExamPage from './pages/GradeExamPage';
import VoiceTutorPage from './pages/VoiceTutorPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import HistoryPage from './pages/HistoryPage';
import ExamDetailPage from './pages/ExamDetailPage';

// Home page component
const Home = () => {
  const { user } = useAuth();
  
  return (
    <div className="text-center py-20">
      <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
        Your Personal AI Teacher
      </h1>
      <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
        Grade handwritten exams instantly and learn with an interactive voice tutor.
      </p>
      
      {user ? (
        <div className="flex justify-center space-x-4">
          <a href="/grade" className="btn-primary text-lg px-8 py-3">Grade New Exam</a>
          <a href="/history" className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors font-medium border border-gray-700">
            View History
          </a>
        </div>
      ) : (
        <div>
          <div className="flex justify-center space-x-4 mb-6">
            <a href="/grade" className="btn-primary text-lg px-8 py-3">Try It Now</a>
            <a href="/voice" className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors font-medium border border-gray-700">
              Talk to Tutor
            </a>
          </div>
          <p className="text-gray-500 text-sm">
            <a href="/signup" className="text-primary hover:underline">Sign up free</a> to track your progress
          </p>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth routes without layout */}
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Main routes with layout */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/grade" element={<Layout><GradeExamPage /></Layout>} />
          <Route path="/voice" element={<Layout><VoiceTutorPage /></Layout>} />
          <Route path="/history" element={<Layout><HistoryPage /></Layout>} />
          <Route path="/exams/:id" element={<Layout><ExamDetailPage /></Layout>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
