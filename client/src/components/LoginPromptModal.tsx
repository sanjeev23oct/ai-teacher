import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoginPromptModal({ isOpen, onClose, message }: LoginPromptModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-gray-400 mb-6">
            {message || 'Please login to save your doubts and access your history.'}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full px-6 py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Login
            </button>
            <button
              onClick={handleSignup}
              className="w-full px-6 py-3 bg-background border border-gray-700 rounded-lg text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Create Account
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
