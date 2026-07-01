import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import Toggle from '@/components/Toggle'
import type { Settings } from '@/types/database'

type ToggleKey = 'show_promotions' | 'show_coupons' | 'show_packages'

const TOGGLES: { key: ToggleKey; label: string }[] = [
  { key: 'show_promotions', label: 'settings.showPromotions' },
  { key: 'show_coupons', label: 'settings.showCoupons' },
  { key: 'show_packages', label: 'settings.showPackages' },
]

export default function SettingsPage() {
  const { t } = useTranslation()

  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [mapUrl, setMapUrl] = useState('')
  const [fbUrl, setFbUrl] = useState('')

  useEffect(() => {
    let active = true
    void (async () => {
      const { data, error: err } = await supabase
        .from('settings')
        .select('*')
        .eq('id', true)
        .maybeSingle()
      if (!active) return
      if (err) setError(err.message)
      const s = data as Settings | null
      if (s) {
        setSettings(s)
        setMapUrl(s.google_map_url ?? '')
        setFbUrl(s.facebook_url ?? '')
      }
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  function validUrl(v: string): boolean {
    return v === '' || /^https?:\/\//i.test(v.trim())
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setError(null)
    setSaved(false)

    if (!validUrl(mapUrl) || !validUrl(fbUrl)) {
      setError(t('settings.errUrl'))
      return
    }

    setSaving(true)
    const { data, error: err } = await supabase
      .from('settings')
      .update({
        google_map_url: mapUrl.trim() || null,
        facebook_url: fbUrl.trim() || null,
        show_promotions: settings.show_promotions,
        show_coupons: settings.show_coupons,
        show_packages: settings.show_packages,
      })
      .eq('id', true)
      .select('*')
      .single()
    setSaving(false)

    if (err) {
      setError(err.message)
      return
    }
    setSettings(data as Settings)
    setSaved(true)
  }

  function toggle(key: ToggleKey) {
    setSettings((s) => (s ? { ...s, [key]: !s[key] } : s))
    setSaved(false)
  }

  if (loading) return <p className="text-sm text-gray-400">{t('settings.loading')}</p>
  if (!settings) return <p className="text-sm text-cake-600">{error}</p>

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-cake-700">{t('settings.title')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{t('settings.hint')}</p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings.googleMap')}
        </span>
        <input
          type="url"
          inputMode="url"
          value={mapUrl}
          onChange={(e) => {
            setMapUrl(e.target.value)
            setSaved(false)
          }}
          placeholder={t('settings.urlPlaceholder')}
          className="input"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings.facebook')}
        </span>
        <input
          type="url"
          inputMode="url"
          value={fbUrl}
          onChange={(e) => {
            setFbUrl(e.target.value)
            setSaved(false)
          }}
          placeholder={t('settings.urlPlaceholder')}
          className="input"
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{t('settings.toggles')}</p>
        {TOGGLES.map(({ key, label }) => (
          <div
            key={key}
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm"
          >
            <span className="text-gray-700">{t(label)}</span>
            <Toggle checked={settings[key]} onChange={() => toggle(key)} />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-cake-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-cake-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-cake-700 disabled:opacity-60"
      >
        {saving ? t('settings.saving') : saved ? `✓ ${t('settings.saved')}` : t('settings.save')}
      </button>
    </form>
  )
}
