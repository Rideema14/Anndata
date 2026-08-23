import { useEffect, useState } from 'react'
import { categoryService, type Category } from '@/services/categoryService'
import { productService } from '@/services/productService'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    categoryService
      .list()
      .then(async (cats) => {
        if (cancelled) return
        setCategories(cats)
        // One lightweight count query per category (limit: 1 — we only need meta.totalItems).
        const entries = await Promise.all(
          cats.map(async (cat) => {
            const { meta } = await productService.list({ category: cat.slug, limit: 1 })
            return [cat.slug, meta.totalItems] as const
          }),
        )
        if (!cancelled) setCounts(Object.fromEntries(entries))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Categories</h1>
      <p className="mb-5 text-sm text-ink-500">Marketplace categories and how many products are listed under each.</p>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.colorClass}`}>
                  <cat.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-ink-900">{cat.name}</p>
              </div>
              <span className="text-xs text-ink-400">{counts[cat.slug] ?? 0} products</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
