import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import { supabase } from '@/lib/supabase'

/**
 * แก้ไขข้อมูลสมาชิก (ของตัวเอง) — ตามกติกาเดิม:
 * แก้ได้: ชื่อ / นามสกุล / วันเกิด · เบอร์โทรล็อก (แก้ไม่ได้หลังกรอกครั้งแรก)
 */
export default function EditProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { member, refreshMember } = useAuth()

  const [displayName, setDisplayName] = useState(member?.display_name ?? '')
  const [lastName, setLastName] = useState(member?.last_name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!member) return
    setError(null)
    setSaving(true)
    // แก้ได้เฉพาะชื่อ/นามสกุล — เบอร์+วันเกิดล็อก (บังคับที่ DB trigger ด้วย)
    const { error: updateError } = await supabase
      .from('members')
      .update({
        display_name: displayName.trim(),
        last_name: lastName.trim(),
      })
      .eq('id', member.id)
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    await refreshMember()
    navigate('/', { replace: true })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-bold text-cake-700">{t('profile.editTitle')}</h1>

      {member?.photo_url && (
        <img
          src={member.photo_url}
          alt=""
          className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-cake-200"
        />
      )}

      <Field label={t('auth.displayName')}>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="input"
        />
      </Field>

      <Field label={t('auth.lastName')}>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="input"
        />
      </Field>

      {/* วันเกิด — ล็อก (กันเปลี่ยนเดือนฟาร์มคูปองวันเกิด) */}
      <Field label={t('auth.birthday')} hint={t('profile.birthdayLocked')}>
        <input
          type="date"
          value={member?.birthday ?? ''}
          disabled
          className="input bg-gray-50 text-gray-400"
        />
      </Field>

      {/* เบอร์โทร — ล็อก แก้ไม่ได้ (ใช้สะสมคะแนน) */}
      <Field label={t('auth.phone')} hint={t('auth.phoneLocked')}>
        <input value={member?.phone ?? ''} disabled className="input bg-gray-50 text-gray-400" />
      </Field>

      {error && <p className="text-sm text-cake-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-cake-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-cake-700 disabled:opacity-60"
      >
        {saving ? t('profile.saving') : t('profile.save')}
      </button>
    </form>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  )
}
