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

/** Blocks first render on the initial session check (restoring/refreshing a
 *  stored token) so nothing ever flashes a logged-out state while that's
 *  still in flight. Everything below only mounts once we know who — if
 *  anyone — is signed in. */
function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth()
  if (isLoading) return <SplashScreen />
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

                {/* CART MUST WRAP APP ROUTER */}
                <CartProvider>

                  <WishlistProvider>
                    <OrderProvider>
                      <MandiProvider>
                        <AiProvider>
                          <SeedCartProvider>
                            <LandProvider>
                              <MachineryProvider>
                                <AdminProvider>
                                  <SellerProvider>

                                    <AppRouter />

                                  </SellerProvider>
                                </AdminProvider>
                              </MachineryProvider>
                            </LandProvider>
                          </SeedCartProvider>
                        </AiProvider>
                      </MandiProvider>
                    </OrderProvider>
                  </WishlistProvider>

                </CartProvider>

              </NotificationProvider>
            </AppModeProvider>
          </AuthGate>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}