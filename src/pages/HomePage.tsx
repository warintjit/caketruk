import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import { canManagePoints, canManageAll } from '@/auth/roles'

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

      {/* เมนูสมาชิก — ทุกคน */}
      <Link
        to="/promotions"
        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        {t('nav.promotions')}
        <span aria-hidden>→</span>
      </Link>

      <Link
        to="/menu"
        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        {t('nav.menu')}
        <span aria-hidden>→</span>
      </Link>

      <Link
        to="/coupons"
        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        {t('nav.coupons')}
        <span aria-hidden>→</span>
      </Link>

      <Link
        to="/history"
        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        {t('history.title')}
        <span aria-hidden>→</span>
      </Link>

      {/* ทางลัดหลังบ้าน — เฉพาะแอดมิน */}
      {canManagePoints(member) && (
        <Link
          to="/admin/points"
          className="flex items-center justify-between rounded-xl bg-cake-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-cake-700"
        >
          {t('nav.managePoints')}
          <span aria-hidden>→</span>
        </Link>
      )}

      {/* จัดการสมาชิก/role — เฉพาะ developer/super_admin */}
      {canManageAll(member) && (
        <Link
          to="/admin/members"
          className="flex items-center justify-between rounded-xl border border-cake-200 bg-white px-4 py-3 font-semibold text-cake-700 shadow-sm transition hover:bg-cake-50"
        >
          {t('members.title')}
          <span aria-hidden>→</span>
        </Link>
      )}

      {/* จัดการโปรโมชัน — เฉพาะ developer/super_admin */}
      {canManageAll(member) && (
        <Link
          to="/admin/promotions"
          className="flex items-center justify-between rounded-xl border border-cake-200 bg-white px-4 py-3 font-semibold text-cake-700 shadow-sm transition hover:bg-cake-50"
        >
          {t('promo.manageTitle')}
          <span aria-hidden>→</span>
        </Link>
      )}

      {/* จัดการเมนู — เฉพาะ developer/super_admin */}
      {canManageAll(member) && (
        <Link
          to="/admin/menu"
          className="flex items-center justify-between rounded-xl border border-cake-200 bg-white px-4 py-3 font-semibold text-cake-700 shadow-sm transition hover:bg-cake-50"
        >
          {t('menuMgr.title')}
          <span aria-hidden>→</span>
        </Link>
      )}

      {/* จัดการคูปอง — เฉพาะ developer/super_admin */}
      {canManageAll(member) && (
        <Link
          to="/admin/coupons"
          className="flex items-center justify-between rounded-xl border border-cake-200 bg-white px-4 py-3 font-semibold text-cake-700 shadow-sm transition hover:bg-cake-50"
        >
          {t('coupon.manageTitle')}
          <span aria-hidden>→</span>
        </Link>
      )}

      {/* ตั้งค่าร้าน — เฉพาะ developer/super_admin */}
      {canManageAll(member) && (
        <Link
          to="/admin/settings"
          className="flex items-center justify-between rounded-xl border border-cake-200 bg-white px-4 py-3 font-semibold text-cake-700 shadow-sm transition hover:bg-cake-50"
        >
          {t('settings.title')}
          <span aria-hidden>→</span>
        </Link>
      )}

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
