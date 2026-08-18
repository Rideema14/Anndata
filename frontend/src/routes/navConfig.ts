import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bell,
  CloudSun,
  Heart,
  Home,
  LayoutDashboard,
  LineChart,
  List,
  PackageCheck,
  PlusSquare,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  User,
  Wheat,
} from 'lucide-react'
import type { TranslationKey } from '@/context/LanguageContext'

export interface NavItem {
  path: string
  labelKey: TranslationKey
  icon: LucideIcon
}

/** Mobile bottom nav — deliberately fixed at 5 items per the SRS ("do not overcrowd"). */
export const mobileBottomNavItems: NavItem[] = [
  { path: '/', labelKey: 'nav.home', icon: Home },
  { path: '/market', labelKey: 'nav.market', icon: Store },
  { path: '/ai', labelKey: 'nav.ai', icon: Sparkles },
  { path: '/mandi', labelKey: 'nav.mandi', icon: LineChart },
  { path: '/profile', labelKey: 'nav.profile', icon: User },
]

/** Desktop sidebar — Buy mode. */
export const buyNavItems: NavItem[] = [
  { path: '/', labelKey: 'nav.home', icon: Home },
  { path: '/market', labelKey: 'nav.market', icon: Store },
  { path: '/cart', labelKey: 'nav.cart', icon: ShoppingCart },
  { path: '/wishlist', labelKey: 'nav.wishlist', icon: Heart },
  { path: '/orders', labelKey: 'nav.orders', icon: PackageCheck },
  { path: '/mandi', labelKey: 'nav.mandi', icon: LineChart },
  { path: '/weather', labelKey: 'nav.weather', icon: CloudSun },
  { path: '/ai', labelKey: 'nav.ai', icon: Sparkles },
  { path: '/seeds', labelKey: 'nav.seeds', icon: Wheat },
]

/** Desktop sidebar — Sell mode. Same account, different toolset. */
export const sellNavItems: NavItem[] = [
  { path: '/seller/dashboard', labelKey: 'nav.sellerDashboard', icon: LayoutDashboard },
  { path: '/seller/listings', labelKey: 'nav.myListings', icon: List },
  { path: '/seller/add-product', labelKey: 'nav.addProduct', icon: PlusSquare },
  { path: '/seller/orders', labelKey: 'nav.sellerOrders', icon: PackageCheck },
  { path: '/seller/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
]

/** Always visible at the foot of the sidebar, regardless of mode. */
export const utilityNavItems: NavItem[] = [
  { path: '/notifications', labelKey: 'nav.notifications', icon: Bell },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
]
