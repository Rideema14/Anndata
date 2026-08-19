import type { OrderSummary } from '@/types'

export const mockRecentOrders: OrderSummary[] = [
  {
    id: 'AD48213',
    itemsLabel: 'NPK Fertilizer × 2 bags',
    total: 2360,
    status: 'shipped',
    placedAt: '2026-08-13T09:00:00.000Z',
  },
  {
    id: 'AD47950',
    itemsLabel: 'Wheat Seeds (HD-3086) × 1 bag',
    total: 1650,
    status: 'delivered',
    placedAt: '2026-08-05T09:00:00.000Z',
  },
]
