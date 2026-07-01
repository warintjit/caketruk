import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { uploadImage, deleteImage } from '@/lib/storage'
import type { MenuImage } from '@/types/database'

export default function MenuAdminPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<MenuImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function reload() {
    const { data, error: err } = await supabase
      .from('menu_images')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (err) setError(err.message)
    setItems((data as MenuImage[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const url = await uploadImage(file, 'menu')
      const nextSort = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0
      const { error: err } = await supabase
        .from('menu_images')
        .insert({ image_url: url, sort_order: nextSort })
      if (err) throw new Error(err.message)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function updateSort(item: MenuImage, value: number) {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, sort_order: value } : i)))
    await supabase.from('menu_images').update({ sort_order: value }).eq('id', item.id)
  }

  async function remove(item: MenuImage) {
    if (!window.confirm(t('menuMgr.confirmDelete'))) return
    await supabase.from('menu_images').delete().eq('id', item.id)
    await deleteImage(item.image_url)
    await reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-cake-700">{t('menuMgr.title')}</h1>
        <label className="cursor-pointer rounded-lg bg-cake-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-cake-700">
          + {t('menuMgr.add')}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {uploading && <p className="text-sm text-gray-400">{t('menuMgr.uploading')}</p>}
      {error && <p className="text-sm text-cake-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">{t('menuMgr.loading')}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">{t('menuMgr.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
            >
              <img src={item.image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                {t('menuMgr.sortOrder')}
                <input
                  type="number"
                  value={item.sort_order}
                  onChange={(e) => void updateSort(item, Number(e.target.value) || 0)}
                  className="input w-20"
                />
              </label>
              <button
                type="button"
                onClick={() => void remove(item)}
                className="ml-auto text-sm font-medium text-cake-600"
              >
                {t('menuMgr.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
