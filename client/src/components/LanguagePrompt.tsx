import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguagePromptProps {
  onClose: () => void;
}

const LanguagePrompt: React.FC<LanguagePromptProps> = ({ onClose }) => {
  const { languages, setLanguage, isLoading } = useLanguage();

  const handleSelect = async (code: string) => {
    await setLanguage(code);
    onClose();
  };

  if (isLoading || languages.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl p-6 max-w-lg w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Choose Your Language</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <p className="text-gray-400 mb-6">
          Select your preferred language for explanations and feedback. You can change this anytime from the navigation bar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="p-4 rounded-lg border border-gray-700 hover:border-primary hover:bg-primary/10 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <div>
                  <div className="font-medium text-white group-hover:text-primary transition-colors">
                    {lang.nativeName}
                  </div>
                  <div className="text-sm text-gray-500">{lang.mixName}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          All explanations will be in your selected language mixed with English technical terms
        </p>
      </div>
    </div>
  );
};

export default LanguagePrompt;
