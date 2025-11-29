import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

import GradeExamPage from './pages/GradeExamPage';

import VoiceTutorPage from './pages/VoiceTutorPage';

// Placeholders for pages
const Home = () => (
  <div className="text-center py-20">
    <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
      Your Personal AI Teacher
    </h1>
    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
      Grade handwritten exams instantly and learn with an interactive voice tutor.
    </p>
    <div className="flex justify-center space-x-4">
      <a href="/grade" className="btn-primary text-lg px-8 py-3">Start Grading</a>
      <a href="/voice" className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors font-medium border border-gray-700">
        Talk to Tutor
      </a>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/grade" element={<GradeExamPage />} />
          <Route path="/voice" element={<VoiceTutorPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
