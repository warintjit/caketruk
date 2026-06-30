import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import th from './locales/th.json'
import en from './locales/en.json'

export const SUPPORTED_LANGUAGES = ['th', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

void i18n
  // ตรวจภาษาอัตโนมัติจาก localStorage → navigator (เบราว์เซอร์/LINE)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      th: { translation: th },
      en: { translation: en },
    },
    fallbackLng: 'th',
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true, // 'th-TH' -> 'th'
    interpolation: { escapeValue: false },
    detection: {
      // จดจำภาษาที่เลือกไว้ใน localStorage
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'cake_lang',
    },
  })

export default i18n
