import { Wheat } from 'lucide-react'
import { getProductsByCategory } from '@/data/mock/mockProductCatalog'
import { formatINR } from '@/utils/format'

export default function AdminSeedsPage() {
  const seeds = getProductsByCategory('seeds')

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Wheat className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl">Seed Management</h1>
          <p className="text-xs text-ink-500">{seeds.length} certified seed listings in the Seed Store.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-medium">Variety</th>
              <th className="px-4 py-3 font-medium">Seller</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {seeds.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-ink-900">{s.name}</td>
                <td className="px-4 py-3 text-ink-600">{s.sellerName}</td>
                <td className="px-4 py-3 text-ink-600">{s.stock}</td>
                <td className="px-4 py-3 text-ink-600">{formatINR(s.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
