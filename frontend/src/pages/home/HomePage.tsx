import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  ChevronRight,
  CloudSun,
  Droplets,
  FlaskConical,
  ScanEye,
  Sparkles,
  Sprout,
  Star,
  Truck,
} from 'lucide-react'
import { QuickActionTile } from '@/components/common/QuickActionTile'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { mockCategories } from '@/data/mock/mockCategories'
import { mockMandiSnapshot } from '@/data/mock/mockMandi'
import { mockWeatherSnapshot } from '@/data/mock/mockWeather'
import { mockRecommendedProducts } from '@/data/mock/mockProducts'
import { mockRecentOrders } from '@/data/mock/mockOrders'
import { formatINR, formatPercentChange } from '@/utils/format'
import { cn } from '@/utils/cn'

function useGreetingKey(): 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening' {
  const hour = new Date().getHours()
  if (hour < 12) return 'home.greetingMorning'
  if (hour < 17) return 'home.greetingAfternoon'
  return 'home.greetingEvening'
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  placed: 'bg-ink-100 text-ink-600',
  confirmed: 'bg-sky-50 text-sky-700',
  packed: 'bg-gold-50 text-gold-700',
  shipped: 'bg-brand-50 text-brand-700',
  delivered: 'bg-brand-100 text-brand-800',
}

export default function HomePage() {
  const { user, isSeller } = useAuth()
  const { t } = useLanguage()
  const greetingKey = useGreetingKey()
  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
      {/* Greeting */}
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl">
          {t(greetingKey)}{firstName ? `, ${firstName}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-500">{t('home.subGreeting')}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-5 md:col-span-2">
          {/* Weather + Mandi snapshot */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/weather"
              className="flex items-center justify-between rounded-2xl bg-sky-500 p-4 text-white shadow-card transition-transform hover:-translate-y-0.5"
            >
              <div>
                <p className="text-xs font-medium text-sky-50/90">{t('home.weatherToday')}</p>
                <p className="mt-1 text-2xl font-bold">{mockWeatherSnapshot.tempC}°C</p>
                <p className="text-xs text-sky-50/90">{mockWeatherSnapshot.condition} · {mockWeatherSnapshot.location.split(',')[0]}</p>
              </div>
              <CloudSun className="h-10 w-10 text-sky-50/90" strokeWidth={1.5} aria-hidden="true" />
            </Link>

            <Link
              to="/mandi"
              className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface p-4 shadow-card transition-transform hover:-translate-y-0.5"
            >
              <div>
                <p className="text-xs font-medium text-ink-500">{mockMandiSnapshot[0].crop} · {mockMandiSnapshot[0].mandi}</p>
                <p className="mt-1 text-2xl font-bold text-ink-900">{formatINR(mockMandiSnapshot[0].pricePerQuintal)}</p>
                <p
                  className={cn(
                    'text-xs font-semibold',
                    mockMandiSnapshot[0].changePercent >= 0 ? 'text-brand-600' : 'text-danger-500',
                  )}
                >
                  {formatPercentChange(mockMandiSnapshot[0].changePercent)} today
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-brand-500" aria-hidden="true" />
            </Link>
          </div>

          {/* Quick Actions */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base">{t('home.quickActions')}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              <QuickActionTile to="/ai/disease" label={t('home.diseaseCheck')} icon={ScanEye} colorClass="bg-danger-50 text-danger-500" />
              <QuickActionTile to="/ai/crop-advisor" label={t('home.cropAdvisor')} icon={Sprout} colorClass="bg-brand-50 text-brand-700" />
              <QuickActionTile to="/ai/soil" label={t('home.soilAnalysis')} icon={FlaskConical} colorClass="bg-soil-50 text-soil-700" />
              <QuickActionTile to="/ai/irrigation" label={t('home.irrigationAdvice')} icon={Droplets} colorClass="bg-sky-50 text-sky-700" />
              <QuickActionTile to="/ai/chat" label={t('home.askAI')} icon={Sparkles} colorClass="bg-gold-50 text-gold-700" />
            </div>
          </section>

          {/* Categories */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base">{t('home.categories')}</h2>
              <Link to="/market" className="flex items-center text-xs font-semibold text-brand-600 hover:underline">
                {t('common.viewAll')}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
              {mockCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/market/${cat.slug}`}
                  className="flex w-20 shrink-0 flex-col items-center gap-2 text-center"
                >
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cat.colorClass}`}>
                    <cat.icon className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-medium leading-tight text-ink-600">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Recommended products */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base">{t('home.recommended')}</h2>
              <Link to="/market" className="flex items-center text-xs font-semibold text-brand-600 hover:underline">
                {t('common.viewAll')}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {mockRecommendedProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="rounded-2xl border border-ink-100 bg-surface p-3 transition-transform hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="mb-2 flex h-20 items-center justify-center rounded-xl bg-surface-sunk">
                    <Sprout className="h-7 w-7 text-brand-400" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <p className="line-clamp-2 text-xs font-medium leading-snug text-ink-900">{product.name}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-500">
                    <Star className="h-3 w-3 fill-gold-400 text-gold-400" aria-hidden="true" />
                    {product.rating} · {product.location}
                  </div>
                  <p className="mt-1 text-sm font-bold text-ink-900">
                    {formatINR(product.price)}
                    <span className="ml-1 text-[11px] font-normal text-ink-400">/ {product.unit}</span>
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          {/* Recent orders */}
          <section className="rounded-2xl border border-ink-100 bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base">{t('home.recentOrders')}</h2>
              <Link to="/orders" className="text-xs font-semibold text-brand-600 hover:underline">
                {t('common.viewAll')}
              </Link>
            </div>
            <ul className="space-y-3">
              {mockRecentOrders.map((order) => (
                <li key={order.id}>
                  <Link to={`/orders/${order.id}`} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-brand-600">
                      <Truck className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-ink-900">{order.itemsLabel}</span>
                      <span className="mt-1 flex items-center gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', ORDER_STATUS_STYLES[order.status])}>
                          {order.status}
                        </span>
                        <span className="text-[11px] font-semibold text-ink-700">{formatINR(order.total)}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Mandi teaser list */}
          <section className="rounded-2xl border border-ink-100 bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base">{t('home.mandiPrices')}</h2>
              <Link to="/mandi" className="text-xs font-semibold text-brand-600 hover:underline">
                {t('common.viewAll')}
              </Link>
            </div>
            <ul className="divide-y divide-ink-100">
              {mockMandiSnapshot.map((row) => (
                <li key={row.crop} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-ink-900">{row.crop}</p>
                    <p className="text-[11px] text-ink-400">{row.mandi}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink-900">{formatINR(row.pricePerQuintal)}</p>
                    <p className={cn('text-[11px] font-semibold', row.changePercent >= 0 ? 'text-brand-600' : 'text-danger-500')}>
                      {formatPercentChange(row.changePercent)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Seller shortcut */}
          {!isSeller && (
            <Link
              to="/seller/onboarding"
              className="block rounded-2xl bg-brand-700 p-4 text-white transition-transform hover:-translate-y-0.5"
            >
              <p className="text-sm font-semibold">{t('home.sellerShortcut')}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-brand-100">
                {t('home.sellerShortcutCta')}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
