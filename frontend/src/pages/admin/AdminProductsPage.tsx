import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { adminService, type AdminProduct } from '@/services/adminService'
import { productService } from '@/services/productService'
import { formatINR } from '@/utils/format'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    adminService
      .listProducts({ limit: 100 })
      .then(({ items }) => {
        if (!cancelled) setProducts(items)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleRemove(id: string) {
    setBusyId(id)
    try {
      await productService.remove(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Products</h1>
      <p className="mb-5 text-sm text-ink-500">{products.length} listings across the marketplace (including inactive).</p>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{p.name}</td>
                  <td className="px-4 py-3 text-ink-600">{p.category.name}</td>
                  <td className="px-4 py-3 text-ink-600">{p.seller.name}</td>
                  <td className="px-4 py-3 text-ink-600">{formatINR(Number(p.price))}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.isActive ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-500'}`}>
                      {p.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(p.id)}
                      disabled={busyId === p.id}
                      aria-label="Remove product"
                      className="text-danger-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
