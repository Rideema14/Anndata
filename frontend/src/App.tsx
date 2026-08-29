
import type { ReactNode } from 'react'

import { LanguageProvider } from '@/context/LanguageContext'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppModeProvider } from '@/context/AppModeContext'
import { ToastProvider } from '@/context/ToastContext'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import { OrderProvider } from '@/context/OrderContext'
import { MandiProvider } from '@/context/MandiContext'
import { AiProvider } from '@/context/AiContext'
import { SeedCartProvider } from '@/context/SeedCartContext'
import { LandProvider } from '@/context/LandContext'
import { MachineryProvider } from '@/context/MachineryContext'
import { AdminProvider } from '@/context/AdminContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { SellerProvider } from '@/context/SellerContext'

import { SplashScreen } from '@/components/common/SplashScreen'
import { AppRouter } from '@/routes/AppRouter'

/**
 * Blocks the application from rendering until the
 * initial authentication/session check is complete.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <SplashScreen />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthGate>
            <AppModeProvider>
              <NotificationProvider>

                {/* =====================================================
                    AI PROVIDER
                    Must wrap AppRouter because AI pages use useAi()
                ===================================================== */}
                <AiProvider>

                  {/* =================================================
                      CART
                  ================================================= */}
                  <CartProvider>

                    {/* =================================================
                        WISHLIST
                    ================================================= */}
                    <WishlistProvider>

                      {/* =================================================
                          ORDERS
                      ================================================= */}
                      <OrderProvider>

                        {/* =================================================
                            MANDI
                        ================================================= */}
                        <MandiProvider>

                          {/* =================================================
                              SEED CART
                          ================================================= */}
                          <SeedCartProvider>

                            {/* =================================================
                                LAND
                            ================================================= */}
                            <LandProvider>

                              {/* =================================================
                                  MACHINERY
                              ================================================= */}
                              <MachineryProvider>

                                {/* =================================================
                                    ADMIN
                                ================================================= */}
                                <AdminProvider>

                                  {/* =================================================
                                      SELLER
                                  ================================================= */}
                                  <SellerProvider>

                                    {/* =================================================
                                        ROUTER
                                        All pages are now inside every provider
                                    ================================================= */}
                                    <AppRouter />

                                  </SellerProvider>

                                </AdminProvider>

                              </MachineryProvider>

                            </LandProvider>

                          </SeedCartProvider>

                        </MandiProvider>

                      </OrderProvider>

                    </WishlistProvider>

                  </CartProvider>

                </AiProvider>

              </NotificationProvider>
            </AppModeProvider>
          </AuthGate>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}

