import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { uploadImage, deleteImage } from '@/lib/storage'
import Toggle from '@/components/Toggle'
import type { SpecialPackage } from '@/types/database'

type Draft = {
  id: string | null
  name_th: string
  name_en: string
  description_th: string
  description_en: string
  price: string
  image_url: string | null
  sort_order: number
  is_active: boolean
}

const emptyDraft: Draft = {
  id: null,
  name_th: '',
  name_en: '',
  description_th: '',
  description_en: '',
  price: '',
  image_url: null,
  sort_order: 0,
  is_active: true,
}

export default function PackagesAdminPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<SpecialPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function reload() {
    const { data, error: err } = await supabase
      .from('special_packages')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    setItems((data as SpecialPackage[]) ?? [])
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

  function startEdit(p: SpecialPackage) {
    setDraft({
      id: p.id,
      name_th: p.name_th ?? '',
      name_en: p.name_en ?? '',
      description_th: p.description_th ?? '',
      description_en: p.description_en ?? '',
      price: p.price != null ? String(p.price) : '',
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
      const url = await uploadImage(file, 'packages')
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
    const priceNum = draft.price.trim() === '' ? null : Number(draft.price)
    const payload = {
      name_th: draft.name_th.trim() || null,
      name_en: draft.name_en.trim() || null,
      description_th: draft.description_th.trim() || null,
      description_en: draft.description_en.trim() || null,
      price: priceNum,
      image_url: draft.image_url,
      sort_order: draft.sort_order,
      is_active: draft.is_active,
    }
    const { error: err } = draft.id
      ? await supabase.from('special_packages').update(payload).eq('id', draft.id)
      : await supabase.from('special_packages').insert(payload)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setEditing(false)
    setDraft(emptyDraft)
    await reload()
  }

  async function toggleActive(p: SpecialPackage) {
    await supabase.from('special_packages').update({ is_active: !p.is_active }).eq('id', p.id)
    await reload()
  }

  async function remove(p: SpecialPackage) {
    if (!window.confirm(t('pkg.confirmDelete'))) return
    await supabase.from('special_packages').delete().eq('id', p.id)
    await deleteImage(p.image_url)
    await reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-cake-700">{t('pkg.manageTitle')}</h1>
        {!editing && (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-lg bg-cake-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-cake-700"
          >
            + {t('pkg.add')}
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={save} className="space-y-3 rounded-xl border border-gray-200 p-4">
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('pkg.image')}</span>
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
            <p className="mt-1 text-xs text-gray-400">{t('common.imageHint')}</p>
            {uploading && <p className="mt-1 text-xs text-cake-600">{t('pkg.uploading')}</p>}
          </div>

          <Field label={t('pkg.nameTh')}>
            <input
              value={draft.name_th}
              onChange={(e) => setDraft({ ...draft, name_th: e.target.value })}
              className="input"
            />
          </Field>
          <Field label={t('pkg.nameEn')}>
            <input
              value={draft.name_en}
              onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
              className="input"
            />
          </Field>
          <Field label={t('pkg.price')}>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              className="input"
            />
          </Field>
          <Field label={t('pkg.descTh')}>
            <textarea
              value={draft.description_th}
              onChange={(e) => setDraft({ ...draft, description_th: e.target.value })}
              rows={2}
              className="input"
            />
          </Field>
          <Field label={t('pkg.descEn')}>
            <textarea
              value={draft.description_en}
              onChange={(e) => setDraft({ ...draft, description_en: e.target.value })}
              rows={2}
              className="input"
            />
          </Field>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              {t('pkg.sortOrder')}
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
              {t('pkg.active')}
            </label>
          </div>

          {error && <p className="text-sm text-cake-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 rounded-xl bg-cake-600 px-4 py-2.5 font-semibold text-white shadow-md transition hover:bg-cake-700 disabled:opacity-60"
            >
              {saving ? t('pkg.saving') : t('pkg.save')}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              {t('pkg.cancel')}
            </button>
          </div>
        </form>
      )}

      {!editing && (
        <>
          {loading ? (
            <p className="text-sm text-gray-400">{t('pkg.loading')}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400">{t('pkg.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {items.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">
                      {p.name_th || p.name_en || '—'}
                      {p.price != null && <span className="text-cake-600"> · ฿{p.price}</span>}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {t('pkg.sortOrder')}: {p.sort_order}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <button type="button" onClick={() => startEdit(p)} className="font-medium text-cake-700">
                        {t('pkg.edit')}
                      </button>
                      <button type="button" onClick={() => void remove(p)} className="font-medium text-cake-600">
                        {t('pkg.delete')}
                      </button>
                    </div>
                  </div>
                  {/* สวิตช์ เปิด/ปิด — ขอบขวาการ์ด ชัดเจน */}
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <Toggle checked={p.is_active} onChange={() => void toggleActive(p)} />
                    <span
                      className={`text-[11px] font-medium ${p.is_active ? 'text-cake-700' : 'text-gray-400'}`}
                    >
                      {p.is_active ? t('common.on') : t('common.off')}
                    </span>
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
