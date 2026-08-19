import type { User } from '@/types'

/**
 * Rajesh Kumar demonstrates the core architectural requirement: ONE account,
 * BOTH buyer and seller capabilities, no separate seller login. He is the
 * default signed-in mock user for this frontend milestone.
 */
export const mockUsers: User[] = [
  {
    id: 'usr_rajesh',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@example.com',
    location: 'Katni, Madhya Pradesh',
    language: 'hi',
    roles: ['buyer', 'seller'],
    sellerVerification: 'verified',
    addresses: [
      {
        id: 'addr_1',
        label: 'Farm House',
        line1: 'Village Bahoriband, Near Primary School',
        city: 'Katni',
        state: 'Madhya Pradesh',
        pincode: '483501',
        isDefault: true,
      },
    ],
    createdAt: '2025-02-11T08:00:00.000Z',
  },
  {
    id: 'usr_sunita',
    name: 'Sunita Verma',
    phone: '+91 91234 56780',
    email: 'sunita.verma@example.com',
    location: 'Indore, Madhya Pradesh',
    language: 'en',
    roles: ['buyer'],
    sellerVerification: 'none',
    addresses: [
      {
        id: 'addr_2',
        label: 'Home',
        line1: '14, Krishna Nagar',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        isDefault: true,
      },
    ],
    createdAt: '2025-05-03T08:00:00.000Z',
  },
  {
    id: 'usr_gurpreet',
    name: 'Gurpreet Singh',
    phone: '+91 90000 11223',
    location: 'Bhopal, Madhya Pradesh',
    language: 'en',
    roles: ['buyer', 'seller'],
    sellerVerification: 'pending',
    addresses: [
      {
        id: 'addr_3',
        label: 'Farm',
        line1: 'Khasra No. 212, Berasia Road',
        city: 'Bhopal',
        state: 'Madhya Pradesh',
        pincode: '462038',
        isDefault: true,
      },
    ],
    createdAt: '2025-07-22T08:00:00.000Z',
  },
]

export const defaultMockUser = mockUsers[0]
