import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'

import { Logo } from '@/components/common/Logo'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { PageLoader } from '@/components/common/PageLoader'


export function AuthLayout() {


  return (
    <div className="min-h-svh w-full bg-[#F5F6F0] text-[#28301F]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        className="
          flex
          h-16
          w-full
          items-center
          justify-between
          px-5
          sm:px-8
          lg:px-10
        "
      >
        <Link
          to="/"
          className="shrink-0"
          aria-label="home"
        >
          <Logo />
        </Link>

        <LanguageSwitcher />
      </header>

      {/* =====================================================
          AUTH CONTENT
          
          IMPORTANT:
          No max-w-sm
          No items-center
          No artificial card container
      ===================================================== */}

      <main className="w-full">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}
    </div>
  )
}