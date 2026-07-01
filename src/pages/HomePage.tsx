import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import { canManagePoints, canManageAll } from '@/auth/roles'

export default function HomePage() {
  const { t } = useTranslation()
  const { member, signOut } = useAuth()
  const isAdmin = canManagePoints(member)
  const isManager = canManageAll(member)

  return (
    <div className="space-y-4">
      {/* การ์ดคะแนน — เห็นทันทีเมื่อเปิด (หลักการใช้ง่าย) */}
      <div className="rounded-2xl bg-ink-900 p-6 text-white shadow-lg">
        <p className="text-sm text-cake-300">
          {t('home.hello')}, {member?.display_name ?? ''}
        </p>
        <p className="mt-3 text-xs uppercase tracking-widest text-gray-400">{t('home.points')}</p>
        <p className="mt-1 text-4xl font-bold text-cake-500">
          {member?.points_balance ?? 0}{' '}
          <span className="text-base font-normal text-gray-400">{t('home.pointsUnit')}</span>
        </p>
      </div>

      {/* เมนูสมาชิก — ทุกคน */}
      <SectionHeading>{t('home.memberMenu')}</SectionHeading>
      <NavCard to="/promotions">{t('nav.promotions')}</NavCard>
      <NavCard to="/menu">{t('nav.menu')}</NavCard>
      <NavCard to="/coupons">{t('nav.coupons')}</NavCard>
      <NavCard to="/packages">{t('nav.packages')}</NavCard>
      <NavCard to="/history">{t('history.title')}</NavCard>

      {/* จัดการร้าน — แอดมิน */}
      {isAdmin && (
        <>
          <SectionHeading>{t('home.adminMenu')}</SectionHeading>
          <NavCard to="/admin/points" variant="primary">
            {t('nav.managePoints')}
          </NavCard>
          {isManager && (
            <>
              <NavCard to="/admin/members" variant="admin">
                {t('members.title')}
              </NavCard>
              <NavCard to="/admin/promotions" variant="admin">
                {t('promo.manageTitle')}
              </NavCard>
              <NavCard to="/admin/menu" variant="admin">
                {t('menuMgr.title')}
              </NavCard>
              <NavCard to="/admin/coupons" variant="admin">
                {t('coupon.manageTitle')}
              </NavCard>
              <NavCard to="/admin/packages" variant="admin">
                {t('pkg.manageTitle')}
              </NavCard>
              <NavCard to="/admin/settings" variant="admin">
                {t('settings.title')}
              </NavCard>
            </>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
      >
        {t('nav.logout')}
      </button>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </p>
  )
}

const VARIANTS = {
  member: 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50',
  admin: 'border border-cake-200 bg-white text-cake-700 shadow-sm hover:bg-cake-50',
  primary: 'bg-cake-600 text-white shadow-md hover:bg-cake-700',
} as const

function NavCard({
  to,
  variant = 'member',
  children,
}: {
  to: string
  variant?: keyof typeof VARIANTS
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between rounded-xl px-4 py-3 font-semibold transition ${VARIANTS[variant]}`}
    >
      {children}
      <span aria-hidden>→</span>
    </Link>
  )
}
