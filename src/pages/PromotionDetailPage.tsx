import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import { supabase } from '@/lib/supabase'
import type { Promotion } from '@/types/database'

/** วันที่ไทยวันนี้ 'YYYY-MM-DD' (สำหรับเทียบช่วงเวลาโปรโมชัน) */
function thaiToday(): string {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  return `${p.find((x) => x.type === 'year')?.value}-${p.find((x) => x.type === 'month')?.value}-${p.find((x) => x.type === 'day')?.value}`
}

export default function PromotionDetailPage() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const { member } = useAuth()
  const isTh = i18n.language === 'th'

  const [promo, setPromo] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      const { data } = await supabase.from('promotions').select('*').eq('id', id).maybeSingle()
      if (active) {
        setPromo((data as Promotion) ?? null)
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  const dateFmt = (d: string) =>
    new Intl.DateTimeFormat(isTh ? 'th-TH' : 'en-GB', { dateStyle: 'long' }).format(new Date(d))

  if (loading) return <p className="text-sm text-gray-400">{t('claim.loading')}</p>
  if (!promo) return <p className="text-sm text-cake-600">{t('claim.notFound')}</p>

  const title = (isTh ? promo.title_th : promo.title_en) || promo.title_th || promo.title_en
  const desc =
    (isTh ? promo.description_th : promo.description_en) ||
    promo.description_th ||
    promo.description_en
  const today = thaiToday()
  // วันเกิดวันนี้ไหม (เทียบ วัน-เดือน ไม่สนปี)
  const bdayToday = member?.birthday ? member.birthday.slice(5) === today.slice(5) : false
  const hasPoints = promo.points_required != null
  const notStarted = promo.start_date != null && today < promo.start_date
  const expired = promo.end_date != null && today > promo.end_date
  const notEnough = hasPoints && (member?.points_balance ?? 0) < (promo.points_required ?? 0)
  // โปรฯวันเกิด: กดได้เฉพาะวันเกิด · โปรฯปกติ: ต้องมีคะแนนแลก
  const claimable = promo.is_birthday ? bdayToday : hasPoints

  async function claim() {
    if (!promo) return
    if (!window.confirm(t('claim.confirmClaim', { points: promo.points_required }))) return
    setError(null)
    setClaiming(true)
    const { error: err } = await supabase.rpc('claim_promotion', { p_promotion_id: promo.id })
    setClaiming(false)
    if (err) {
      setError(err.message)
      return
    }
    setClaimed(true)
  }

  let disabledReason: string | null = null
  if (notStarted) disabledReason = t('claim.notStarted')
  else if (expired) disabledReason = t('claim.expired')
  else if (notEnough) disabledReason = t('claim.notEnough')

  return (
    <div className="space-y-4">
      {promo.image_url && (
        <img
          src={promo.image_url}
          alt={title ?? ''}
          className="w-full rounded-2xl border border-gray-100 object-cover shadow-sm"
        />
      )}

      {hasPoints ? (
        <div className="rounded-xl bg-cake-600 py-3 text-center text-lg font-bold text-white shadow">
          {t('promo.usePoints', { points: promo.points_required })}
        </div>
      ) : promo.is_birthday ? (
        <div className="rounded-xl bg-cake-600 py-3 text-center text-lg font-bold text-white shadow">
          {t('promo.birthdayBadge')} · {t('claim.free')}
        </div>
      ) : null}

      {(promo.start_date || promo.end_date) && (
        <div className="rounded-xl bg-cake-50 p-3 text-sm text-gray-600">
          <span className="font-medium">{t('claim.period')}: </span>
          {promo.start_date ? dateFmt(promo.start_date) : '…'} – {promo.end_date ? dateFmt(promo.end_date) : '…'}
        </div>
      )}

      {title && <h1 className="text-xl font-bold text-gray-800">{title}</h1>}
      {desc && <p className="whitespace-pre-line text-sm text-gray-600">{desc}</p>}

      {error && <p className="text-sm text-cake-600">{error}</p>}

      {promo.is_birthday && !bdayToday ? (
        <div className="rounded-xl border border-cake-200 bg-cake-50 p-4 text-center text-sm font-medium text-cake-700">
          {t('claim.birthdayOnly')}
        </div>
      ) : claimable ? (
        <div className="pt-2">
          {claimed ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm font-medium text-green-700">
              {t('claim.claimed')}
            </div>
          ) : (
            <button
              type="button"
              disabled={claiming || notStarted || expired || notEnough}
              onClick={() => void claim()}
              className="w-full rounded-xl bg-cake-600 px-4 py-3.5 text-lg font-bold text-white shadow-md transition hover:bg-cake-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {claiming ? t('claim.claiming') : disabledReason ? disabledReason : t('claim.claimBtn')}
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
