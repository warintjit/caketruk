import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminRoute from '@/components/AdminRoute'
import ManagerRoute from '@/components/ManagerRoute'
import Layout from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import CompleteProfilePage from '@/pages/CompleteProfilePage'
import HomePage from '@/pages/HomePage'
import PromotionsPage from '@/pages/PromotionsPage'
import MenuPage from '@/pages/MenuPage'
import HistoryPage from '@/pages/HistoryPage'
import ManagePointsPage from '@/pages/admin/ManagePointsPage'
import MembersPage from '@/pages/admin/MembersPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* สาธารณะ */}
          <Route path="/login" element={<LoginPage />} />
          {/* ต้องล็อกอิน แต่ยังกรอกโปรไฟล์ไม่ครบได้ */}
          <Route path="/complete-profile" element={<CompleteProfilePage />} />

          {/* ต้องล็อกอิน + โปรไฟล์ครบ */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="promotions" element={<PromotionsPage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="history" element={<HistoryPage />} />

              {/* หลังบ้าน — เฉพาะ admin/developer/super_admin */}
              <Route element={<AdminRoute />}>
                <Route path="admin/points" element={<ManagePointsPage />} />
              </Route>

              {/* จัดการระดับสูง — เฉพาะ developer/super_admin */}
              <Route element={<ManagerRoute />}>
                <Route path="admin/members" element={<MembersPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
