import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

const LanguagePreferenceSelector: React.FC<LanguageSelectorProps> = ({ compact = false, className = '' }) => {
  const { languageCode, language, languages, setLanguage, isLoading } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (code: string) => {
    await setLanguage(code);
    setIsOpen(false);
  };

  if (isLoading || languages.length === 0) {
    return (
      <div className={`flex items-center space-x-1 text-gray-400 ${className}`}>
        <Globe className="h-4 w-4" />
        {!compact && <span className="text-sm">Loading...</span>}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-gray-300 hover:text-white px-2 py-1.5 rounded-md text-sm font-medium transition-colors bg-background/50 hover:bg-background border border-gray-700"
        title="Select language"
      >
        <span className="text-base">{language?.flag || '🌐'}</span>
        {!compact && (
          <>
            <span className="hidden sm:inline">{language?.nativeName || 'Select'}</span>
            <span className="sm:hidden">{language?.code?.toUpperCase() || '?'}</span>
          </>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-surface border border-gray-700 rounded-lg shadow-xl py-1 z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-2 border-b border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Select Language</p>
          </div>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm transition-colors ${
                lang.code === languageCode
                  ? 'bg-primary/20 text-primary'
                  : 'text-gray-300 hover:bg-background hover:text-white'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{lang.nativeName}</div>
                <div className="text-xs text-gray-500">{lang.mixName}</div>
              </div>
              {lang.code === languageCode && (
                <span className="text-primary">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguagePreferenceSelector;
