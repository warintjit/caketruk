import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import type { SpecialPackage } from '@/types/database'

export default function PackagesPage() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<SpecialPackage[]>([])
  const [loading, setLoading] = useState(true)
  const isTh = i18n.language === 'th'

  useEffect(() => {
    let active = true
    void (async () => {
      const { data } = await supabase
        .from('special_packages')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
      if (active) {
        setItems((data as SpecialPackage[]) ?? [])
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const name = (p: SpecialPackage) => (isTh ? p.name_th || p.name_en : p.name_en || p.name_th)
  const desc = (p: SpecialPackage) =>
    isTh ? p.description_th || p.description_en : p.description_en || p.description_th

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-cake-700">{t('nav.packages')}</h1>

      {loading ? (
        <p className="text-sm text-gray-400">{t('pkg.loading')}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">{t('pkg.memberEmpty')}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {p.image_url && <img src={p.image_url} alt={name(p) ?? ''} className="w-full object-cover" />}
              <div className="p-4">
                <div className="flex items-baseline justify-between gap-2">
                  {name(p) && <p className="font-bold text-gray-800">{name(p)}</p>}
                  {p.price != null && (
                    <p className="shrink-0 font-bold text-cake-600">฿{p.price}</p>
                  )}
                </div>
                {desc(p) && <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{desc(p)}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
