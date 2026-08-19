import type { LucideIcon } from 'lucide-react'
import type { Product } from '@/types'
import { ProductCard } from '@/components/common/ProductCard'

interface ProductRailProps {
  title: string
  icon: LucideIcon
  products: Product[]
  accentClass?: string
}

export function ProductRail({ title, icon: Icon, products, accentClass = 'text-brand-600' }: ProductRailProps) {
  if (products.length === 0) return null

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${accentClass}`} aria-hidden="true" />
        <h2 className="text-sm font-semibold text-ink-800">{title}</h2>
      </div>
      <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
        {products.map((product) => (
          <div key={product.id} className="w-36 shrink-0 sm:w-40">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
