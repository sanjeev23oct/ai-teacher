export type Language = 
  | 'English'
  | 'Hindi'
  | 'Hinglish'
  | 'Bengali'
  | 'Tamil'
  | 'Telugu'
  | 'Marathi'
  | 'Gujarati'
  | 'Kannada'
  | 'Malayalam'
  | 'Punjabi';

interface LanguageOption {
  id: Language;
  label: string;
  nativeLabel: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: 'English', label: 'English', nativeLabel: 'English' },
  { id: 'Hindi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { id: 'Hinglish', label: 'Hinglish', nativeLabel: 'Hinglish' },
  { id: 'Bengali', label: 'Bengali', nativeLabel: 'বাংলা' },
  { id: 'Tamil', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { id: 'Telugu', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { id: 'Marathi', label: 'Marathi', nativeLabel: 'मराठी' },
  { id: 'Gujarati', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { id: 'Kannada', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { id: 'Malayalam', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { id: 'Punjabi', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
];

interface LanguageSelectorProps {
  selectedLanguage: Language | null;
  onSelect: (language: Language) => void;
}

export default function LanguageSelector({ selectedLanguage, onSelect }: LanguageSelectorProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-white mb-4">Select Language</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {LANGUAGES.map((language) => (
          <button
            key={language.id}
            onClick={() => onSelect(language.id)}
            className={`
              p-3 rounded-lg border-2 transition-all duration-200
              flex flex-col items-center gap-1
              min-h-[80px]
              ${
                selectedLanguage === language.id
                  ? 'bg-primary border-white shadow-lg scale-105'
                  : 'bg-surface border-gray-700 hover:border-gray-500 hover:scale-102'
              }
            `}
          >
            <span className="text-lg font-semibold text-white">
              {language.nativeLabel}
            </span>
            {language.label !== language.nativeLabel && (
              <span className="text-xs text-gray-400">
                {language.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
