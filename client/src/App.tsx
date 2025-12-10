import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

import GradeExamPage from './pages/GradeExamPage';
import VoiceTutorPage from './pages/VoiceTutorPage';
import ASLPracticePage from './pages/ASLPracticePage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import HistoryPage from './pages/HistoryPage';
import ExamDetailPage from './pages/ExamDetailPage';
import DoubtsPage from './pages/DoubtsPage';
import DoubtExplanationPage from './pages/DoubtExplanationPage';
import DoubtsHistoryPage from './pages/DoubtsHistoryPage';
import RevisionAreaPage from './pages/RevisionAreaPage';
import WorksheetViewPage from './pages/WorksheetViewPage';
import RevisionFriendPage from './pages/RevisionFriendPage';
import GroupStudyPage from './pages/GroupStudyPage';
import NCERTExplainerPage from './pages/NCERTExplainerPage';
import DashboardDoubtCard from './components/DashboardDoubtCard';

// Group Study Card (Now Available!)
const GroupStudyCard = () => {
  return (
    <a href="/group-study" className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 rounded-xl p-6 hover:scale-[1.02] transition-all cursor-pointer border border-orange-700/50">
      <div className="text-center">
        <div className="text-5xl mb-4">👥</div>
        <h3 className="text-xl font-bold text-white mb-2">Group Study</h3>
        <p className="text-gray-300 text-sm mb-3">Practice with AI study buddies!</p>
        <ul className="text-gray-400 text-xs space-y-1 text-left">
          <li>✓ Name your own study buddies</li>
          <li>✓ Defend your answers against questions</li>
          <li>✓ Improve handling skills with scoring</li>
        </ul>
      </div>
    </a>
  );
};

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
      fetch('/api/exams/history?limit=3', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setRecentExams(data.exams || []))
        .catch(err => console.error('Failed to fetch exams:', err));
      
      // Fetch stats
      fetch('/api/exams/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error('Failed to fetch stats:', err));

      // Fetch recent doubts
      fetch('/api/dashboard/recent-doubts?limit=5', {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => setRecentDoubts(data.doubts || []))
        .catch(err => console.error('Failed to fetch doubts:', err));

      // Fetch doubt stats
      fetch('/api/dashboard/stats', {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => setDoubtStats(data))
        .catch(err => console.error('Failed to fetch doubt stats:', err));
    }
  }, [user, token]);
  
  return (
    <div className="py-8 sm:py-12">
      <div className="text-center mb-10 px-4">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Padhai Made Easy! 📚
        </h1>
        <p className="text-base sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Your personal AI study buddy in your language! Revise topics, practice speaking, ace your exams!
        </p>
        <p className="text-sm text-gray-500 mb-4">
          🌐 Available in English, Hinglish, Tamil, Telugu, Kannada, Malayalam, Bengali & Punjabi
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <a href="/revision-friend" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3">
            📚 Quick Revise
          </a>
          <a href="/asl" className="px-6 sm:px-8 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors font-medium text-base sm:text-lg">
            🎤 Speaking Practice
          </a>
        </div>
        {!user && (
          <p className="text-gray-500 text-sm mt-6">
            <a href="/signup" className="text-primary hover:underline">Sign up free</a> to save your progress
          </p>
        )}
      </div>

      {/* Main Features - 4 cards */}
      <div className="max-w-5xl mx-auto mt-12 mb-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="/ncert-explainer" className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl p-6 hover:scale-[1.02] transition-all cursor-pointer border border-purple-700/50">
            <div className="text-center">
              <div className="text-5xl mb-4">📖</div>
              <h3 className="text-xl font-bold text-white mb-2">NCERT Explainer</h3>
              <p className="text-gray-300 text-sm mb-3">Class 6-10 chapters explained in Hinglish!</p>
              <ul className="text-gray-400 text-xs space-y-1 text-left">
                <li>✓ AI-powered chapter summaries</li>
                <li>✓ Audio explanations with caching</li>
                <li>✓ Follow-up Q&A for clarity</li>
              </ul>
            </div>
          </a>
          
          <a href="/revision-friend" className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-xl p-6 hover:scale-[1.02] transition-all cursor-pointer border border-green-700/50">
            <div className="text-center">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-white mb-2">Quick Revise</h3>
              <p className="text-gray-300 text-sm mb-3">3-minute revision sessions!</p>
              <ul className="text-gray-400 text-xs space-y-1 text-left">
                <li>✓ AI explains in simple Hinglish</li>
                <li>✓ Quick quiz to test knowledge</li>
                <li>✓ Audio explanations included</li>
              </ul>
            </div>
          </a>
          
          <a href="/asl" className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl p-6 hover:scale-[1.02] transition-all cursor-pointer border border-purple-700/50">
            <div className="text-center">
              <div className="text-5xl mb-4">🎤</div>
              <h3 className="text-xl font-bold text-white mb-2">Speaking Practice</h3>
              <p className="text-gray-300 text-sm mb-3">CBSE speaking tasks with instant AI feedback!</p>
              <ul className="text-gray-400 text-xs space-y-1 text-left">
                <li>✓ Real CBSE speaking topics</li>
                <li>✓ AI scores fluency & grammar</li>
                <li>✓ Practice anytime, anywhere</li>
              </ul>
            </div>
          </a>
          
          <GroupStudyCard />
        </div>
      </div>

      {/* Why StudyBuddy */}
      <div className="max-w-4xl mx-auto mt-12 mb-12 px-4">
        <h2 className="text-2xl font-bold text-center text-white mb-6">Why Students Love Us 💜</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4">
            <div className="text-3xl mb-2">🌐</div>
            <p className="text-white font-medium text-sm">Your Language</p>
            <p className="text-gray-500 text-xs">8 languages supported</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">⚡</div>
            <p className="text-white font-medium text-sm">Super Fast</p>
            <p className="text-gray-500 text-xs">Instant answers</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">🎧</div>
            <p className="text-white font-medium text-sm">Audio Support</p>
            <p className="text-gray-500 text-xs">Listen & learn</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">📱</div>
            <p className="text-white font-medium text-sm">Mobile First</p>
            <p className="text-gray-500 text-xs">Study anywhere</p>
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
        <LanguageProvider>
          <Routes>
              {/* Auth routes without layout */}
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* Main routes with layout */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/grade" element={<Layout><GradeExamPage /></Layout>} />
              <Route path="/voice" element={<Layout><VoiceTutorPage /></Layout>} />
              <Route path="/asl" element={<Layout><ASLPracticePage /></Layout>} />
              <Route path="/history" element={<Layout><HistoryPage /></Layout>} />
              <Route path="/exams/:id" element={<Layout><ExamDetailPage /></Layout>} />
              <Route path="/doubts" element={<Layout><DoubtsPage /></Layout>} />
              <Route path="/doubts/worksheet/:worksheetId" element={<Layout><WorksheetViewPage /></Layout>} />
              <Route path="/doubts/:doubtId" element={<Layout><DoubtExplanationPage /></Layout>} />
              <Route path="/doubts/history" element={<Layout><DoubtsHistoryPage /></Layout>} />
              <Route path="/revision" element={<Layout><RevisionAreaPage /></Layout>} />
              <Route path="/revision-friend" element={<Layout><RevisionFriendPage /></Layout>} />
              <Route path="/group-study" element={<Layout><GroupStudyPage /></Layout>} />
              <Route path="/ncert-explainer" element={<Layout><NCERTExplainerPage /></Layout>} />
            </Routes>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
