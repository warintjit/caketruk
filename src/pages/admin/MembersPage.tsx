import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import { supabase } from '@/lib/supabase'
import type { Member, MemberRole } from '@/types/database'

const ROLES: MemberRole[] = ['member', 'admin', 'developer', 'super_admin']

const ROLE_LABEL: Record<MemberRole, string> = {
  super_admin: 'members.roleSuper',
  developer: 'members.roleDeveloper',
  admin: 'members.roleAdmin',
  member: 'members.roleMember',
}

const ROLE_BADGE: Record<MemberRole, string> = {
  super_admin: 'bg-cake-600 text-white',
  developer: 'bg-ink-900 text-white',
  admin: 'bg-cake-100 text-cake-700',
  member: 'bg-gray-100 text-gray-600',
}

export default function MembersPage() {
  const { t } = useTranslation()
  const { member: me, refreshMember } = useAuth()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [okId, setOkId] = useState<string | null>(null)

  const actorIsSuper = me?.role === 'super_admin'

  async function reload() {
    const { data, error: err } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: true })
    if (err) setError(err.message)
    setMembers((data as Member[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) =>
      [m.display_name, m.last_name, m.phone, m.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [members, query])

  async function changeRole(target: Member, newRole: MemberRole) {
    if (newRole === target.role) return
    setError(null)
    setOkId(null)

    if (newRole === 'super_admin') {
      const name = `${target.display_name ?? ''} ${target.last_name ?? ''}`.trim()
      if (!window.confirm(t('members.confirmSuper', { name }))) return
    }

    setBusyId(target.id)
    const { error: err } = await supabase.rpc('set_role', {
      p_member_id: target.id,
      p_role: newRole,
    })
    setBusyId(null)

    if (err) {
      setError(err.message)
      return
    }
    setOkId(target.id)
    // โอน super_admin อาจเปลี่ยน role ของเราเอง → รีเฟรชทั้งคู่
    await Promise.all([reload(), refreshMember()])
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-cake-700">{t('members.title')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{t('members.hint')}</p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('members.search')}
        className="input"
      />

      {error && <p className="text-sm text-cake-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">{t('members.loading')}</p>
      ) : (
        <>
          <p className="text-xs text-gray-400">{t('members.count', { count: members.length })}</p>

          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400">{t('members.noResult')}</p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((m) => {
                const isSelf = m.id === me?.id
                const targetIsSuper = m.role === 'super_admin'
                // แก้ตำแหน่ง super_admin ได้เฉพาะ super_admin · ห้ามแก้ตัวเอง
                const canEdit = !isSelf && (!targetIsSuper || actorIsSuper)

                return (
                  <li
                    key={m.id}
                    className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-800">
                          {m.display_name ?? ''} {m.last_name ?? ''}
                          {isSelf && (
                            <span className="ml-1 text-xs font-normal text-cake-600">
                              ({t('members.you')})
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {m.phone ?? t('members.noPhone')}
                          {m.email && <span> · {m.email}</span>}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[m.role]}`}
                      >
                        {t(ROLE_LABEL[m.role])}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-gray-500">{t('members.role')}</label>
                      <select
                        value={m.role}
                        disabled={!canEdit || busyId === m.id}
                        onChange={(e) => void changeRole(m, e.target.value as MemberRole)}
                        className="input flex-1 py-1.5 text-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        {ROLES.map((r) => (
                          <option
                            key={r}
                            value={r}
                            // ตั้ง super_admin ได้เฉพาะ actor ที่เป็น super_admin
                            disabled={r === 'super_admin' && !actorIsSuper}
                          >
                            {t(ROLE_LABEL[r])}
                          </option>
                        ))}
                      </select>
                      {okId === m.id && <span className="text-sm text-green-600">✓</span>}
                    </div>

                    {targetIsSuper && !actorIsSuper && (
                      <p className="mt-1 text-[11px] text-gray-400">
                        {t('members.roleLockedSuper')}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
