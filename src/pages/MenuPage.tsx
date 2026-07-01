import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import type { MenuImage } from '@/types/database'

export default function MenuPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<MenuImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void (async () => {
      const { data } = await supabase
        .from('menu_images')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (active) {
        setItems((data as MenuImage[]) ?? [])
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-cake-700">{t('nav.menu')}</h1>

      {loading ? (
        <p className="text-sm text-gray-400">{t('menuMgr.loading')}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">{t('menuMgr.memberEmpty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <img src={item.image_url} alt="" className="w-full object-cover" />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
