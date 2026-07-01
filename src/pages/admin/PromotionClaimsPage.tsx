import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import type { Promotion, PromotionClaim, Member } from '@/types/database'

type Row = PromotionClaim & {
  member?: Pick<Member, 'display_name' | 'last_name' | 'phone'>
  promo?: Pick<Promotion, 'title_th' | 'title_en'>
}

export default function PromotionClaimsPage() {
  const { t, i18n } = useTranslation()
  const isTh = i18n.language === 'th'
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: claims, error: err } = await supabase
      .from('promotion_claims')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    const list = (claims as PromotionClaim[]) ?? []
    const memberIds = [...new Set(list.map((c) => c.member_id))]
    const promoIds = [...new Set(list.map((c) => c.promotion_id))]

    const [{ data: members }, { data: promos }] = await Promise.all([
      memberIds.length
        ? supabase.from('members').select('id, display_name, last_name, phone').in('id', memberIds)
        : Promise.resolve({ data: [] as Member[] }),
      promoIds.length
        ? supabase.from('promotions').select('id, title_th, title_en').in('id', promoIds)
        : Promise.resolve({ data: [] as Promotion[] }),
    ])
    const mMap = new Map((members as Member[] ?? []).map((m) => [m.id, m]))
    const pMap = new Map((promos as Promotion[] ?? []).map((p) => [p.id, p]))

    setRows(
      list.map((c) => ({
        ...c,
        member: mMap.get(c.member_id),
        promo: pMap.get(c.promotion_id),
      })),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function resolve(row: Row, action: 'confirm' | 'cancel') {
    const ask =
      action === 'confirm'
        ? t('claim.confirmAsk', { points: row.points_used })
        : t('claim.cancelAsk')
    if (!window.confirm(ask)) return
    setError(null)
    setBusyId(row.id)
    const { error: err } = await supabase.rpc('resolve_promotion_claim', {
      p_claim_id: row.id,
      p_action: action,
    })
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    await load()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-cake-700">{t('claim.adminTitle')}</h1>

      {error && <p className="text-sm text-cake-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">{t('claim.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400">{t('claim.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <p className="font-medium text-gray-800">
                {(isTh ? row.promo?.title_th : row.promo?.title_en) ||
                  row.promo?.title_th ||
                  row.promo?.title_en ||
                  '—'}
                <span className="ml-2 text-sm font-bold text-cake-600">
                  {row.points_used} {t('claim.points')}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {row.member?.display_name} {row.member?.last_name ?? ''} · {row.member?.phone ?? ''}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void resolve(row, 'confirm')}
                  className="flex-1 rounded-lg bg-cake-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cake-700 disabled:opacity-60"
                >
                  {t('claim.confirm')}
                </button>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void resolve(row, 'cancel')}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  {t('claim.cancel')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
