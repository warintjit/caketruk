import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Footer from './Footer'
import LanguageSwitcher from './LanguageSwitcher'
import Logo from './Logo'

/** โครงหน้าหลัก (mobile-first): header แบรนด์ดำ + เนื้อหา + footer */
export default function Layout() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-xl">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-ink-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide text-white">
              {t('app.name')}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-cake-400">
              {t('app.tagline')}
            </p>
          </div>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="flex-1 px-4 py-5">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
