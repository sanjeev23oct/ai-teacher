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
import DoubtsPage from './pages/DoubtsPage';
import DoubtExplanationPage from './pages/DoubtExplanationPage';
import DoubtsHistoryPage from './pages/DoubtsHistoryPage';
import RevisionAreaPage from './pages/RevisionAreaPage';
import DashboardDoubtCard from './components/DashboardDoubtCard';

// Home page component
const Home = () => {
  const { user, token } = useAuth();
  const [recentExams, setRecentExams] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>(null);
  const [recentDoubts, setRecentDoubts] = React.useState<any[]>([]);
  const [doubtStats, setDoubtStats] = React.useState<any>(null);
  
  React.useEffect(() => {
    if (user && token) {
      // Fetch recent exams
      fetch('http://localhost:3001/api/exams/history?limit=3', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setRecentExams(data.exams || []))
        .catch(err => console.error('Failed to fetch exams:', err));
      
      // Fetch stats
      fetch('http://localhost:3001/api/exams/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error('Failed to fetch stats:', err));

      // Fetch recent doubts
      fetch('http://localhost:3001/api/dashboard/recent-doubts?limit=5', {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => setRecentDoubts(data.doubts || []))
        .catch(err => console.error('Failed to fetch doubts:', err));

      // Fetch doubt stats
      fetch('http://localhost:3001/api/dashboard/stats', {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => setDoubtStats(data))
        .catch(err => console.error('Failed to fetch doubt stats:', err));
    }
  }, [user, token]);
  
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Your Personal AI Teacher
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Grade handwritten exams instantly and learn with an interactive voice tutor.
        </p>
        
        {user ? (
          <div className="flex justify-center space-x-4">
            <a href="/grade" className="btn-primary text-lg px-8 py-3">Grade New Exam</a>
            <a href="/doubts" className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors font-medium">
              Ask a Doubt
            </a>
            <a href="/history" className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors font-medium border border-gray-700">
              View History
            </a>
          </div>
        ) : (
          <div>
            <div className="flex justify-center space-x-4 mb-6">
              <a href="/grade" className="btn-primary text-lg px-8 py-3">Grade Exam</a>
              <a href="/doubts" className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors font-medium">
                Ask a Doubt
              </a>
              <a href="/voice" className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors font-medium border border-gray-700">
                Voice Tutor
              </a>
            </div>
            <p className="text-gray-500 text-sm">
              <a href="/signup" className="text-primary hover:underline">Sign up free</a> to track your progress
            </p>
          </div>
        )}
      </div>

      {/* Features Showcase */}
      <div className="max-w-6xl mx-auto mt-16 mb-12">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Everything You Need to Excel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-lg p-6 text-center hover:border-2 hover:border-primary transition-all">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">Instant Grading</h3>
            <p className="text-gray-400 text-sm">Upload handwritten exams and get detailed feedback with visual annotations in seconds</p>
          </div>
          <div className="bg-surface rounded-lg p-6 text-center hover:border-2 hover:border-purple-600 transition-all">
            <div className="text-5xl mb-4">💡</div>
            <h3 className="text-xl font-semibold text-white mb-2">Doubt Solver</h3>
            <p className="text-gray-400 text-sm">Ask any question and get step-by-step explanations in your language with clickable annotations</p>
          </div>
          <div className="bg-surface rounded-lg p-6 text-center hover:border-2 hover:border-primary transition-all">
            <div className="text-5xl mb-4">🎤</div>
            <h3 className="text-xl font-semibold text-white mb-2">Voice Tutor</h3>
            <p className="text-gray-400 text-sm">Have natural conversations with AI in Hinglish for personalized learning</p>
          </div>
        </div>
      </div>

      {/* Stats and Recent Exams for logged-in users */}
      {user && (
        <div className="max-w-4xl mx-auto mt-12">
          {/* Stats Cards */}
          {stats && stats.averageScore !== undefined && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-surface rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-white mb-1">{stats.totalExams || 0}</div>
                <div className="text-gray-400 text-sm">Total Exams</div>
              </div>
              <div className="bg-surface rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">{stats.averageScore?.toFixed(1) || 0}%</div>
                <div className="text-gray-400 text-sm">Average Score</div>
              </div>
              <div className="bg-surface rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {Object.keys(stats.bySubject || {}).length}
                </div>
                <div className="text-gray-400 text-sm">Subjects</div>
              </div>
            </div>
          )}

          {/* Recent Exams */}
          {recentExams.length > 0 && (
            <div className="bg-surface rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recent Exams</h2>
                <a href="/history" className="text-primary hover:underline text-sm">View All →</a>
              </div>
              <div className="space-y-3">
                {recentExams.map((exam: any) => (
                  <a
                    key={exam.id}
                    href={`/exams/${exam.id}`}
                    className="block p-4 bg-background rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{exam.subject}</div>
                        <div className="text-gray-400 text-sm">
                          {new Date(exam.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white">{exam.totalScore}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recent Doubts */}
          {recentDoubts.length > 0 && (
            <div className="bg-surface rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recent Doubts</h2>
                <a href="/doubts/history" className="text-primary hover:underline text-sm">View All →</a>
              </div>
              <div className="space-y-3">
                {recentDoubts.map((doubt: any) => (
                  <DashboardDoubtCard key={doubt.id} doubt={doubt} />
                ))}
              </div>
              {doubtStats && doubtStats.revisionCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <a
                    href="/revision"
                    className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors"
                  >
                    <span className="text-green-400 font-medium">
                      📚 {doubtStats.revisionCount} doubts in revision
                    </span>
                    <span className="text-green-400 text-sm">Review →</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Empty State for Doubts */}
          {recentDoubts.length === 0 && (
            <div className="bg-surface rounded-lg p-8 text-center">
              <div className="text-5xl mb-4">💡</div>
              <h3 className="text-xl font-semibold text-white mb-2">No doubts yet</h3>
              <p className="text-gray-400 mb-4">Start asking questions to get personalized explanations</p>
              <a href="/doubts" className="inline-block px-6 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors">
                Ask Your First Doubt
              </a>
            </div>
          )}
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
          <Route path="/doubts" element={<Layout><DoubtsPage /></Layout>} />
          <Route path="/doubts/:doubtId" element={<Layout><DoubtExplanationPage /></Layout>} />
          <Route path="/doubts/history" element={<Layout><DoubtsHistoryPage /></Layout>} />
          <Route path="/revision" element={<Layout><RevisionAreaPage /></Layout>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
