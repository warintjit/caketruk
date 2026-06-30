import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import PromotionsPage from '@/pages/PromotionsPage'
import MenuPage from '@/pages/MenuPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
