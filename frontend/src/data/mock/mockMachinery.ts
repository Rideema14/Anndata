export interface MachineryListing {
  id: string
  name: string
  ownerName: string
  location: string
  pricePerDay: number
  available: boolean
  rating: number
  description: string
}

export const mockMachineryListings: MachineryListing[] = [
  {
    id: 'mach_1',
    name: 'Mahindra 575 DI Tractor',
    ownerName: 'Indore Farm Equipment Co.',
    location: 'Indore',
    pricePerDay: 1800,
    available: true,
    rating: 4.6,
    description: '45 HP tractor, well-maintained, comes with a driver on request. Ideal for ploughing and tilling.',
  },
  {
    id: 'mach_2',
    name: 'Combine Harvester',
    ownerName: 'Rewa Farm Tools',
    location: 'Rewa',
    pricePerDay: 6500,
    available: true,
    rating: 4.4,
    description: 'Self-propelled combine harvester for wheat and soybean, operator included.',
  },
  {
    id: 'mach_3',
    name: 'Rotavator Attachment',
    ownerName: 'Krishi Seva Kendra',
    location: 'Jabalpur',
    pricePerDay: 900,
    available: false,
    rating: 4.2,
    description: '6-foot rotavator, compatible with tractors 35 HP and above. Currently booked.',
  },
  {
    id: 'mach_4',
    name: 'Seed Drill Machine',
    ownerName: 'Madhya Bharat Agro',
    location: 'Katni',
    pricePerDay: 700,
    available: true,
    rating: 4.5,
    description: '9-tyne seed drill for precise row sowing, reduces seed wastage significantly.',
  },
]

export function getMachineryById(id: string): MachineryListing | undefined {
  return mockMachineryListings.find((m) => m.id === id)
}
