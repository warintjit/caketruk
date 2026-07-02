import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import type { MemberRole } from '@/types/database'

/** แถบสลับมุมมอง (เฉพาะ super_admin จริง) — ดู frontend เสมือนแต่ละ role */
export default function RolePreview() {
  const { t } = useTranslation()
  const { realRole, previewRole, setPreviewRole } = useAuth()

  if (realRole !== 'super_admin') return null

  const options: { role: MemberRole | null; label: string }[] = [
    { role: null, label: t('preview.mine') },
    { role: 'developer', label: t('members.roleDeveloper') },
    { role: 'admin', label: t('members.roleAdmin') },
    { role: 'member', label: t('members.roleMember') },
  ]

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto bg-cake-50 px-3 py-1.5">
      <span className="shrink-0 text-[11px] font-medium text-gray-500">👁️ {t('preview.label')}:</span>
      {options.map((o) => {
        const active = previewRole === o.role
        return (
          <button
            key={o.label}
            type="button"
            onClick={() => setPreviewRole(o.role)}
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
              active ? 'bg-cake-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
