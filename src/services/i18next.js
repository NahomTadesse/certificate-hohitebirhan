


import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../../locales/en.json';
import am from '../../locales/am.json';
import om from '../../locales/om.json';
import ti from '../../locales/ti.json';
import de from '../../locales/de.json';  // Add German
import fr from '../../locales/fr.json';  // Add French
import es from '../../locales/es.json';  // Add Spanish
import Cookies from 'js-cookie';

export const languageResources = {
  en: { translation: en },
  am: { translation: am },
  om: { translation: om },
  ti: { translation: ti },
  de: { translation: de },  // Add German
  fr: { translation: fr },  // Add French
  es: { translation: es },  // Add Spanish
};

// Function to initialize i18next with the current language from cookie
const initializeI18n = () => {
  // Get language from cookie or default to 'en'
  const savedLanguage = Cookies.get('selectedLanguage');
  const defaultLanguage = savedLanguage && ['en', 'am', 'om', 'ti', 'de', 'fr', 'es'].includes(savedLanguage) 
    ? savedLanguage 
    : 'en';

  i18next.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    lng: defaultLanguage,
    fallbackLng: 'en',
    resources: languageResources,
  });
};

// Initialize on module load
initializeI18n();

// Export a function to change language
export const changeLanguage = (lang) => {
  // Only change if the language exists in our resources
  if (['en', 'am', 'om', 'ti', 'de', 'fr', 'es'].includes(lang)) {
    i18next.changeLanguage(lang, (err) => {
      if (err) {
        console.error('Error changing language:', err);
      }
    });
  }
};

// Listen for language changes
if (typeof window !== 'undefined') {
  // Re-initialize i18next when language cookie changes
  const originalSet = Cookies.set;
  Cookies.set = function(key, value, options) {
    originalSet.call(this, key, value, options);
    
    if (key === 'selectedLanguage' && ['en', 'am', 'om', 'ti', 'de', 'fr', 'es'].includes(value)) {
      changeLanguage(value);
    }
  };
}

export default i18next;