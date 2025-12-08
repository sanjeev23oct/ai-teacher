import React from 'react';

// Language options for doubt explanations
export type Language = 
  | 'English'
  | 'Hindi'
  | 'Hinglish'
  | 'Bengali'
  | 'Tamil'
  | 'Telugu'
  | 'Kannada'
  | 'Malayalam'
  | 'Punjabi';

interface LanguageSelectorProps {
  selectedLanguage: Language | null;
  onSelect: (language: Language) => void;
}

const languages: { value: Language; label: string; description: string }[] = [
  { value: 'Hinglish', label: 'Hinglish', description: 'Hindi-English mix - Most popular!' },
  { value: 'English', label: 'English', description: 'Pure English explanations' },
  { value: 'Hindi', label: 'Hindi', description: 'शुद्ध हिंदी में समझाएं' },
  { value: 'Bengali', label: 'Bengali', description: 'বাংলায় ব্যাখ্যা' },
  { value: 'Tamil', label: 'Tamil', description: 'தமிழில் விளக்கம்' },
  { value: 'Telugu', label: 'Telugu', description: 'తెలుగులో వివరణ' },
  { value: 'Kannada', label: 'Kannada', description: 'ಕನ್ನಡದಲ್ಲಿ ವಿವರಣೆ' },
  { value: 'Malayalam', label: 'Malayalam', description: 'മലയാളത്തിൽ വിശദീകരണം' },
  { value: 'Punjabi', label: 'Punjabi', description: 'ਪੰਜਾਬੀ ਵਿੱਚ ਵਿਆਖਿਆ' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onSelect }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Choose Explanation Language</h2>
      <p className="text-gray-400 mb-6">How would you like the explanation?</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {languages.map((lang) => (
          <button
            key={lang.value}
            onClick={() => onSelect(lang.value)}
            className={`p-4 rounded-lg border transition-all text-left ${
              selectedLanguage === lang.value
                ? 'border-primary bg-primary/10'
                : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
            }`}
          >
            <div className="font-medium text-white">{lang.label}</div>
            <div className="text-sm text-gray-400 mt-1">{lang.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
