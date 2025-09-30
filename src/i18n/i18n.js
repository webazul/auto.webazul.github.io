import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Importar traduções
import ptTranslations from './locales/pt.json'

const resources = {
  pt: {
    translation: ptTranslations
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt', // idioma padrão
    fallbackLng: 'pt',

    interpolation: {
      escapeValue: false // React já faz escape
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

export default i18n