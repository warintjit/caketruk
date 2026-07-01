import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import type { Member, PointTransaction } from '@/types/database'

type Mode = 'earn' | 'adjust'

export default function ManagePointsPage() {
  const { t, i18n } = useTranslation()

  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [txs, setTxs] = useState<PointTransaction[]>([])

  const [mode, setMode] = useState<Mode>('earn')
  const [bill, setBill] = useState('')
  const [adjust, setAdjust] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<PointTransaction | null>(null)

  const dateFmt = new Intl.DateTimeFormat(i18n.language === 'th' ? 'th-TH' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  async function loadTxs(memberId: string) {
    const { data } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(10)
    setTxs((data as PointTransaction[]) ?? [])
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone) return
    setSearching(true)
    setSearchError(null)
    setMember(null)
    setResult(null)
    setFormError(null)

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle()
    setSearching(false)

    if (error) {
      setSearchError(error.message)
      return
    }
    if (!data) {
      setSearchError(t('admin.notFound'))
      return
    }
    const m = data as Member
    setMember(m)
    await loadTxs(m.id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!member) return
    setFormError(null)

    let payload: Record<string, unknown>
    if (mode === 'earn') {
      const billNum = Number(bill)
      if (!Number.isFinite(billNum) || billNum <= 0) {
        setFormError(t('admin.errBill'))
        return
      }
      payload = { p_phone: member.phone, p_bill: billNum, p_type: 'earn', p_note: note.trim() || null }
    } else {
      const pts = Number(adjust)
      if (!Number.isInteger(pts) || pts === 0) {
        setFormError(t('admin.errPoints'))
        return
      }
      payload = { p_phone: member.phone, p_points: pts, p_type: 'adjust', p_note: note.trim() || null }
    }

    setSubmitting(true)
    const { data, error } = await supabase.rpc('add_points', payload)
    setSubmitting(false)

    if (error) {
      setFormError(error.message)
      return
    }
    const tx = data as PointTransaction
    setResult(tx)
    // อัปเดตยอดคงเหลือในการ์ด + รีเฟรชรายการ + ล้างฟอร์ม
    setMember({ ...member, points_balance: tx.balance_after })
    setBill('')
    setAdjust('')
    setNote('')
    await loadTxs(member.id)
  }

  function resetAll() {
    setPhone('')
    setMember(null)
    setTxs([])
    setResult(null)
    setSearchError(null)
    setFormError(null)
    setBill('')
    setAdjust('')
    setNote('')
    setMode('earn')
  }

  const previewPoints = mode === 'earn' ? Math.floor((Number(bill) || 0) / 300) : Number(adjust) || 0

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-cake-700">{t('admin.managePointsTitle')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{t('admin.managePointsHint')}</p>
      </div>

      {/* ค้นหาสมาชิก */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('admin.searchPhone')}
          className="input"
        />
        <button
          type="submit"
          disabled={searching}
          className="shrink-0 rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:opacity-60"
        >
          {searching ? t('admin.searching') : t('admin.searchBtn')}
        </button>
      </form>
      {searchError && <p className="text-sm text-cake-600">{searchError}</p>}

      {member && (
        <>
          {/* การ์ดสมาชิก */}
          <div className="rounded-2xl bg-ink-900 p-5 text-white shadow-lg">
            <p className="text-sm text-cake-300">
              {member.display_name} {member.last_name ?? ''}
            </p>
            <p className="text-xs text-gray-400">{member.phone}</p>
            <p className="mt-3 text-xs uppercase tracking-widest text-gray-400">
              {t('admin.currentPoints')}
            </p>
            <p className="mt-1 text-3xl font-bold text-cake-500">
              {member.points_balance}{' '}
              <span className="text-base font-normal text-gray-400">{t('home.pointsUnit')}</span>
            </p>
          </div>

          {/* ผลลัพธ์หลังทำรายการ */}
          {result && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
              <p className="font-semibold text-green-700">✓ {t('admin.successTitle')}</p>
              <p className="mt-1 text-gray-600">
                {t('admin.pointsChanged')}:{' '}
                <span className={result.points >= 0 ? 'font-bold text-green-700' : 'font-bold text-cake-600'}>
                  {result.points >= 0 ? `+${result.points}` : result.points}
                </span>
                {' · '}
                {t('admin.newBalance')}: <span className="font-bold">{result.balance_after}</span>
              </p>
            </div>
          )}

          {/* ฟอร์มเพิ่ม/ปรับคะแนน */}
          <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-2">
              {(['earn', 'adjust'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    mode === m
                      ? 'bg-cake-600 text-white shadow'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {m === 'earn' ? t('admin.modeEarn') : t('admin.modeAdjust')}
                </button>
              ))}
            </div>

            {mode === 'earn' ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  {t('admin.billAmount')}
                </span>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={bill}
                  onChange={(e) => setBill(e.target.value)}
                  className="input"
                />
                <span className="mt-1 block text-xs text-gray-400">{t('admin.billHint')}</span>
              </label>
            ) : (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  {t('admin.adjustPoints')}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={adjust}
                  onChange={(e) => setAdjust(e.target.value)}
                  placeholder="-5"
                  className="input"
                />
                <span className="mt-1 block text-xs text-gray-400">{t('admin.adjustHint')}</span>
              </label>
            )}

            <p className="text-sm text-gray-600">
              {t('admin.pointsPreview')}:{' '}
              <span className="font-bold text-cake-700">
                {previewPoints >= 0 ? `+${previewPoints}` : previewPoints}
              </span>
            </p>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">{t('admin.note')}</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
            </label>

            {formError && <p className="text-sm text-cake-600">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-cake-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-cake-700 disabled:opacity-60"
            >
              {submitting
                ? t('admin.submitting')
                : mode === 'earn'
                  ? t('admin.submitEarn')
                  : t('admin.submitAdjust')}
            </button>
          </form>

          {/* รายการล่าสุด */}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">{t('admin.recentTx')}</p>
            {txs.length === 0 ? (
              <p className="text-sm text-gray-400">{t('admin.noTx')}</p>
            ) : (
              <ul className="space-y-2">
                {txs.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-700">
                        {tx.type === 'earn' ? t('admin.typeEarn') : t('admin.typeAdjust')}
                        {tx.bill_amount != null && (
                          <span className="text-gray-400"> · ฿{tx.bill_amount}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{dateFmt.format(new Date(tx.created_at))}</p>
                    </div>
                    <span
                      className={`font-bold ${tx.points >= 0 ? 'text-green-600' : 'text-cake-600'}`}
                    >
                      {tx.points >= 0 ? `+${tx.points}` : tx.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={resetAll}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            {t('admin.reset')}
          </button>
        </>
      )}
    </div>
  )
}
