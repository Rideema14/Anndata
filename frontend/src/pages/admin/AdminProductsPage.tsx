import { Trash2 } from 'lucide-react'
import { useAdmin, useVisibleAdminProducts } from '@/context/AdminContext'
import { formatINR } from '@/utils/format'

export default function AdminProductsPage() {
  const products = useVisibleAdminProducts()
  const { removeProduct } = useAdmin()

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Products</h1>
      <p className="mb-5 text-sm text-ink-500">{products.length} live listings across the marketplace.</p>

      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Seller</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-ink-900">{p.name}</td>
                <td className="px-4 py-3 capitalize text-ink-600">{p.categorySlug.replace('-', ' ')}</td>
                <td className="px-4 py-3 text-ink-600">{p.sellerName}</td>
                <td className="px-4 py-3 text-ink-600">{formatINR(p.price)}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => removeProduct(p.id)} aria-label="Remove product" className="text-danger-500">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
