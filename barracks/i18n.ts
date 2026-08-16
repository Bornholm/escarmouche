import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { BASE_URL } from './util/baseUrl';


i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: undefined, // Use browser language detection
    fallbackLng: 'en',

    // Les fichiers de traduction sont nommés `fr`, `en`, `es` — pas `fr-FR`.
    // Sans cette option, un navigateur annonçant `fr-FR` fait charger
    // `/locales/fr-FR/translation.json` en priorité : la requête échoue (ou
    // pire, tombe sur un fichier périmé aux valeurs vides) et les libellés
    // ressortent vides alors que le bundle `fr` est correct.
    load: 'languageOnly',

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    backend: {
      loadPath: `${BASE_URL}/locales/{{lng}}/{{ns}}.json`,
    },

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;