import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bell,
  MessageSquareText,
  CloudSun,
  Home,
  LayoutDashboard,
  LineChart,
  List,
  MapPin,
  PackageCheck,
  PlusSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tags,
  Tractor,
  Truck,
  Users,
  Wheat,
  Wallet,
} from 'lucide-react'
import type { TranslationKey } from '@/context/LanguageContext'

export interface NavItem {
  path: string
  labelKey: TranslationKey
  icon: LucideIcon
}

/** Desktop sidebar — Buy mode. */
export const buyNavItems: NavItem[] = [
  { path: '/home', labelKey: 'nav.home', icon: Home },
  { path: '/market', labelKey: 'nav.market', icon: Store },
  { path: '/land', labelKey: 'nav.land', icon: MapPin },
  { path: '/orders', labelKey: 'nav.orders', icon: PackageCheck },
  { path: '/mandi', labelKey: 'nav.mandi', icon: LineChart },
  { path: '/machinery', labelKey: 'nav.machinery', icon: Tractor },
  { path: '/weather', labelKey: 'nav.weather', icon: CloudSun },
  { path: '/ai', labelKey: 'nav.ai', icon: Sparkles },
  { path: '/seeds', labelKey: 'nav.seeds', icon: Wheat },
]

/** Desktop sidebar — Sell mode. Same account, different toolset. */
export const sellNavItems: NavItem[] = [
  { path: '/seller/dashboard', labelKey: 'nav.sellerDashboard', icon: LayoutDashboard },
  { path: '/seller/listings', labelKey: 'nav.myListings', icon: List },
  { path: '/seller/add-product', labelKey: 'nav.addProduct', icon: PlusSquare },
  { path: '/seller/land', labelKey: 'nav.land', icon: MapPin },
  { path: '/seller/machinery', labelKey: 'nav.machinery', icon: Tractor },
  { path: '/seller/orders', labelKey: 'nav.sellerOrders', icon: PackageCheck },
  { path: '/seller/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
  { path: '/mandi', labelKey: 'nav.mandi', icon: LineChart },
]

/** Seller-only utility link, kept above notifications in the sidebar. */
export const sellerUtilityNavItems: NavItem[] = [
  { path: '/seller/feedback', labelKey: 'nav.sellerFeedback', icon: MessageSquareText },
]

/** Desktop sidebar — Admin mode. Shown instead of buy/sell nav for admin accounts. */
export const adminNavItems: NavItem[] = [
  { path: '/admin', labelKey: 'nav.adminDashboard', icon: LayoutDashboard },
  { path: '/admin/users', labelKey: 'nav.adminUsers', icon: Users },
  { path: '/admin/sellers', labelKey: 'nav.adminSellers', icon: ShieldCheck },
  { path: '/admin/products', labelKey: 'nav.adminProducts', icon: Store },
  { path: '/admin/categories', labelKey: 'nav.adminCategories', icon: Tags },
  { path: '/admin/reviews', labelKey: 'nav.adminReviews', icon: Star },
  { path: '/admin/seeds', labelKey: 'nav.adminSeeds', icon: Wheat },
  { path: '/admin/analytics', labelKey: 'nav.adminAnalytics', icon: BarChart3 },
  { path: '/admin/payouts', labelKey: 'nav.adminPayouts', icon: Wallet },
  { path: '/admin/shipments', labelKey: 'nav.adminShipments', icon: Truck },
]

/** Always visible at the foot of the sidebar, regardless of mode. */
export const utilityNavItems: NavItem[] = [
  { path: '/notifications', labelKey: 'nav.notifications', icon: Bell },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
]
