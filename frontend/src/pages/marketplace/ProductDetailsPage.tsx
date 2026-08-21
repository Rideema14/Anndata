import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, PackageX } from 'lucide-react'
import { ProductCard } from '@/components/common/ProductCard'
import { categoryService, type Category } from '@/services/categoryService'
import { productService } from '@/services/productService'
import type { Product } from '@/types'
import { useLanguage } from '@/context/LanguageContext'

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const { t } = useLanguage()
  const [meta, setMeta] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!category) return
    let cancelled = false
    setIsLoading(true)
    Promise.all([
      categoryService.getBySlug(category).catch(() => null),
      productService.list({ category, limit: 48 }).catch(() => ({ items: [], meta: { page: 1, limit: 48, totalItems: 0, totalPages: 0 } })),
    ]).then(([categoryResult, productResult]) => {
      if (cancelled) return
      setMeta(categoryResult)
      setProducts(productResult.items)
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [category])

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
      <Link to="/market" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All categories
      </Link>

      <div className="mb-5 flex items-center gap-3">
        {meta && (
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${meta.colorClass}`}>
            <meta.icon className="h-5.5 w-5.5" strokeWidth={1.6} aria-hidden="true" />
          </span>
        )}
        <div>
          <h1 className="text-xl">{meta?.name ?? category}</h1>
          <p className="text-xs text-ink-400">{isLoading ? t('common.loading') : `${products.length} products`}</p>
        </div>
      </div>

      {!isLoading && products.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <PackageX className="mb-3 h-10 w-10 text-ink-300" aria-hidden="true" />
          <p className="text-sm text-ink-500">No products in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}