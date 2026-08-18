import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { PageLoader } from '@/components/common/PageLoader'
import { useLanguage } from '@/context/LanguageContext'

export function AuthLayout() {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-svh flex-col bg-bg">
      <header className="flex items-center justify-between px-5 py-4">
        <Link to="/">
          <Logo />
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-10">
        <div className="w-full max-w-sm">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <p className="pb-6 text-center text-xs text-ink-400">{t('app.tagline')}</p>
    </div>
  )
}
