export interface AdminUserRow {
  id: string
  name: string
  phone: string
  location: string
  roles: string[]
  joinedAt: string
}

export const mockAdminUsers: AdminUserRow[] = [
  { id: 'usr_rajesh', name: 'Rajesh Kumar', phone: '+91 98765 43210', location: 'Katni', roles: ['buyer', 'seller'], joinedAt: '2025-02-11T00:00:00.000Z' },
  { id: 'usr_sunita', name: 'Sunita Verma', phone: '+91 91234 56780', location: 'Indore', roles: ['buyer'], joinedAt: '2025-05-03T00:00:00.000Z' },
  { id: 'usr_gurpreet', name: 'Gurpreet Singh', phone: '+91 90000 11223', location: 'Bhopal', roles: ['buyer', 'seller'], joinedAt: '2025-07-22T00:00:00.000Z' },
  { id: 'usr_manoj', name: 'Manoj Patel', phone: '+91 98111 22334', location: 'Rewa', roles: ['buyer'], joinedAt: '2025-09-14T00:00:00.000Z' },
  { id: 'usr_kavita', name: 'Kavita Sharma', phone: '+91 97222 33445', location: 'Seoni', roles: ['buyer', 'seller'], joinedAt: '2025-11-02T00:00:00.000Z' },
]

export interface SellerApplication {
  id: string
  name: string
  businessName: string
  location: string
  primaryCrop: string
  submittedAt: string
  status: 'pending' | 'verified' | 'rejected'
}

export const initialSellerApplications: SellerApplication[] = [
  { id: 'app_1', name: 'Gurpreet Singh', businessName: 'Singh Farms', location: 'Bhopal', primaryCrop: 'Wheat', submittedAt: '2026-08-10T00:00:00.000Z', status: 'pending' },
  { id: 'app_2', name: 'Kavita Sharma', businessName: 'Sharma Agro Traders', location: 'Seoni', primaryCrop: 'Soybean', submittedAt: '2026-08-14T00:00:00.000Z', status: 'pending' },
  { id: 'app_3', name: 'Rajesh Kumar', businessName: 'Rajesh Kumar Farms', location: 'Katni', primaryCrop: 'Soybean', submittedAt: '2026-06-01T00:00:00.000Z', status: 'verified' },
]

export const platformStats = {
  totalUsers: 12480,
  totalSellers: 1840,
  totalOrders: 38210,
  gmv: 48200000,
  monthlyGmv: [
    { month: 'Mar', gmv: 5200000 },
    { month: 'Apr', gmv: 6100000 },
    { month: 'May', gmv: 5800000 },
    { month: 'Jun', gmv: 7400000 },
    { month: 'Jul', gmv: 8100000 },
    { month: 'Aug', gmv: 8900000 },
  ],
}
