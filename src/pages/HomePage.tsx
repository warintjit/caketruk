import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import { canManagePoints, canManageAll } from '@/auth/roles'
import { supabase } from '@/lib/supabase'
import type { HomeTile } from '@/types/database'

const MEMBER_TILES = [
  { key: 'promotions', to: '/promotions', label: 'nav.promotions' },
  { key: 'menu', to: '/menu', label: 'nav.menu' },
  { key: 'coupons', to: '/coupons', label: 'nav.coupons' },
  { key: 'packages', to: '/packages', label: 'nav.packages' },
]

export default function HomePage() {
  const { t } = useTranslation()
  const { member, signOut } = useAuth()
  const isAdmin = canManagePoints(member)
  const isManager = canManageAll(member)

  const [images, setImages] = useState<Record<string, string | null>>({})

  useEffect(() => {
    let active = true
    void (async () => {
      const { data } = await supabase.from('home_tiles').select('key, image_url')
      if (!active) return
      const map: Record<string, string | null> = {}
      for (const row of (data as HomeTile[]) ?? []) map[row.key] = row.image_url
      setImages(map)
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* การ์ดสมาชิก — รูป/ชื่อ/เบอร์/รหัส + แก้ไข + คะแนน */}
      <div className="rounded-2xl bg-ink-900 p-5 text-white shadow-lg">
        <div className="flex items-start gap-3">
          {member?.photo_url ? (
            <img
              src={member.photo_url}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-cake-500/40"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cake-600 text-xl font-bold">
              {(member?.display_name ?? '?').charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">
              {member?.display_name ?? ''} {member?.last_name ?? ''}
            </p>
            <p className="truncate text-xs text-gray-400">{member?.phone ?? ''}</p>
            {member?.id && (
              <p className="truncate text-[11px] text-gray-500">
                {t('profile.id')}: {member.id.slice(0, 8).toUpperCase()}
              </p>
            )}
          </div>
          <Link
            to="/profile/edit"
            className="shrink-0 rounded-lg border border-white/20 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/10"
          >
            {t('profile.edit')}
          </Link>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400">{t('home.points')}</p>
            <p className="mt-0.5 text-3xl font-bold text-cake-500">
              {member?.points_balance ?? 0}{' '}
              <span className="text-base font-normal text-gray-400">{t('home.pointsUnit')}</span>
            </p>
          </div>
          <Link
            to="/history"
            className="flex items-center gap-1 text-xs font-medium text-cake-300 hover:text-cake-200"
          >
            {t('history.title')} <span aria-hidden>›</span>
          </Link>
        </div>
      </div>

      {/* เมนูสมาชิก — การ์ดรูปภาพ */}
      <div className="grid grid-cols-2 gap-3">
        {MEMBER_TILES.map((tile) => (
          <TileCard
            key={tile.key}
            to={tile.to}
            label={t(tile.label)}
            image={images[tile.key] ?? null}
          />
        ))}
      </div>

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
              <NavCard to="/admin/home-tiles" variant="admin">
                {t('tiles.title')}
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

/** การ์ดรูปเมนู — มีรูปก็โชว์รูป ไม่มีก็เป็นการ์ดสีแบรนด์ */
function TileCard({
  to,
  label,
  image,
}: {
  to: string
  label: string
  image: string | null
}) {
  return (
    <Link
      to={to}
      className="relative block aspect-[16/10] overflow-hidden rounded-2xl border border-gray-100 shadow-sm"
    >
      {image ? (
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-cake-500 to-cake-700" />
      )}
      <div className="absolute inset-0 bg-black/25" />
      <span className="absolute bottom-2 left-3 text-base font-bold text-white drop-shadow">
        {label}
      </span>
    </Link>
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
