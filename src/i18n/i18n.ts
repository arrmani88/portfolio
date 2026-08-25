import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'
import de from './locales/de.json'
import fr from './locales/fr.json'

const STORAGE_KEY = 'language'
const SUPPORTED_LANGUAGES = ['en', 'ar', 'de', 'fr'] as const

function getInitialLanguage(): string {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return SUPPORTED_LANGUAGES.includes(stored as (typeof SUPPORTED_LANGUAGES)[number])
    ? (stored as string)
    : 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    de: { translation: de },
    fr: { translation: fr },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
