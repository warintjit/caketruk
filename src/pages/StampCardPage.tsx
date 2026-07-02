import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import type { StampCard } from '@/types/database'

export default function StampCardPage() {
  const { t } = useTranslation()
  const { member } = useAuth()
  const [card, setCard] = useState<StampCard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!member) return
    let active = true
    void (async () => {
      const { data } = await supabase
        .from('stamp_cards')
        .select('*')
        .eq('member_id', member.id)
        .maybeSingle()
      if (active) {
        setCard((data as StampCard) ?? null)
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [member])

  const count = card?.count ?? 0
  const free = card?.free_available ?? 0

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes stampPop {
          0%   { transform: scale(0) rotate(-35deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(6deg); opacity: 1; }
          100% { transform: scale(1) rotate(-8deg); opacity: 1; }
        }
        .stamp-in { animation: stampPop 0.45s cubic-bezier(.34,1.56,.64,1) backwards; }
      `}</style>

      {/* บัตรสะสม สไตล์แบรนด์ */}
      <div className="overflow-hidden rounded-3xl border border-cake-100 bg-gradient-to-b from-[#fdeee7] to-[#f9dcd2] p-5 shadow-lg">
        <div className="flex flex-col items-center">
          <Logo className="h-9 w-9" />
          <p className="mt-1 text-lg font-extrabold tracking-wide text-cake-700">{t('app.name')}</p>
          <p className="text-[11px] text-cake-600">{t('stamp.tagline')}</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cake-500">
            Bubble Tea Stamp Card
          </p>
        </div>

        {/* 10 ช่อง (2 แถว × 5) */}
        <div className="mt-4 grid grid-cols-5 gap-2.5">
          {Array.from({ length: 10 }).map((_, i) => {
            const stamped = i < count
            return (
              <div
                key={i}
                className={`relative flex aspect-square items-center justify-center rounded-2xl border-2 ${
                  stamped ? 'border-cake-300 bg-white' : 'border-dashed border-cake-300/60 bg-white/70'
                }`}
              >
                {/* เลขช่อง */}
                <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cake-700 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                {stamped && (
                  <span
                    className="stamp-in text-3xl"
                    style={{ animationDelay: `${i * 0.08}s` }}
                    aria-hidden
                  >
                    🧋
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* สถานะ */}
      {loading ? (
        <p className="text-sm text-gray-400">{t('stamp.loading')}</p>
      ) : free > 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm font-bold text-green-700">
          {t('stamp.freeReady', { count: free })}
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500">{t('stamp.toNextFree', { n: 10 - count })}</p>
      )}

      {/* กติกา */}
      <div className="rounded-xl bg-cake-50 p-3 text-center text-xs text-gray-500">
        <p>{t('stamp.rule1')}</p>
        <p>{t('stamp.rule2')}</p>
      </div>
    </div>
  )
}
