import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Footer from './Footer'
import LanguageSwitcher from './LanguageSwitcher'
import Logo from './Logo'

/** โครงหน้าหลัก (mobile-first): header แบรนด์ดำ + เนื้อหา + footer */
export default function Layout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-xl">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-ink-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          {!isHome && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={t('nav.back')}
              className="-ml-1 rounded-lg px-1.5 py-0.5 text-xl leading-none text-cake-300 transition hover:bg-white/10"
            >
              ‹
            </button>
          )}
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide text-white">
                {t('app.name')}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cake-400">
                {t('app.tagline')}
              </p>
            </div>
          </Link>
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
