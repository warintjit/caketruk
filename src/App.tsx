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
import EditProfilePage from '@/pages/EditProfilePage'
import CouponsPage from '@/pages/CouponsPage'
import PackagesPage from '@/pages/PackagesPage'
import ManagePointsPage from '@/pages/admin/ManagePointsPage'
import MembersPage from '@/pages/admin/MembersPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import PromotionsAdminPage from '@/pages/admin/PromotionsAdminPage'
import MenuAdminPage from '@/pages/admin/MenuAdminPage'
import CouponsAdminPage from '@/pages/admin/CouponsAdminPage'
import PackagesAdminPage from '@/pages/admin/PackagesAdminPage'
import HomeTilesAdminPage from '@/pages/admin/HomeTilesAdminPage'

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
              <Route path="coupons" element={<CouponsPage />} />
              <Route path="packages" element={<PackagesPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="profile/edit" element={<EditProfilePage />} />

              {/* หลังบ้าน — เฉพาะ admin/developer/super_admin */}
              <Route element={<AdminRoute />}>
                <Route path="admin/points" element={<ManagePointsPage />} />
              </Route>

              {/* จัดการระดับสูง — เฉพาะ developer/super_admin */}
              <Route element={<ManagerRoute />}>
                <Route path="admin/members" element={<MembersPage />} />
                <Route path="admin/settings" element={<SettingsPage />} />
                <Route path="admin/home-tiles" element={<HomeTilesAdminPage />} />
                <Route path="admin/promotions" element={<PromotionsAdminPage />} />
                <Route path="admin/menu" element={<MenuAdminPage />} />
                <Route path="admin/coupons" element={<CouponsAdminPage />} />
                <Route path="admin/packages" element={<PackagesAdminPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
