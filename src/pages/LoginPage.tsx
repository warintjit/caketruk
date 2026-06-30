import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/context'
import Logo from '@/components/Logo'
import LoadingScreen from '@/components/LoadingScreen'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function LoginPage() {
  const { t } = useTranslation()
  const { loading, session, signInWithGoogle } = useAuth()

  if (loading) return <LoadingScreen />
  if (session) return <Navigate to="/" replace />

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-ink-900 px-6 text-white">
      <div className="flex justify-end pt-4">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <Logo className="h-24 w-24" />
        <div>
          <h1 className="text-2xl font-bold tracking-wide">{t('app.name')}</h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-cake-400">
            {t('app.tagline')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-medium text-gray-700 shadow-lg transition hover:bg-gray-50"
        >
          <GoogleIcon />
          {t('auth.loginWithGoogle')}
        </button>

        <p className="text-xs text-gray-500">{t('auth.loginHint')}</p>
      </div>

      <p className="pb-4 text-center text-xs text-gray-600">{t('footer.credit')}</p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75Z"
      />
    </svg>
  )
}
