import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import type { Promotion } from '@/types/database'

export default function PromotionsPage() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const isTh = i18n.language === 'th'

  useEffect(() => {
    let active = true
    void (async () => {
      // RLS แสดงเฉพาะโปรโมชันที่เปิดใช้งาน + toggle show_promotions เปิดอยู่
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
      if (active) {
        setItems((data as Promotion[]) ?? [])
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const title = (p: Promotion) => (isTh ? p.title_th || p.title_en : p.title_en || p.title_th)
  const desc = (p: Promotion) =>
    isTh ? p.description_th || p.description_en : p.description_en || p.description_th

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-cake-700">{t('nav.promotions')}</h1>

      {loading ? (
        <p className="text-sm text-gray-400">{t('promo.loading')}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">{t('promo.memberEmpty')}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {p.image_url && (
                <img src={p.image_url} alt={title(p) ?? ''} className="w-full object-cover" />
              )}
              <div className="p-4">
                {title(p) && <p className="font-bold text-gray-800">{title(p)}</p>}
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="whitespace-pre-line text-sm text-gray-500">{desc(p) ?? ''}</p>
                  {p.points_required != null && (
                    <span className="shrink-0 rounded-full bg-cake-600 px-3 py-1 text-sm font-bold text-white shadow-sm">
                      {t('promo.usePoints', { points: p.points_required })}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
