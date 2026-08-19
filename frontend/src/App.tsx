import { LanguageProvider } from '@/context/LanguageContext'
import { AuthProvider } from '@/context/AuthContext'
import { AppModeProvider } from '@/context/AppModeContext'
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

import { AppRouter } from '@/routes/AppRouter'

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
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
      </AuthProvider>
    </LanguageProvider>
  )
}