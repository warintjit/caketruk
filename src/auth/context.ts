import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Member, MemberRole } from '@/types/database'

export interface AuthState {
  session: Session | null
  /** member ที่ใช้แสดงผล (role อาจถูก override เมื่อ super_admin กำลัง preview) */
  member: Member | null
  loading: boolean
  /** กรอกโปรไฟล์ครบหรือยัง (ชื่อ/นามสกุล/วันเกิด/เบอร์) */
  profileComplete: boolean
  /** role จริงจากฐานข้อมูล (ไม่ถูก override) — ใช้ตัดสินใจว่าใครเห็นแถบ preview */
  realRole: MemberRole | null
  /** role ที่กำลังดูมุมมอง (null = ดูตามจริง) — เฉพาะ super_admin ตั้งได้ */
  previewRole: MemberRole | null
  setPreviewRole: (role: MemberRole | null) => void
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshMember: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องอยู่ภายใน <AuthProvider>')
  return ctx
}

/** โปรไฟล์ครบเมื่อกรอก 4 ช่องหลักครบ */
export function isProfileComplete(member: Member | null): boolean {
  return Boolean(
    member?.display_name && member?.last_name && member?.birthday && member?.phone,
  )
}
