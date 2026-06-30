import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Member } from '@/types/database'

export interface AuthState {
  session: Session | null
  member: Member | null
  loading: boolean
  /** กรอกโปรไฟล์ครบหรือยัง (ชื่อ/นามสกุล/วันเกิด/เบอร์) */
  profileComplete: boolean
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
