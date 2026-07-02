'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Cookies from 'js-cookie';
import { changeLanguage } from '../services/i18next'; // Adjust path as needed

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  // { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' },
  // { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' },
  // { code: 'de', name: 'German', nativeName: 'Deutsch' },
  // { code: 'fr', name: 'French', nativeName: 'Français' },
  // { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get language from cookie or i18n instance
    const savedLang = Cookies.get('selectedLanguage');
    if (savedLang && languages.some(lang => lang.code === savedLang)) {
      setCurrentLang(savedLang);
    } else {
      setCurrentLang(i18n.language || 'en');
    }
  }, [i18n.language]);

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    changeLanguage(langCode);
    // Save to cookie for persistence
    Cookies.set('selectedLanguage', langCode, { expires: 365 });
  };

  const currentLanguage = languages.find(lang => lang.code === currentLang);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-10 w-10">
        <Globe className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 hover:bg-blue-100 transition-colors relative group"
          aria-label={t('language.switch') || 'Change language'}
        >
          <Globe className="h-5 w-5" />
          {currentLanguage && (
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
              {currentLanguage.code.toUpperCase()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="cursor-pointer flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span>{lang.nativeName}</span>
              <span className="text-xs text-gray-500">({lang.name})</span>
            </span>
            {currentLang === lang.code && (
              <Check className="h-4 w-4 text-emerald-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}