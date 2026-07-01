import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/context'
import { canManageAll } from '@/auth/roles'
import LoadingScreen from './LoadingScreen'

/**
 * ปกป้องหน้าจัดการระดับสูง: เฉพาะ developer/super_admin
 * (จัดการสมาชิก/role/เนื้อหา) — admin ธรรมดาเข้าไม่ได้
 * หมายเหตุ: นี่แค่ซ่อน UI — ความปลอดภัยจริงบังคับที่ RLS/RPC ในฐานข้อมูล
 */
export default function ManagerRoute() {
  const { loading, member } = useAuth()

  if (loading) return <LoadingScreen />
  if (!canManageAll(member)) return <Navigate to="/" replace />
  return <Outlet />
}
