import { useTranslation } from 'react-i18next'
import Logo from './Logo'

/** หน้าจอโหลด (ใช้ระหว่างเช็ค session) */
export default function LoadingScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white">
      <Logo className="h-12 w-12 animate-pulse" />
      <p className="text-sm text-gray-400">{t('common.loading')}</p>
    </div>
  )
}
