import { api } from './api'

export type NotificationType = 'ORDER_STATUS' | 'PAYMENT' | 'SELLER_VERIFICATION' | 'REVIEW' | 'PRICE_ALERT' | 'GENERAL'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  createdAt: string
  read: boolean
}

interface BackendNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedEntityType?: string | null
  relatedEntityId?: string | null
}

interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

function mapNotification(n: BackendNotification): AppNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.message,
    createdAt: n.createdAt,
    read: n.isRead,
  }
}

export const notificationService = {
  async list(query: { page?: number; limit?: number; unreadOnly?: boolean } = {}): Promise<{ items: AppNotification[]; meta: PaginationMeta }> {
    const res = await api.get<{ data: BackendNotification[]; meta: { pagination: PaginationMeta } }>('/notifications', {
      params: query,
    })
    return { items: res.data.data.map(mapNotification), meta: res.data.meta.pagination }
  },

  async unreadCount(): Promise<number> {
    const res = await api.get<{ data: { unreadCount: number } }>('/notifications/unread-count')
    return res.data.data.unreadCount
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`)
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all')
  },
}
