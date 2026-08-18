import { getProductsByCategory } from '@/data/mock/mockProductCatalog'
import { mockCategories } from '@/data/mock/mockCategories'

export default function AdminCategoriesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Categories</h1>
      <p className="mb-5 text-sm text-ink-500">Marketplace categories and how many products are listed under each.</p>

      <div className="space-y-2">
        {mockCategories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.colorClass}`}>
                <cat.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-ink-900">{cat.name}</p>
            </div>
            <span className="text-xs text-ink-400">{getProductsByCategory(cat.slug).length} products</span>
          </div>
        ))}
      </div>
    </div>
  )
}
