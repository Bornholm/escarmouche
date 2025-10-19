import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';


i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: undefined, // Use browser language detection
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;