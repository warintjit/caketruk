import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import { supabase } from '@/lib/supabase'
import type { StampCard } from '@/types/database'

/** ลายขนม/ชานมกระจายเป็นพื้นหลังบัตร (จางๆ น่ารัก) */
const DOODLES = [
  { e: '🍩', top: '6%', left: '6%', size: 22, rot: -12, op: 0.22 },
  { e: '🧁', top: '10%', left: '88%', size: 24, rot: 14, op: 0.22 },
  { e: '🍰', top: '44%', left: '3%', size: 26, rot: -8, op: 0.18 },
  { e: '🍬', top: '30%', left: '94%', size: 20, rot: 20, op: 0.2 },
  { e: '🌸', top: '72%', left: '7%', size: 20, rot: 10, op: 0.22 },
  { e: '💗', top: '84%', left: '90%', size: 22, rot: -14, op: 0.22 },
  { e: '🧋', top: '2%', left: '48%', size: 18, rot: 0, op: 0.16 },
  { e: '🍮', top: '90%', left: '30%', size: 20, rot: 8, op: 0.16 },
  { e: '🌷', top: '60%', left: '96%', size: 18, rot: -10, op: 0.18 },
]

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
          0%   { transform: scale(0) rotate(-40deg); opacity: 0; }
          55%  { transform: scale(1.25) rotate(8deg); opacity: 1; }
          100% { transform: scale(1) rotate(-7deg); opacity: 1; }
        }
        .stamp-in { animation: stampPop .5s cubic-bezier(.34,1.56,.64,1) backwards; }
      `}</style>

      {/* ===== บัตรสะสม ===== */}
      <div
        className="relative overflow-hidden rounded-[28px] p-5 shadow-xl ring-1 ring-white/60"
        style={{ background: 'linear-gradient(160deg,#fdefe9 0%,#fbe1d7 55%,#f6d0c5 100%)' }}
      >
        {/* ลายพื้นหลัง */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {/* วงพื้นหลังนุ่มๆ */}
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/25" />
          <div className="absolute -right-8 top-16 h-28 w-28 rounded-full bg-cake-200/40" />
          {DOODLES.map((d, i) => (
            <span
              key={i}
              className="absolute"
              style={{
                top: d.top,
                left: d.left,
                fontSize: d.size,
                opacity: d.op,
                transform: `translate(-50%,-50%) rotate(${d.rot}deg)`,
              }}
            >
              {d.e}
            </span>
          ))}
        </div>

        {/* หัวบัตร */}
        <div className="relative flex flex-col items-center text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cake-500">Cake Tee Rak</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-2xl">🧋</span>
            <h1 className="text-3xl font-extrabold tracking-wide text-cake-700">{t('app.name')}</h1>
            <span className="text-2xl">🧋</span>
          </div>
          <span className="mt-1 rounded-full bg-cake-200/70 px-3 py-0.5 text-[11px] font-medium text-cake-700">
            {t('stamp.tagline')}
          </span>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-cake-500">
            Bubble Tea Stamp Card
          </p>
        </div>

        {/* 10 ช่อง (2 แถว × 5) */}
        <div className="relative mt-4 grid grid-cols-5 gap-2.5">
          {Array.from({ length: 10 }).map((_, i) => {
            const stamped = i < count
            return (
              <div
                key={i}
                className={`relative flex aspect-square items-center justify-center rounded-2xl border-2 shadow-sm ${
                  stamped ? 'border-cake-300 bg-white' : 'border-dashed border-[#c98a6a]/50 bg-white/75'
                }`}
              >
                <span
                  className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow"
                  style={{ background: '#5b3a2e' }}
                >
                  {i + 1}
                </span>
                {stamped && (
                  <span
                    className="stamp-in text-[28px] drop-shadow-sm"
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
        <p className="text-center text-sm text-gray-400">{t('stamp.loading')}</p>
      ) : free > 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm font-bold text-green-700">
          {t('stamp.freeReady', { count: free })}
        </div>
      ) : (
        <p className="text-center text-sm font-medium text-cake-700">
          {t('stamp.toNextFree', { n: 10 - count })}
        </p>
      )}

      {/* กติกา */}
      <div className="flex items-center justify-center gap-4 rounded-xl bg-cake-50 p-3 text-center text-xs text-gray-600">
        <span>🥤 {t('stamp.rule1')}</span>
        <span className="text-cake-300">•</span>
        <span>🎁 {t('stamp.rule2')}</span>
      </div>
    </div>
  )
}
