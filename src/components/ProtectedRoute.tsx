import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/context'
import LoadingScreen from './LoadingScreen'

/**
 * ปกป้องหน้าสมาชิก: ต้องล็อกอิน + กรอกโปรไฟล์ครบ
 * - ยังไม่ล็อกอิน → ไป /login
 * - ล็อกอินแล้วแต่โปรไฟล์ไม่ครบ → ไป /complete-profile
 */
export default function ProtectedRoute() {
  const { loading, session, profileComplete } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (!profileComplete) return <Navigate to="/complete-profile" replace />
  return <Outlet />
}
