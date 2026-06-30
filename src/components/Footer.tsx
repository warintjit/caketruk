import { useTranslation } from 'react-i18next'

/** Footer แสดงเครดิต "dev by Kru_Boat" ทุกหน้า (ตาม SRS) */
export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-auto border-t border-cake-100 bg-white/70 py-4 text-center text-xs text-gray-400">
      {t('footer.credit')}
    </footer>
  )
}
