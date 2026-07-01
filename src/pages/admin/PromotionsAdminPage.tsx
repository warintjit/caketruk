import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { uploadImage, deleteImage } from '@/lib/storage'
import type { Promotion } from '@/types/database'

type Draft = {
  id: string | null
  title_th: string
  title_en: string
  description_th: string
  description_en: string
  image_url: string | null
  sort_order: number
  is_active: boolean
}

const emptyDraft: Draft = {
  id: null,
  title_th: '',
  title_en: '',
  description_th: '',
  description_en: '',
  image_url: null,
  sort_order: 0,
  is_active: true,
}

export default function PromotionsAdminPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function reload() {
    const { data, error: err } = await supabase
      .from('promotions')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    setItems((data as Promotion[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  function startAdd() {
    setDraft(emptyDraft)
    setEditing(true)
    setError(null)
  }

  function startEdit(p: Promotion) {
    setDraft({
      id: p.id,
      title_th: p.title_th ?? '',
      title_en: p.title_en ?? '',
      description_th: p.description_th ?? '',
      description_en: p.description_en ?? '',
      image_url: p.image_url,
      sort_order: p.sort_order,
      is_active: p.is_active,
    })
    setEditing(true)
    setError(null)
  }

  function cancel() {
    setEditing(false)
    setDraft(emptyDraft)
    setError(null)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const url = await uploadImage(file, 'promotions')
      setDraft((d) => ({ ...d, image_url: url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const payload = {
      title_th: draft.title_th.trim() || null,
      title_en: draft.title_en.trim() || null,
      description_th: draft.description_th.trim() || null,
      description_en: draft.description_en.trim() || null,
      image_url: draft.image_url,
      sort_order: draft.sort_order,
      is_active: draft.is_active,
    }
    const { error: err } = draft.id
      ? await supabase.from('promotions').update(payload).eq('id', draft.id)
      : await supabase.from('promotions').insert(payload)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setEditing(false)
    setDraft(emptyDraft)
    await reload()
  }

  async function toggleActive(p: Promotion) {
    await supabase.from('promotions').update({ is_active: !p.is_active }).eq('id', p.id)
    await reload()
  }

  async function remove(p: Promotion) {
    if (!window.confirm(t('promo.confirmDelete'))) return
    await supabase.from('promotions').delete().eq('id', p.id)
    await deleteImage(p.image_url)
    await reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-cake-700">{t('promo.manageTitle')}</h1>
        {!editing && (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-lg bg-cake-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-cake-700"
          >
            + {t('promo.add')}
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={save} className="space-y-3 rounded-xl border border-gray-200 p-4">
          {/* อัปโหลดรูป */}
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('promo.image')}</span>
            {draft.image_url && (
              <img
                src={draft.image_url}
                alt=""
                className="mb-2 h-32 w-full rounded-lg object-cover"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-cake-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-cake-700"
            />
            {uploading && <p className="mt-1 text-xs text-gray-400">{t('promo.uploading')}</p>}
          </div>

          <Field label={t('promo.titleTh')}>
            <input
              value={draft.title_th}
              onChange={(e) => setDraft({ ...draft, title_th: e.target.value })}
              className="input"
            />
          </Field>
          <Field label={t('promo.titleEn')}>
            <input
              value={draft.title_en}
              onChange={(e) => setDraft({ ...draft, title_en: e.target.value })}
              className="input"
            />
          </Field>
          <Field label={t('promo.descTh')}>
            <textarea
              value={draft.description_th}
              onChange={(e) => setDraft({ ...draft, description_th: e.target.value })}
              rows={2}
              className="input"
            />
          </Field>
          <Field label={t('promo.descEn')}>
            <textarea
              value={draft.description_en}
              onChange={(e) => setDraft({ ...draft, description_en: e.target.value })}
              rows={2}
              className="input"
            />
          </Field>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              {t('promo.sortOrder')}
              <input
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
                className="input w-20"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                className="h-4 w-4 accent-cake-600"
              />
              {t('promo.active')}
            </label>
          </div>

          {error && <p className="text-sm text-cake-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 rounded-xl bg-cake-600 px-4 py-2.5 font-semibold text-white shadow-md transition hover:bg-cake-700 disabled:opacity-60"
            >
              {saving ? t('promo.saving') : t('promo.save')}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              {t('promo.cancel')}
            </button>
          </div>
        </form>
      )}

      {!editing && (
        <>
          {loading ? (
            <p className="text-sm text-gray-400">{t('promo.loading')}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400">{t('promo.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {items.map((p) => (
                <li
                  key={p.id}
                  className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">
                      {p.title_th || p.title_en || '—'}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {t('promo.sortOrder')}: {p.sort_order}
                      {!p.is_active && (
                        <span className="ml-1 text-cake-600">· {t('promo.inactive')}</span>
                      )}
                    </p>
                    <div className="mt-1.5 flex gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="font-medium text-cake-700"
                      >
                        {t('promo.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleActive(p)}
                        className="font-medium text-gray-500"
                      >
                        {p.is_active ? t('promo.inactive') : t('promo.active')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(p)}
                        className="font-medium text-cake-600"
                      >
                        {t('promo.delete')}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}
