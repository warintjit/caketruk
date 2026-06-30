import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Member } from '@/types/database'
import { AuthContext, isProfileComplete, type AuthState } from './context'

/** หา member จาก auth_id — ถ้ายังไม่มีให้สร้างแถวใหม่ (ครั้งแรกที่ล็อกอิน) */
async function loadOrCreateMember(session: Session): Promise<Member | null> {
  const userId = session.user.id

  const { data: existing, error } = await supabase
    .from('members')
    .select('*')
    .eq('auth_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[auth] โหลด member ไม่สำเร็จ:', error.message)
    return null
  }
  if (existing) return existing as Member

  // ครั้งแรก: สร้าง member โดยดึงชื่อ+รูปจากผู้ให้บริการมาเติมให้อัตโนมัติ
  const meta = session.user.user_metadata ?? {}
  const provider = session.user.app_metadata?.provider ?? null
  const { data: created, error: insertError } = await supabase
    .from('members')
    .insert({
      auth_id: userId,
      email: session.user.email ?? null,
      provider,
      display_name: meta.full_name ?? meta.name ?? null,
      photo_url: meta.avatar_url ?? meta.picture ?? null,
    })
    .select('*')
    .single()

  if (insertError) {
    // 23505 = unique violation: มีแถวถูกสร้างพร้อมกัน (race) → ดึงแถวที่มีอยู่แทน
    if (insertError.code === '23505') {
      const { data: row } = await supabase
        .from('members')
        .select('*')
        .eq('auth_id', userId)
        .maybeSingle()
      return (row as Member) ?? null
    }
    console.error('[auth] สร้าง member ไม่สำเร็จ:', insertError.message)
    return null
  }
  return created as Member
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)
  const syncingFor = useRef<string | null>(null)

  const syncMember = useCallback(async (s: Session | null) => {
    if (!s) {
      setMember(null)
      return
    }
    // กันเรียกซ้ำพร้อมกันสำหรับ user เดียวกัน (เลี่ยง race สร้าง member ซ้ำ)
    if (syncingFor.current === s.user.id) return
    syncingFor.current = s.user.id
    try {
      setMember(await loadOrCreateMember(s))
    } finally {
      syncingFor.current = null
    }
  }, [])

  useEffect(() => {
    // โหลด session ปัจจุบันตอนเปิดแอป
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await syncMember(data.session)
      setLoading(false)
      initialized.current = true
    })

    // ติดตามการเปลี่ยนสถานะล็อกอิน
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      // ข้ามรอบแรก (getSession จัดการแล้ว) กันโหลดซ้ำ
      if (initialized.current) void syncMember(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [syncMember])

  const refreshMember = useCallback(async () => {
    await syncMember(session)
  }, [session, syncMember])

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setMember(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      member,
      loading,
      profileComplete: isProfileComplete(member),
      signInWithGoogle,
      signOut,
      refreshMember,
    }),
    [session, member, loading, signInWithGoogle, signOut, refreshMember],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
