import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

type Summary = {
  total_members: number
  new_members_last_month: number
  new_members_this_month: number
}

type PromoRow = {
  id: string
  title_th: string | null
  title_en: string | null
  points_required: number | null
  is_active: boolean
}
type CouponRow = { name_th: string | null; name_en: string | null; count: number }
type MonthReport = {
  promotions: PromoRow[]
  coupons_total: number
  coupons: CouponRow[]
  points: {
    earn_count: number
    adjust_count: number
    points_added: number
    points_removed: number
    bill_total: number
  }
}

/** เดือนปัจจุบัน 'YYYY-MM' เวลาไทย */
function currentPeriod(): string {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  return `${p.find((x) => x.type === 'year')?.value}-${p.find((x) => x.type === 'month')?.value}`
}

export default function ReportsPage() {
  const { t, i18n } = useTranslation()
  const isTh = i18n.language === 'th'
  const nowPeriod = currentPeriod()

  const [summary, setSummary] = useState<Summary | null>(null)
  const [period, setPeriod] = useState(nowPeriod)
  const [month, setMonth] = useState<MonthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthLoading, setMonthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const n = (v: number) => v.toLocaleString()

  useEffect(() => {
    let active = true
    void (async () => {
      const { data, error: err } = await supabase.rpc('admin_report_summary')
      if (!active) return
      if (err) setError(err.message)
      else setSummary(data as Summary)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const loadMonth = useCallback(async (p: string) => {
    setMonthLoading(true)
    const { data, error: err } = await supabase.rpc('admin_report_month', { p_period: p })
    if (err) setError(err.message)
    else setMonth(data as MonthReport)
    setMonthLoading(false)
  }, [])

  useEffect(() => {
    void loadMonth(period)
  }, [period, loadMonth])

  if (loading) return <p className="text-sm text-gray-400">{t('report.loading')}</p>
  if (error) return <p className="text-sm text-cake-600">{error}</p>

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-cake-700">{t('report.title')}</h1>

      {/* สรุปสมาชิก */}
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <Stat label={t('report.totalMembers')} value={n(summary.total_members)} unit={t('report.people')} big span2 />
          <Stat label={t('report.membersLastMonth')} value={n(summary.new_members_last_month)} unit={t('report.people')} />
          <Stat label={t('report.membersThisMonth')} value={n(summary.new_members_this_month)} unit={t('report.people')} />
        </div>
      )}

      {/* เลือกเดือนย้อนหลัง */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
        <label className="text-sm font-medium text-gray-700">{t('report.selectMonth')}</label>
        <input
          type="month"
          value={period}
          max={nowPeriod}
          onChange={(e) => e.target.value && setPeriod(e.target.value)}
          className="input flex-1"
        />
      </div>

      {monthLoading || !month ? (
        <p className="text-sm text-gray-400">{t('report.loading')}</p>
      ) : (
        <div className="space-y-4">
          {/* การใช้คะแนน */}
          <Section title={t('report.pointsUsage')}>
            <div className="grid grid-cols-2 gap-3">
              <Stat label={t('report.billTotal')} value={n(month.points.bill_total)} unit={t('report.baht')} />
              <Stat label={t('report.earnCount')} value={n(month.points.earn_count)} unit={t('report.items')} />
              <Stat label={t('report.pointsAdded')} value={`+${n(month.points.points_added)}`} unit={t('report.points')} accent="green" />
              <Stat label={t('report.pointsRemoved')} value={n(month.points.points_removed)} unit={t('report.points')} accent="red" />
            </div>
          </Section>

          {/* คูปองที่ใช้ */}
          <Section title={`${t('report.coupons')} · ${t('report.couponsTotal')} ${month.coupons_total} ${t('report.times')}`}>
            {month.coupons.length === 0 ? (
              <p className="text-sm text-gray-400">{t('report.none')}</p>
            ) : (
              <ul className="space-y-1.5">
                {month.coupons.map((c, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="text-gray-700">{(isTh ? c.name_th : c.name_en) || c.name_th || c.name_en || '—'}</span>
                    <span className="font-bold text-cake-700">{c.count} {t('report.times')}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* รายชื่อโปรโมชันในเดือนนั้น */}
          <Section title={t('report.promotions')}>
            {month.promotions.length === 0 ? (
              <p className="text-sm text-gray-400">{t('report.none')}</p>
            ) : (
              <ul className="space-y-1.5">
                {month.promotions.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="text-gray-700">
                      {(isTh ? p.title_th : p.title_en) || p.title_th || p.title_en || '—'}
                    </span>
                    {p.points_required != null && (
                      <span className="text-xs text-cake-600">{p.points_required} {t('report.points')}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
      {children}
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
  big,
  span2,
  accent,
}: {
  label: string
  value: string
  unit?: string
  big?: boolean
  span2?: boolean
  accent?: 'green' | 'red'
}) {
  const valueColor =
    accent === 'green' ? 'text-green-600' : accent === 'red' ? 'text-cake-600' : 'text-cake-700'
  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${span2 ? 'col-span-2' : ''}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 font-bold ${valueColor} ${big ? 'text-3xl' : 'text-2xl'}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-gray-400">{unit}</span>}
      </p>
    </div>
  )
}
