import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import { supabase } from '@/lib/supabase'
import type { Coupon } from '@/types/database'

/** period 'YYYY-MM' ตามเวลาไทย — ต้องตรงกับฝั่ง server (redeem_coupon) */
function thaiPeriod(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')?.value ?? ''
  const m = parts.find((p) => p.type === 'month')?.value ?? ''
  return `${y}-${m}`
}

export default function CouponsPage() {
  const { t, i18n } = useTranslation()
  const { member } = useAuth()
  const isTh = i18n.language === 'th'

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [used, setUsed] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const name = (c: Coupon) => (isTh ? c.name_th || c.name_en : c.name_en || c.name_th) || '—'

  const load = useCallback(async () => {
    if (!member) return
    const period = thaiPeriod()
    const [{ data: cs }, { data: rs }] = await Promise.all([
      supabase
        .from('coupons')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('coupon_redemptions')
        .select('coupon_id')
        .eq('member_id', member.id)
        .eq('period', period),
    ])
    const counts: Record<string, number> = {}
    for (const r of (rs as { coupon_id: string }[]) ?? []) {
      counts[r.coupon_id] = (counts[r.coupon_id] ?? 0) + 1
    }
    setCoupons((cs as Coupon[]) ?? [])
    setUsed(counts)
    setLoading(false)
  }, [member])

  useEffect(() => {
    void load()
  }, [load])

  async function redeem(c: Coupon) {
    if (!window.confirm(t('coupon.confirmUse', { name: name(c) }))) return
    setError(null)
    setBusyId(c.id)
    const { error: err } = await supabase.rpc('redeem_coupon', { p_coupon_id: c.id })
    setBusyId(null)
    if (err) {
      setError(err.message)
      await load() // ซิงก์สิทธิ์ล่าสุด (เผื่อกดจากอีกเครื่อง)
      return
    }
    setUsed((u) => ({ ...u, [c.id]: (u[c.id] ?? 0) + 1 }))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-cake-700">{t('nav.coupons')}</h1>

      {error && <p className="text-sm text-cake-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">{t('coupon.loading')}</p>
      ) : coupons.length === 0 ? (
        <p className="text-sm text-gray-400">{t('coupon.memberEmpty')}</p>
      ) : (
        <ul className="space-y-4">
          {coupons.map((c) => {
            const remaining = c.max_uses_per_user - (used[c.id] ?? 0)
            const usedUp = remaining <= 0
            return (
              <li
                key={c.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                {c.image_url && <img src={c.image_url} alt={name(c)} className="w-full object-cover" />}
                <div className="space-y-2 p-4">
                  <p className="font-bold text-gray-800">{name(c)}</p>
                  <p className="text-xs text-gray-500">
                    {t('coupon.remaining')}:{' '}
                    <span className={usedUp ? 'font-bold text-gray-400' : 'font-bold text-cake-600'}>
                      {Math.max(0, remaining)}
                    </span>{' '}
                    / {c.max_uses_per_user} {t('coupon.times')}
                  </p>
                  <button
                    type="button"
                    disabled={usedUp || busyId === c.id}
                    onClick={() => void redeem(c)}
                    className="w-full rounded-xl bg-cake-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-cake-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {busyId === c.id
                      ? t('coupon.using')
                      : usedUp
                        ? t('coupon.usedUp')
                        : t('coupon.use')}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
