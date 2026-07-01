import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import { supabase } from '@/lib/supabase'
import type { PointTransaction } from '@/types/database'

/** ประวัติคะแนนของสมาชิกเอง (RLS จำกัดให้เห็นเฉพาะของตัวเอง) */
export default function HistoryPage() {
  const { t, i18n } = useTranslation()
  const { member } = useAuth()
  const [txs, setTxs] = useState<PointTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const dateFmt = new Intl.DateTimeFormat(i18n.language === 'th' ? 'th-TH' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  useEffect(() => {
    if (!member) return
    let active = true
    void (async () => {
      const { data } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (active) {
        setTxs((data as PointTransaction[]) ?? [])
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [member])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-cake-700">{t('history.title')}</h1>

      {loading ? (
        <p className="text-sm text-gray-400">{t('history.loading')}</p>
      ) : txs.length === 0 ? (
        <p className="text-sm text-gray-400">{t('history.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {txs.map((tx) => (
            <li
              key={tx.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-800">
                  {tx.type === 'earn' ? t('history.earn') : t('history.adjust')}
                </p>
                <p className="text-xs text-gray-400">
                  {dateFmt.format(new Date(tx.created_at))}
                  {tx.bill_amount != null && <span> · ฿{tx.bill_amount}</span>}
                </p>
                {tx.note && <p className="mt-0.5 text-xs text-gray-400">{tx.note}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`text-lg font-bold ${tx.points >= 0 ? 'text-green-600' : 'text-cake-600'}`}
                >
                  {tx.points >= 0 ? `+${tx.points}` : tx.points}
                </p>
                <p className="text-[11px] text-gray-400">
                  {t('history.balance')} {tx.balance_after}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
