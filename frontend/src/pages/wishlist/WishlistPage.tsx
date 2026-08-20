import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Sprout, Trash2 } from 'lucide-react'
import { useWishlist } from '@/context/WishlistContext'
import { useCart } from '@/context/CartContext'
import { useLanguage } from '@/context/LanguageContext'
import { formatINR } from '@/utils/format'

export default function WishlistPage() {
  const { products, isLoading, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const { t } = useLanguage()

  if (isLoading && products.length === 0) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-400">{t('common.loading')}</div>
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <Heart className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
        <h1 className="text-lg">{t('nav.wishlist')} is empty</h1>
        <p className="mt-1 text-sm text-ink-500">Tap the heart on any product to save it here.</p>
        <Link to="/market" className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          {t('nav.market')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">{t('nav.wishlist')} ({products.length})</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((product) => (
          <div key={product.id} className="flex gap-3 rounded-2xl border border-ink-100 bg-surface p-3">
            <Link
              to={`/product/${product.slug ?? product.id}`}
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-sunk"
            >
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <Sprout className="h-6 w-6 text-brand-400" aria-hidden="true" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/product/${product.slug ?? product.id}`} className="line-clamp-2 text-sm font-medium text-ink-900">
                {product.name}
              </Link>
              <p className="mt-0.5 text-sm font-bold text-ink-900">{formatINR(product.price)}</p>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(product.id)
                    removeFromWishlist(product.id)
                  }}
                  disabled={product.stock === 0}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline disabled:text-ink-300"
                >
                  <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                  Move to cart
                </button>
                <button
                  type="button"
                  onClick={() => removeFromWishlist(product.id)}
                  className="flex items-center gap-1 text-xs font-medium text-danger-500 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
