import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { uploadImage, deleteImage } from '@/lib/storage'
import type { Coupon } from '@/types/database'

type Draft = {
  id: string | null
  name_th: string
  name_en: string
  image_url: string | null
  max_uses_per_user: number
  sort_order: number
  is_active: boolean
}

const emptyDraft: Draft = {
  id: null,
  name_th: '',
  name_en: '',
  image_url: null,
  max_uses_per_user: 1,
  sort_order: 0,
  is_active: true,
}

export default function CouponsAdminPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function reload() {
    const { data, error: err } = await supabase
      .from('coupons')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    setItems((data as Coupon[]) ?? [])
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

  function startEdit(c: Coupon) {
    setDraft({
      id: c.id,
      name_th: c.name_th ?? '',
      name_en: c.name_en ?? '',
      image_url: c.image_url,
      max_uses_per_user: c.max_uses_per_user,
      sort_order: c.sort_order,
      is_active: c.is_active,
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
      const url = await uploadImage(file, 'coupons')
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
      name_th: draft.name_th.trim() || null,
      name_en: draft.name_en.trim() || null,
      image_url: draft.image_url,
      max_uses_per_user: Math.max(1, draft.max_uses_per_user),
      sort_order: draft.sort_order,
      is_active: draft.is_active,
    }
    const { error: err } = draft.id
      ? await supabase.from('coupons').update(payload).eq('id', draft.id)
      : await supabase.from('coupons').insert(payload)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setEditing(false)
    setDraft(emptyDraft)
    await reload()
  }

  async function toggleActive(c: Coupon) {
    await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id)
    await reload()
  }

  async function remove(c: Coupon) {
    if (!window.confirm(t('coupon.confirmDelete'))) return
    await supabase.from('coupons').delete().eq('id', c.id)
    await deleteImage(c.image_url)
    await reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-cake-700">{t('coupon.manageTitle')}</h1>
        {!editing && (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-lg bg-cake-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-cake-700"
          >
            + {t('coupon.add')}
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={save} className="space-y-3 rounded-xl border border-gray-200 p-4">
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('coupon.image')}</span>
            {draft.image_url && (
              <img src={draft.image_url} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-cake-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-cake-700"
            />
            {uploading && <p className="mt-1 text-xs text-gray-400">{t('coupon.uploading')}</p>}
          </div>

          <Field label={t('coupon.nameTh')}>
            <input
              value={draft.name_th}
              onChange={(e) => setDraft({ ...draft, name_th: e.target.value })}
              className="input"
            />
          </Field>
          <Field label={t('coupon.nameEn')}>
            <input
              value={draft.name_en}
              onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
              className="input"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              {t('coupon.maxUses')}
              <input
                type="number"
                min="1"
                value={draft.max_uses_per_user}
                onChange={(e) =>
                  setDraft({ ...draft, max_uses_per_user: Number(e.target.value) || 1 })
                }
                className="input w-20"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              {t('coupon.sortOrder')}
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
              {t('coupon.active')}
            </label>
          </div>

          {error && <p className="text-sm text-cake-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 rounded-xl bg-cake-600 px-4 py-2.5 font-semibold text-white shadow-md transition hover:bg-cake-700 disabled:opacity-60"
            >
              {saving ? t('coupon.saving') : t('coupon.save')}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              {t('coupon.cancel')}
            </button>
          </div>
        </form>
      )}

      {!editing && (
        <>
          {loading ? (
            <p className="text-sm text-gray-400">{t('coupon.loading')}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400">{t('coupon.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {items.map((c) => (
                <li
                  key={c.id}
                  className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  {c.image_url ? (
                    <img src={c.image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">
                      {c.name_th || c.name_en || '—'}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {t('coupon.maxUses')}: {c.max_uses_per_user}
                      {!c.is_active && (
                        <span className="ml-1 text-cake-600">· {t('coupon.inactive')}</span>
                      )}
                    </p>
                    <div className="mt-1.5 flex gap-3 text-xs">
                      <button type="button" onClick={() => startEdit(c)} className="font-medium text-cake-700">
                        {t('coupon.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleActive(c)}
                        className="font-medium text-gray-500"
                      >
                        {c.is_active ? t('coupon.inactive') : t('coupon.active')}
                      </button>
                      <button type="button" onClick={() => void remove(c)} className="font-medium text-cake-600">
                        {t('coupon.delete')}
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
