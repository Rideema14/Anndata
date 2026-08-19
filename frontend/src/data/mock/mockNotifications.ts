export type NotificationType = 'mandi_alert' | 'order_update' | 'seller_verification' | 'new_order' | 'ai_recommendation'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  createdAt: string
  read: boolean
}

export const mockNotifications: AppNotification[] = [
  {
    id: 'ntf_1',
    type: 'mandi_alert',
    title: 'Wheat crossed your target price',
    body: 'Katni Mandi wheat is now ₹2,340/quintal — above your alert of ₹2,300.',
    createdAt: '2026-08-16T05:30:00.000Z',
    read: false,
  },
  {
    id: 'ntf_2',
    type: 'new_order',
    title: 'New order received',
    body: 'Sunita Verma ordered 2 bags of Soybean Seeds (JS-9560).',
    createdAt: '2026-08-15T14:12:00.000Z',
    read: false,
  },
  {
    id: 'ntf_3',
    type: 'order_update',
    title: 'Your order is out for delivery',
    body: 'Order #AD48213 (NPK Fertilizer, 2 bags) will arrive today.',
    createdAt: '2026-08-15T09:05:00.000Z',
    read: true,
  },
  {
    id: 'ntf_4',
    type: 'ai_recommendation',
    title: 'Irrigation not needed today',
    body: 'Rain is expected in Katni tomorrow — you can skip today\u2019s irrigation.',
    createdAt: '2026-08-14T06:00:00.000Z',
    read: true,
  },
  {
    id: 'ntf_5',
    type: 'seller_verification',
    title: 'Seller verification approved',
    body: 'You can now list products, land and machinery on Aandata.',
    createdAt: '2026-08-10T11:20:00.000Z',
    read: true,
  },
]
