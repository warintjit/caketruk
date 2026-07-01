import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/context'
import { canManagePoints } from '@/auth/roles'
import LoadingScreen from './LoadingScreen'

/**
 * ปกป้องหน้าหลังบ้าน: ต้องมีสิทธิ์จัดการคะแนน (admin/developer/super_admin)
 * ต่อยอดจาก ProtectedRoute (ล็อกอิน+โปรไฟล์ครบมาแล้ว) — ที่นี่เช็คเฉพาะ role
 * หมายเหตุ: นี่แค่ซ่อน UI — ความปลอดภัยจริงบังคับที่ RLS/RPC ในฐานข้อมูล
 */
export default function AdminRoute() {
  const { loading, member } = useAuth()

  if (loading) return <LoadingScreen />
  if (!canManagePoints(member)) return <Navigate to="/" replace />
  return <Outlet />
}
