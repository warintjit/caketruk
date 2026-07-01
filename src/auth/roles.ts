// ตัวช่วยเช็คสิทธิ์ฝั่ง UI — ต้องตรงกับ RLS ใน supabase/migrations/0001_init.sql
// (UI ใช้ซ่อน/แสดงเมนู แต่ความปลอดภัยจริงบังคับซ้ำที่ RLS/RPC เสมอ)
import type { Member } from '@/types/database'

/** เพิ่ม/ลดคะแนนได้ = admin, developer, super_admin */
export function canManagePoints(member: Member | null): boolean {
  return member?.role === 'admin' || member?.role === 'developer' || member?.role === 'super_admin'
}

/** จัดการทุกอย่างหลังบ้าน (สมาชิก/เนื้อหา/role) = developer, super_admin */
export function canManageAll(member: Member | null): boolean {
  return member?.role === 'developer' || member?.role === 'super_admin'
}
