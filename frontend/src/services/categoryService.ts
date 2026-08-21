import { Beaker, Droplet, Milk, Package, Tractor, Warehouse, Wheat, Wrench, type LucideIcon } from 'lucide-react'
import { api } from './api'

export interface BackendSubCategory {
  id: string
  name: string
  slug: string
  description?: string | null
}

export interface BackendCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  subCategories: BackendSubCategory[]
}

export interface Category {
  id: string
  slug: string
  name: string
  icon: LucideIcon
  colorClass: string
  imageUrl?: string
  subCategories: BackendSubCategory[]
}

/**
 * The backend has no concept of an icon/color for a category (that's a pure
 * UI decision), so we keep a small local style lookup keyed by slug and fall
 * back to a generic package icon for any category created after this map was
 * written — new admin-created categories still render correctly, just with a
 * neutral icon until someone adds a bespoke mapping here.
 */
const STYLE_BY_SLUG: Record<string, { icon: LucideIcon; colorClass: string }> = {
  seeds: { icon: Wheat, colorClass: 'bg-brand-50 text-brand-700' },
  fertilizers: { icon: Beaker, colorClass: 'bg-gold-50 text-gold-700' },
  equipment: { icon: Wrench, colorClass: 'bg-sky-50 text-sky-700' },
  machinery: { icon: Tractor, colorClass: 'bg-soil-50 text-soil-700' },
  'building-materials': { icon: Warehouse, colorClass: 'bg-ink-100 text-ink-700' },
  'oil-products': { icon: Droplet, colorClass: 'bg-gold-50 text-gold-700' },
  dairy: { icon: Milk, colorClass: 'bg-brand-50 text-brand-700' },
}
const DEFAULT_STYLE = { icon: Package, colorClass: 'bg-ink-100 text-ink-700' }

function mapCategory(c: BackendCategory): Category {
  const style = STYLE_BY_SLUG[c.slug] ?? DEFAULT_STYLE
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: style.icon,
    colorClass: style.colorClass,
    imageUrl: c.imageUrl ?? undefined,
    subCategories: c.subCategories,
  }
}

export const categoryService = {
  async list(): Promise<Category[]> {
    const res = await api.get<{ data: BackendCategory[] }>('/categories')
    return res.data.data.map(mapCategory)
  },

  async getBySlug(slug: string): Promise<Category> {
    const res = await api.get<{ data: BackendCategory }>(`/categories/${slug}`)
    return mapCategory(res.data.data)
  },
}