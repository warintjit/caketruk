import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { uploadImage, deleteImage } from '@/lib/storage'
import type { HomeTile } from '@/types/database'

/** ป้ายชื่อของแต่ละการ์ด (ใช้คีย์ i18n เดิม) */
const TILE_LABEL: Record<string, string> = {
  promotions: 'nav.promotions',
  menu: 'nav.menu',
  coupons: 'nav.coupons',
  packages: 'nav.packages',
}

// เฉพาะการ์ดที่แสดงบนหน้าแรก (ประวัติย้ายไปอยู่การ์ดคะแนนแล้ว)
const ORDER = ['promotions', 'menu', 'coupons', 'packages']

export default function HomeTilesAdminPage() {
  const { t } = useTranslation()
  const [tiles, setTiles] = useState<HomeTile[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function reload() {
    const { data, error: err } = await supabase.from('home_tiles').select('*')
    if (err) setError(err.message)
    const rows = ((data as HomeTile[]) ?? [])
      .filter((r) => ORDER.includes(r.key))
      .sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key))
    setTiles(rows)
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  async function handleFile(tile: HomeTile, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setBusyKey(tile.key)
    try {
      const url = await uploadImage(file, 'tiles')
      const { error: err } = await supabase
        .from('home_tiles')
        .update({ image_url: url })
        .eq('key', tile.key)
      if (err) throw new Error(err.message)
      await deleteImage(tile.image_url) // ลบรูปเก่า
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyKey(null)
      const input = fileRefs.current[tile.key]
      if (input) input.value = ''
    }
  }

  async function removeImage(tile: HomeTile) {
    if (!tile.image_url) return
    setBusyKey(tile.key)
    await supabase.from('home_tiles').update({ image_url: null }).eq('key', tile.key)
    await deleteImage(tile.image_url)
    setBusyKey(null)
    await reload()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-cake-700">{t('tiles.title')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{t('tiles.hint')}</p>
      </div>

      {error && <p className="text-sm text-cake-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">{t('tiles.loading')}</p>
      ) : (
        <ul className="space-y-3">
          {tiles.map((tile) => (
            <li key={tile.key} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                {tile.image_url ? (
                  <img src={tile.image_url} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cake-500 to-cake-700 text-xs font-bold text-white">
                    {t(TILE_LABEL[tile.key] ?? tile.key)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800">{t(TILE_LABEL[tile.key] ?? tile.key)}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs">
                    <label className="cursor-pointer font-medium text-cake-700">
                      {busyKey === tile.key ? t('tiles.uploading') : t('promo.upload')}
                      <input
                        ref={(el) => {
                          fileRefs.current[tile.key] = el
                        }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handleFile(tile, e)}
                        disabled={busyKey === tile.key}
                        className="hidden"
                      />
                    </label>
                    {tile.image_url && (
                      <button
                        type="button"
                        onClick={() => void removeImage(tile)}
                        disabled={busyKey === tile.key}
                        className="font-medium text-cake-600"
                      >
                        {t('tiles.remove')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
