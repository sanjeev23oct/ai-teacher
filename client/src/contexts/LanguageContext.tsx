import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Language configuration interface (mirrors server-side)
export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  mixName: string;
  flag: string;
  ttsVoiceId: string;
  ttsModel: string;
  promptInstruction: string;
}

interface LanguageContextType {
  languageCode: string;
  language: LanguageConfig | null;
  languages: LanguageConfig[];
  setLanguage: (code: string) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_LANGUAGE_CODE = 'en';

// Local storage key for guest users
const LANGUAGE_STORAGE_KEY = 'preferred_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [languageCode, setLanguageCode] = useState<string>(DEFAULT_LANGUAGE_CODE);
  const [language, setLanguageConfig] = useState<LanguageConfig | null>(null);
  const [languages, setLanguages] = useState<LanguageConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all available languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch('/api/languages');
        if (response.ok) {
          const data = await response.json();
          setLanguages(data.languages);
          
          // Set initial language config from the list
          const storedCode = localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE_CODE;
          const initialLang = data.languages.find((l: LanguageConfig) => l.code === storedCode);
          if (initialLang) {
            setLanguageCode(storedCode);
            setLanguageConfig(initialLang);
          } else if (data.languages.length > 0) {
            // Fallback to first language if stored code is invalid
            setLanguageCode(data.languages[0].code);
            setLanguageConfig(data.languages[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      }
    };

    fetchLanguages();
  }, []);

  // Sync with user's preference when logged in
  useEffect(() => {
    const syncUserPreference = async () => {
      if (!user || !token) {
        // For guest users, use local storage
        const storedCode = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedCode && languages.length > 0) {
          const lang = languages.find(l => l.code === storedCode);
          if (lang) {
            setLanguageCode(storedCode);
            setLanguageConfig(lang);
          }
        }
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/language', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setLanguageCode(data.languageCode);
          setLanguageConfig(data.language);
          // Also update local storage for consistency
          localStorage.setItem(LANGUAGE_STORAGE_KEY, data.languageCode);
        }
      } catch (error) {
        console.error('Failed to fetch user language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (languages.length > 0) {
      syncUserPreference();
    }
  }, [user, token, languages]);

  const setLanguage = async (code: string) => {
    // Find the language config
    const newLang = languages.find(l => l.code === code);
    if (!newLang) {
      console.error('Invalid language code:', code);
      return;
    }

    // Update local state immediately for responsiveness
    setLanguageCode(code);
    setLanguageConfig(newLang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);

    // If logged in, persist to server
    if (user && token) {
      try {
        const response = await fetch('/api/user/language', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ languageCode: code })
        });

        if (!response.ok) {
          console.error('Failed to update language preference on server');
        }
      } catch (error) {
        console.error('Failed to update language preference:', error);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ languageCode, language, languages, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
