import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import { supabase } from '@/lib/supabase'
import LoadingScreen from '@/components/LoadingScreen'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function CompleteProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { loading, session, member, profileComplete, refreshMember } = useAuth()

  const [displayName, setDisplayName] = useState(member?.display_name ?? '')
  const [lastName, setLastName] = useState(member?.last_name ?? '')
  const [birthday, setBirthday] = useState(member?.birthday ?? '')
  const [phone, setPhone] = useState(member?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (profileComplete) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!member) return
    setError(null)

    const cleanPhone = phone.replace(/\D/g, '') // เก็บเฉพาะตัวเลข
    if (cleanPhone.length < 9) {
      setError(t('auth.errPhone'))
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from('members')
      .update({
        display_name: displayName.trim(),
        last_name: lastName.trim(),
        birthday,
        phone: cleanPhone,
      })
      .eq('id', member.id)
    setSaving(false)

    if (updateError) {
      // 23505 = unique violation (เบอร์ซ้ำ)
      setError(
        updateError.code === '23505' ? t('auth.errPhoneDup') : updateError.message,
      )
      return
    }
    await refreshMember()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white">
      <header className="flex items-center justify-between bg-ink-900 px-4 py-3 text-white">
        <p className="text-sm font-bold">{t('auth.completeTitle')}</p>
        <LanguageSwitcher />
      </header>

      <form onSubmit={handleSubmit} className="flex-1 space-y-4 px-5 py-6">
        {member?.photo_url && (
          <img
            src={member.photo_url}
            alt=""
            className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-cake-200"
          />
        )}
        <p className="text-center text-sm text-gray-500">{t('auth.completeHint')}</p>

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

        <Field label={t('auth.birthday')}>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            required
            className="input"
          />
        </Field>

        <Field label={t('auth.phone')} hint={t('auth.phoneLocked')}>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08X-XXX-XXXX"
            required
            className="input"
          />
        </Field>

        {error && <p className="text-sm text-cake-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-cake-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-cake-700 disabled:opacity-60"
        >
          {saving ? t('common.loading') : t('auth.saveProfile')}
        </button>
      </form>
    </div>
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
