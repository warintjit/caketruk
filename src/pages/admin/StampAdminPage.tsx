import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import type { Member, StampCard } from '@/types/database'

export default function StampAdminPage() {
  const { t } = useTranslation()
  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [card, setCard] = useState<StampCard | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const clean = phone.replace(/\D/g, '')
    if (!clean) return
    setSearching(true)
    setSearchError(null)
    setMember(null)
    setCard(null)
    setError(null)

    const { data: m, error: mErr } = await supabase
      .from('members')
      .select('*')
      .eq('phone', clean)
      .maybeSingle()
    if (mErr) {
      setSearching(false)
      setSearchError(mErr.message)
      return
    }
    if (!m) {
      setSearching(false)
      setSearchError(t('stamp.notFound'))
      return
    }
    const mem = m as Member
    setMember(mem)
    const { data: c } = await supabase
      .from('stamp_cards')
      .select('*')
      .eq('member_id', mem.id)
      .maybeSingle()
    setCard((c as StampCard) ?? null)
    setSearching(false)
  }

  async function addCup() {
    if (!member) return
    setError(null)
    setBusy(true)
    const { data, error: err } = await supabase.rpc('add_stamp', { p_phone: member.phone })
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setCard(data as StampCard)
  }

  async function redeemFree() {
    if (!member) return
    setError(null)
    setBusy(true)
    const { data, error: err } = await supabase.rpc('redeem_stamp_free', { p_phone: member.phone })
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setCard(data as StampCard)
  }

  const count = card?.count ?? 0
  const free = card?.free_available ?? 0

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-cake-700">{t('stamp.adminTitle')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{t('stamp.hint')}</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('stamp.searchPhone')}
          className="input"
        />
        <button
          type="submit"
          disabled={searching}
          className="shrink-0 rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:opacity-60"
        >
          {searching ? t('stamp.searching') : t('stamp.search')}
        </button>
      </form>
      {searchError && <p className="text-sm text-cake-600">{searchError}</p>}

      {member && (
        <>
          <div className="rounded-2xl bg-ink-900 p-5 text-white shadow-lg">
            <p className="text-sm text-cake-300">
              {member.display_name} {member.last_name ?? ''}
            </p>
            <p className="text-xs text-gray-400">{member.phone}</p>

            <div className="mt-4 flex items-end justify-between">
              <p className="text-4xl font-bold text-cake-500">
                {count}
                <span className="text-lg font-normal text-gray-400"> / 10 {t('stamp.cups')}</span>
              </p>
              {free > 0 && (
                <span className="rounded-full bg-cake-600 px-3 py-1 text-sm font-bold">
                  {t('stamp.freeReady', { count: free })}
                </span>
              )}
            </div>

            {/* แถบความคืบหน้า 10 ช่อง */}
            <div className="mt-3 grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 rounded-full ${i < count ? 'bg-cake-500' : 'bg-white/15'}`}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-cake-600">{error}</p>}

          <button
            type="button"
            onClick={() => void addCup()}
            disabled={busy}
            className="w-full rounded-xl bg-cake-600 px-4 py-3 text-lg font-bold text-white shadow-md transition hover:bg-cake-700 disabled:opacity-60"
          >
            {busy ? t('stamp.saving') : t('stamp.addCup')}
          </button>

          {free > 0 && (
            <button
              type="button"
              onClick={() => void redeemFree()}
              disabled={busy}
              className="w-full rounded-xl border border-cake-300 px-4 py-2.5 text-sm font-semibold text-cake-700 transition hover:bg-cake-50 disabled:opacity-60"
            >
              {t('stamp.useFree')}
            </button>
          )}
        </>
      )}
    </div>
  )
}
