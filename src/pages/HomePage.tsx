import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'

export default function HomePage() {
  const { t } = useTranslation()
  const { member, signOut } = useAuth()

  return (
    <div className="space-y-4">
      {/* การ์ดคะแนน — เห็นทันทีเมื่อเปิด (หลักการใช้ง่าย) */}
      <div className="rounded-2xl bg-ink-900 p-6 text-white shadow-lg">
        <p className="text-sm text-cake-300">
          {t('home.hello')}, {member?.display_name ?? ''}
        </p>
        <p className="mt-3 text-xs uppercase tracking-widest text-gray-400">
          {t('home.points')}
        </p>
        <p className="mt-1 text-4xl font-bold text-cake-500">
          {member?.points_balance ?? 0}{' '}
          <span className="text-base font-normal text-gray-400">
            {t('home.pointsUnit')}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => void signOut()}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
      >
        {t('nav.logout')}
      </button>
    </div>
  )
}
