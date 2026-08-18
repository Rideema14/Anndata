import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useLanguage } from '@/context/LanguageContext'

export function CartIconButton({ className }: { className?: string }) {
  const { itemCount } = useCart()
  const { t } = useLanguage()

  return (
    <Link
      to="/cart"
      aria-label={`${t('nav.cart')}${itemCount ? `, ${itemCount} items` : ''}`}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-ink-100 bg-surface text-ink-700 hover:border-brand-300 hover:text-brand-700 ${className ?? ''}`}
    >
      <ShoppingCart className="h-4.5 w-4.5" aria-hidden="true" />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  )
}
