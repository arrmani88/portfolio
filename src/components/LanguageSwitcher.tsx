import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'language'

type Language = 'en' | 'ar' | 'de' | 'fr'

const LANGUAGES: { code: Language; flag: string; label: string }[] = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'ar', flag: '🇲🇦', label: 'Arabic' },
  { code: 'de', flag: '🇩🇪', label: 'German' },
  { code: 'fr', flag: '🇫🇷', label: 'French' },
]

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const switchTo = (lang: Language) => {
    i18n.changeLanguage(lang)
    window.localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }

  return (
    <div className="language-switcher">
      {LANGUAGES.map(({ code, flag, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          aria-pressed={i18n.language === code}
          aria-label={label}
          title={label}
        >
          <span aria-hidden="true">{flag}</span>
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
