import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import SubjectSelector from '../components/SubjectSelector';
import LanguageSelector from '../components/LanguageSelector';
import QuestionUpload from '../components/QuestionUpload';
import { addGuestDoubt } from '../utils/guestDoubtStorage';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/api';
import { getApiUrl } from '../config';

import type { Subject } from '../components/SubjectSelector';
import type { Language } from '../components/LanguageSelector';

type Step = 'subject' | 'language' | 'upload';

export default function DoubtsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('subject');
  const [subject, setSubject] = useState<Subject | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubjectSelect = (selectedSubject: Subject) => {
    setSubject(selectedSubject);
    setStep('language');
  };

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setStep('upload');
  };

  const handleImageUpload = async (image: File) => {
    if (!subject || !language) return;

    // Check authentication
    if (!user) {
      alert('Please login or create an account to ask doubts');
      window.location.href = '/login?redirect=/doubts';
      return;
    }

    // Validate image size (max 10MB)
    if (image.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    // Validate image type
    if (!image.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    setIsLoading(true);
    try {
      // First, try to create a worksheet to detect multiple questions
      const worksheetFormData = new FormData();
      worksheetFormData.append('image', image);
      worksheetFormData.append('subject', subject);
      
      const worksheetResponse = await authenticatedFetch(getApiUrl('/api/worksheets/create'), {
        method: 'POST',
        body: worksheetFormData,
      });

      if (worksheetResponse.ok) {
        const worksheetData = await worksheetResponse.json();
        
        // If multiple questions detected, navigate to worksheet view
        if (worksheetData.totalQuestions > 1) {
          navigate(`/doubts/worksheet/${worksheetData.id}`, { 
            state: { 
              worksheet: worksheetData,
              subject,
              language
            } 
          });
          return;
        }
      }

      // Single question or worksheet detection failed - use regular flow
      const formData = new FormData();
      formData.append('questionImage', image);
      formData.append('subject', subject);
      formData.append('language', language);

      const response = await authenticatedFetch(getApiUrl('/api/doubts/explain'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to get explanation');
      }

      const data = await response.json();
      
      // Store guest doubt ID if not logged in
      if (!user && data.doubtId) {
        addGuestDoubt(data.doubtId);
      }
      
      // Navigate to explanation view with the data
      navigate(`/doubts/${data.doubtId}`, { state: { explanation: data } });
    } catch (error) {
      console.error('Error getting explanation:', error);
      const message = error instanceof Error ? error.message : 'Failed to get explanation. Please try again.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextInput = async (text: string) => {
    if (!subject || !language) return;

    // Validate text length
    if (text.length < 10) {
      alert('Please enter a more detailed question (at least 10 characters)');
      return;
    }

    if (text.length > 5000) {
      alert('Question is too long. Please keep it under 5000 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('questionText', text);
      formData.append('subject', subject);
      formData.append('language', language);

      const response = await authenticatedFetch(getApiUrl('/api/doubts/explain'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to get explanation');
      }

      const data = await response.json();
      
      // Store guest doubt ID if not logged in
      if (!user && data.doubtId) {
        addGuestDoubt(data.doubtId);
      }
      
      // Navigate to explanation view with the data
      navigate(`/doubts/${data.doubtId}`, { state: { explanation: data } });
    } catch (error) {
      console.error('Error getting explanation:', error);
      const message = error instanceof Error ? error.message : 'Failed to get explanation. Please try again.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'language') {
      setStep('subject');
      setLanguage(null);
    } else if (step === 'upload') {
      setStep('language');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-surface rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Getting Explanation...</h3>
            <p className="text-gray-400">Our AI teacher is analyzing your question</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
            disabled={isLoading}
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Ask a Doubt</h1>
            <p className="text-gray-400 mt-1">Get instant explanations for any question</p>
          </div>
        </div>
        
        {/* Authentication Required Message */}
        {!user && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <LogIn className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-500 mb-2">Login Required</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Please create an account or login to ask doubts. We'll save your questions and help you track your learning progress.
                </p>
                <div className="flex gap-3">
                  <a
                    href="/login?redirect=/doubts"
                    className="px-4 py-2 bg-primary hover:bg-blue-700 rounded text-white text-sm transition-all"
                  >
                    Login
                  </a>
                  <a
                    href="/signup?redirect=/doubts"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-all"
                  >
                    Create Account
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex-1 h-2 rounded-full ${step === 'subject' || step === 'language' || step === 'upload' ? 'bg-primary' : 'bg-gray-700'}`} />
          <div className={`flex-1 h-2 rounded-full ${step === 'language' || step === 'upload' ? 'bg-primary' : 'bg-gray-700'}`} />
          <div className={`flex-1 h-2 rounded-full ${step === 'upload' ? 'bg-primary' : 'bg-gray-700'}`} />
        </div>

        {/* Content */}
        <div className="bg-surface rounded-lg p-6 md:p-8">
          {step === 'subject' && (
            <SubjectSelector
              selectedSubject={subject}
              onSelect={handleSubjectSelect}
            />
          )}

          {step === 'language' && (
            <LanguageSelector
              selectedLanguage={language}
              onSelect={handleLanguageSelect}
            />
          )}

          {step === 'upload' && (
            <QuestionUpload
              onImageUpload={handleImageUpload}
              onTextInput={handleTextInput}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Selected Info */}
        {(subject || language) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {subject && (
              <div className="px-4 py-2 bg-surface rounded-full text-sm text-white">
                Subject: <span className="font-semibold">{subject}</span>
              </div>
            )}
            {language && (
              <div className="px-4 py-2 bg-surface rounded-full text-sm text-white">
                Language: <span className="font-semibold">{language}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
