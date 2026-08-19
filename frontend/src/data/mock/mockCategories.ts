import type { LucideIcon } from 'lucide-react'
import { Beaker, Droplet, Milk, Tractor, Warehouse, Wheat, Wrench } from 'lucide-react'

export interface Category {
  id: string
  slug: string
  name: string
  icon: LucideIcon
  colorClass: string
}

export const mockCategories: Category[] = [
  { id: 'cat_seeds', slug: 'seeds', name: 'Seeds', icon: Wheat, colorClass: 'bg-brand-50 text-brand-700' },
  { id: 'cat_fertilizers', slug: 'fertilizers', name: 'Fertilizers', icon: Beaker, colorClass: 'bg-gold-50 text-gold-700' },
  { id: 'cat_equipment', slug: 'equipment', name: 'Farming Equipment', icon: Wrench, colorClass: 'bg-sky-50 text-sky-700' },
  { id: 'cat_machinery', slug: 'machinery', name: 'Machinery', icon: Tractor, colorClass: 'bg-soil-50 text-soil-700' },
  { id: 'cat_building', slug: 'building-materials', name: 'Building Materials', icon: Warehouse, colorClass: 'bg-ink-100 text-ink-700' },
  { id: 'cat_oil', slug: 'oil-products', name: 'Oil Products', icon: Droplet, colorClass: 'bg-gold-50 text-gold-700' },
  { id: 'cat_dairy', slug: 'dairy', name: 'Milk / Dairy', icon: Milk, colorClass: 'bg-brand-50 text-brand-700' },
]
