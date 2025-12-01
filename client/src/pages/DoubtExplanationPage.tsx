import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MessageCircle } from 'lucide-react';
import LatexRenderer from '../components/LatexRenderer';
import RevisionButton from '../components/RevisionButton';
import RatingWidget from '../components/RatingWidget';

interface ExplanationStep {
  number: number;
  title: string;
  explanation: string;
}

interface Annotation {
  type: 'step' | 'concept' | 'formula' | 'highlight';
  position: { x: number; y: number };
  label: string;
}

interface ExplanationData {
  doubtId: string;
  conversationId: string;
  questionImage?: string;
  questionText: string;
  subject: string;
  language: string;
  whatQuestionAsks: string;
  steps: ExplanationStep[];
  finalAnswer: string;
  keyConcepts: string[];
  practiceTip: string;
  annotations: Annotation[];
  imageDimensions?: { width: number; height: number };
  isFavorite?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function DoubtExplanationPage() {
  const { doubtId } = useParams<{ doubtId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [explanation, setExplanation] = useState<ExplanationData | null>(
    location.state?.explanation || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInRevision, setIsInRevision] = useState(false);
  const [currentRating, setCurrentRating] = useState<number | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // If no explanation in state, fetch it
    if (!explanation && doubtId) {
      fetchDoubt();
    }
  }, [doubtId]);

  useEffect(() => {
    // Fetch revision status and rating
    if (doubtId) {
      // Fetch revision status
      fetch(`http://localhost:3001/api/revision/check/${doubtId}`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => setIsInRevision(data.isInRevision))
        .catch((err) => console.error('Error fetching revision status:', err));

      // Fetch rating
      fetch(`http://localhost:3001/api/ratings/${doubtId}`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => setCurrentRating(data.rating))
        .catch((err) => console.error('Error fetching rating:', err));
    }
  }, [doubtId]);

  useEffect(() => {
    // Auto-scroll when messages change
    scrollToBottom();
  }, [messages]);

  const fetchDoubt = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/doubts/${doubtId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Doubt not found');
        }
        throw new Error('Failed to fetch doubt');
      }

      const data = await response.json();
      setExplanation(data.doubt);
      setMessages(data.conversation || []);
    } catch (error) {
      console.error('Error fetching doubt:', error);
      const message = error instanceof Error ? error.message : 'Failed to load doubt';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!doubtId) return;

    try {
      const response = await fetch(`http://localhost:3001/api/doubts/${doubtId}/favorite`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      const data = await response.json();
      setExplanation(prev => prev ? { ...prev, isFavorite: data.isFavorite } : null);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !explanation || isSending) return;

    const userMessage: Message = {
      role: 'user',
      content: newMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsSending(true);

    try {
      const response = await fetch('http://localhost:3001/api/doubts/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: explanation.conversationId,
          doubtId: explanation.doubtId,
          message: newMessage,
          conversationHistory: messages,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  const handleToggleRevision = async (doubtId: string) => {
    try {
      const endpoint = isInRevision
        ? `http://localhost:3001/api/revision/remove/${doubtId}`
        : 'http://localhost:3001/api/revision/add';

      const response = await fetch(endpoint, {
        method: isInRevision ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: isInRevision ? undefined : JSON.stringify({ doubtId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle revision');
      }

      // Update local state
      setIsInRevision(!isInRevision);
    } catch (error) {
      console.error('Error toggling revision:', error);
      throw error;
    }
  };

  const handleRate = async (rating: number) => {
    if (!doubtId) return;

    try {
      const response = await fetch('http://localhost:3001/api/ratings/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ doubtId, rating }),
      });

      if (!response.ok) {
        throw new Error('Failed to rate doubt');
      }

      // Update local state
      setCurrentRating(rating);
    } catch (error) {
      console.error('Error rating doubt:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading explanation...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Oops!</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/doubts')}
            className="px-6 py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Ask New Doubt
          </button>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/doubts')}
              className="p-2 hover:bg-background rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">{explanation.subject}</h1>
              <p className="text-sm text-gray-400">{explanation.language}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              className="p-2 hover:bg-background rounded-lg transition-colors"
            >
              <Star
                className={`w-6 h-6 ${explanation.isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`}
              />
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 hover:bg-background rounded-lg transition-colors"
            >
              <MessageCircle className="w-6 h-6 text-primary" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question */}
            <div className="bg-surface rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Question</h2>
              {explanation.questionImage && (
                <img
                  src={`http://localhost:3001${explanation.questionImage}`}
                  alt="Question"
                  className="w-full rounded-lg mb-4"
                />
              )}
              <p className="text-gray-300">{explanation.questionText}</p>
            </div>

            {/* What Question Asks */}
            <div className="bg-surface rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span>🎯</span> What the question is asking
              </h2>
              <LatexRenderer content={explanation.whatQuestionAsks} className="text-gray-300" />
            </div>

            {/* Steps */}
            <div className="bg-surface rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span>✨</span> Step-by-Step Solution
              </h2>
              <div className="space-y-4">
                {explanation.steps.map((step) => (
                  <div
                    key={step.number}
                    className="border border-gray-700 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                    onClick={() => toggleStep(step.number)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                        <LatexRenderer content={step.explanation} className="text-gray-300 whitespace-pre-wrap" />
                        {expandedSteps.has(step.number) && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-sm text-primary">💡 Click to learn more</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Answer */}
            <div className="bg-surface rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span>🎉</span> Final Answer
              </h2>
              <LatexRenderer content={explanation.finalAnswer} className="text-lg text-green-400 font-semibold" />
            </div>

            {/* Key Concepts */}
            <div className="bg-surface rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span>💪</span> Key Concepts
              </h2>
              <ul className="space-y-2">
                {explanation.keyConcepts.map((concept, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="text-primary">•</span>
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Practice Tip */}
            <div className="bg-surface rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <span>🚀</span> Practice Tip
              </h2>
              <p className="text-gray-300">{explanation.practiceTip}</p>
            </div>

            {/* Revision and Rating */}
            <div className="space-y-4">
              <RevisionButton
                doubtId={explanation.doubtId}
                isInRevision={isInRevision}
                onToggle={handleToggleRevision}
              />
              <RatingWidget
                doubtId={explanation.doubtId}
                currentRating={currentRating}
                onRate={handleRate}
              />
            </div>
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <div className="lg:col-span-1">
              <div className="bg-surface rounded-lg p-4 sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
                <h2 className="text-lg font-semibold text-white mb-4">Ask Follow-up Questions</h2>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {messages.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-8">
                      Ask any questions about this explanation!
                    </p>
                  )}
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-white ml-4'
                          : 'bg-background text-gray-300 mr-4'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                  {isSending && (
                    <div className="p-3 rounded-lg bg-background text-gray-300 mr-4">
                      <p className="text-sm">Thinking...</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-2 bg-background border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                    disabled={isSending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="px-4 py-2 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
