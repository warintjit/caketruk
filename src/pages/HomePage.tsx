import { useTranslation } from 'react-i18next'
import Logo from '@/components/Logo'

export default function HomePage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center rounded-2xl bg-ink-900 p-8 text-center text-white shadow-lg">
        <Logo className="h-16 w-16" />
        <p className="mt-3 text-2xl font-bold tracking-wide">{t('app.name')}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-cake-400">
          {t('app.tagline')}
        </p>
      </div>
      <p className="text-center text-sm text-gray-400">
        Phase 0 · scaffold พร้อมแล้ว
      </p>
    </div>
  )
}
