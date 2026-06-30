import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type Language } from '@/i18n'

/** ปุ่มสลับภาษา TH / EN — จดจำผ่าน i18next LanguageDetector (localStorage) */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = (i18n.resolvedLanguage ?? 'th') as Language

  return (
    <div className="inline-flex overflow-hidden rounded-full border border-cake-200 bg-white text-sm font-medium shadow-sm">
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => void i18n.changeLanguage(lng)}
          className={
            current === lng
              ? 'bg-cake-600 px-3 py-1 text-white'
              : 'px-3 py-1 text-cake-700 hover:bg-cake-50'
          }
          aria-pressed={current === lng}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
