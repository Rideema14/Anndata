import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/context/WishlistContext'
import { useLanguage } from '@/context/LanguageContext'

export function WishlistIconButton({ className }: { className?: string }) {
  const wishlist = useWishlist() as any
  const itemCount =
    typeof wishlist?.itemCount === 'number'
      ? wishlist.itemCount
      : Array.isArray(wishlist?.items)
        ? wishlist.items.length
        : Array.isArray(wishlist?.wishlist)
          ? wishlist.wishlist.length
          : 0
  const { t } = useLanguage()

  return (
    <Link
      to="/wishlist"
      aria-label={`${t('nav.wishlist')}${itemCount ? `, ${itemCount} items` : ''}`}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-ink-100 bg-surface text-ink-700 hover:border-brand-300 hover:text-brand-700 ${className ?? ''}`}
    >
      <Heart className="h-4.5 w-4.5" aria-hidden="true" />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  )
}
